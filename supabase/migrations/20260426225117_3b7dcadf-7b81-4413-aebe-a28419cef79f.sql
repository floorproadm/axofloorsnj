-- Make Before optional: only After is required for project completion.
-- Update validate_project_completion to reflect new rule.
CREATE OR REPLACE FUNCTION public.validate_project_completion(p_project_id uuid)
 RETURNS TABLE(can_complete boolean, error_message text, has_before_image boolean, has_after_image boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_has_before BOOLEAN := FALSE;
  v_has_after BOOLEAN := FALSE;
  v_can_complete BOOLEAN := FALSE;
  v_error_message TEXT := NULL;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.job_proof jp
    WHERE jp.project_id = p_project_id
      AND jp.before_image_url IS NOT NULL
      AND jp.before_image_url != ''
  ) INTO v_has_before;

  SELECT EXISTS(
    SELECT 1 FROM public.job_proof jp
    WHERE jp.project_id = p_project_id
      AND jp.after_image_url IS NOT NULL
      AND jp.after_image_url != ''
  ) INTO v_has_after;

  -- New rule: only After is required. Before is recommended but optional.
  IF NOT v_has_after THEN
    v_can_complete := FALSE;
    v_error_message := 'BLOCKED: Missing AFTER photo. Upload at least 1 after photo to complete.';
  ELSE
    v_can_complete := TRUE;
    v_error_message := NULL;
  END IF;

  IF NOT v_can_complete THEN
    INSERT INTO public.audit_log (
      user_id, user_role, operation_type, table_accessed, data_classification
    ) VALUES (
      auth.uid(), 'authenticated', 'COMPLETION_BLOCKED', 'projects',
      'PROOF_MISSING_AFTER: project_id=' || p_project_id || ', before=' || v_has_before || ', after=' || v_has_after
    );
  END IF;

  RETURN QUERY SELECT v_can_complete, v_error_message, v_has_before, v_has_after;
END;
$function$;

-- Adjust next-action computation: Before becomes a soft suggestion, After remains critical.
CREATE OR REPLACE FUNCTION public.compute_project_next_action(p_project_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_project public.projects%ROWTYPE;
  v_has_costs boolean;
  v_margin numeric;
  v_min_margin numeric;
  v_has_before boolean;
  v_has_after boolean;
  v_has_invoice boolean;
  v_balance_due numeric;
  v_action text;
  v_action_date date;
BEGIN
  SELECT * INTO v_project FROM public.projects WHERE id = p_project_id;
  IF v_project.id IS NULL THEN RETURN; END IF;

  SELECT COALESCE(default_margin_min_percent, 30) INTO v_min_margin FROM public.company_settings LIMIT 1;

  SELECT EXISTS(SELECT 1 FROM public.job_costs WHERE project_id = p_project_id AND (labor_cost > 0 OR material_cost > 0)) INTO v_has_costs;
  SELECT margin_percent INTO v_margin FROM public.job_costs WHERE project_id = p_project_id;

  SELECT
    EXISTS(SELECT 1 FROM public.job_proof WHERE project_id = p_project_id AND before_image_url IS NOT NULL AND before_image_url != ''),
    EXISTS(SELECT 1 FROM public.job_proof WHERE project_id = p_project_id AND after_image_url IS NOT NULL AND after_image_url != '')
  INTO v_has_before, v_has_after;

  SELECT EXISTS(SELECT 1 FROM public.invoices WHERE project_id = p_project_id) INTO v_has_invoice;

  SELECT COALESCE(SUM(i.amount) - COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.project_id = p_project_id AND p.category = 'received' AND p.status = 'completed'), 0), 0)
  INTO v_balance_due
  FROM public.invoices i WHERE i.project_id = p_project_id;

  IF v_project.project_status = 'completed' THEN
    IF v_balance_due > 0 THEN
      v_action := 'Cobrar saldo pendente: $' || round(v_balance_due, 0);
      v_action_date := CURRENT_DATE;
    ELSIF NOT v_has_after THEN
      v_action := 'Enviar foto AFTER do projeto';
      v_action_date := CURRENT_DATE;
    ELSE
      v_action := 'Job finalizado ✓';
      v_action_date := NULL;
    END IF;
  ELSIF NOT v_has_costs THEN
    v_action := 'Preencher custos do projeto (material + labor)';
    v_action_date := CURRENT_DATE;
  ELSIF v_margin IS NOT NULL AND v_margin < v_min_margin THEN
    v_action := 'Margem ' || round(v_margin, 1) || '% abaixo do mínimo ' || round(v_min_margin, 1) || '% — ajustar valores';
    v_action_date := CURRENT_DATE;
  ELSIF v_project.project_status = 'in_progress' AND NOT v_has_after THEN
    v_action := 'Enviar foto AFTER do projeto';
    v_action_date := CURRENT_DATE;
  ELSIF v_project.project_status = 'in_progress' AND NOT v_has_before THEN
    v_action := 'Sugerido: enviar foto BEFORE (opcional)';
    v_action_date := CURRENT_DATE + INTERVAL '1 day';
  ELSIF v_project.project_status = 'in_progress' AND NOT v_has_invoice THEN
    v_action := 'Criar invoice para o projeto';
    v_action_date := CURRENT_DATE + INTERVAL '1 day';
  ELSIF v_balance_due > 0 THEN
    v_action := 'Receber pagamento pendente: $' || round(v_balance_due, 0);
    v_action_date := CURRENT_DATE;
  ELSIF v_project.project_status = 'pending' THEN
    v_action := 'Definir data de início e iniciar execução';
    v_action_date := CURRENT_DATE;
  ELSE
    v_action := NULL;
    v_action_date := NULL;
  END IF;

  UPDATE public.projects
  SET next_action = v_action, next_action_date = v_action_date
  WHERE id = p_project_id;
END;
$function$;

-- Adjust lead NRA: only AFTER blocks; BEFORE is just a soft suggestion.
CREATE OR REPLACE FUNCTION public.get_lead_nra(p_lead_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_margin numeric;
  v_min_margin numeric;
  v_has_before boolean;
  v_has_after boolean;
BEGIN
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
  IF v_lead.id IS NULL THEN
    RETURN jsonb_build_object('action', 'none', 'label', 'Lead não encontrado', 'severity', 'error');
  END IF;
  IF v_lead.status IN ('completed', 'lost') THEN
    RETURN jsonb_build_object('action', 'none', 'label', 'Finalizado', 'severity', 'none');
  END IF;
  IF v_lead.status = 'cold_lead' THEN
    RETURN jsonb_build_object('action', 'warm_up', 'label', 'Fazer primeiro contato', 'severity', 'normal');
  END IF;
  IF v_lead.status = 'warm_lead' THEN
    RETURN jsonb_build_object('action', 'request_estimate', 'label', 'Solicitar estimativa', 'severity', 'normal');
  END IF;
  IF v_lead.status = 'estimate_requested' THEN
    RETURN jsonb_build_object('action', 'schedule_estimate', 'label', 'Agendar visita técnica', 'severity', 'normal');
  END IF;
  IF v_lead.status = 'estimate_scheduled' THEN
    IF v_lead.converted_to_project_id IS NULL THEN
      RETURN jsonb_build_object('action', 'convert_to_project', 'label', 'Criar projeto e calcular custos', 'severity', 'critical');
    ELSE
      SELECT jc.margin_percent INTO v_margin FROM public.job_costs jc WHERE jc.project_id = v_lead.converted_to_project_id;
      SELECT default_margin_min_percent INTO v_min_margin FROM public.company_settings LIMIT 1;
      v_min_margin := COALESCE(v_min_margin, 30);
      IF v_margin IS NULL OR v_margin <= 0 THEN
        RETURN jsonb_build_object('action', 'enter_job_costs', 'label', 'Preencher custos do projeto', 'severity', 'critical');
      END IF;
      IF v_margin < v_min_margin THEN
        RETURN jsonb_build_object('action', 'fix_margin', 'label', 'Margem ' || round(v_margin, 1) || '% abaixo do mínimo ' || round(v_min_margin, 1) || '%', 'severity', 'blocked');
      END IF;
      RETURN jsonb_build_object('action', 'advance_to_draft', 'label', 'Avançar para In Draft', 'severity', 'normal');
    END IF;
  END IF;
  IF v_lead.status = 'in_draft' THEN
    RETURN jsonb_build_object('action', 'send_proposal', 'label', 'Enviar proposta ao cliente', 'severity', 'normal');
  END IF;
  IF v_lead.status = 'proposal_sent' THEN
    IF v_lead.follow_up_actions IS NULL OR jsonb_array_length(v_lead.follow_up_actions) = 0 THEN
      RETURN jsonb_build_object('action', 'record_follow_up', 'label', 'Registrar follow-up obrigatório', 'severity', 'critical');
    END IF;
    RETURN jsonb_build_object('action', 'advance_pipeline', 'label', 'Fechar: Production ou Rejected', 'severity', 'normal');
  END IF;
  IF v_lead.status = 'proposal_rejected' THEN
    RETURN jsonb_build_object('action', 'reopen_draft', 'label', 'Reabrir como In Draft', 'severity', 'normal');
  END IF;
  IF v_lead.status = 'in_production' THEN
    IF v_lead.converted_to_project_id IS NOT NULL THEN
      SELECT
        EXISTS(SELECT 1 FROM public.job_proof jp WHERE jp.project_id = v_lead.converted_to_project_id AND jp.before_image_url IS NOT NULL AND jp.before_image_url != ''),
        EXISTS(SELECT 1 FROM public.job_proof jp WHERE jp.project_id = v_lead.converted_to_project_id AND jp.after_image_url IS NOT NULL AND jp.after_image_url != '')
      INTO v_has_before, v_has_after;
      IF NOT v_has_after THEN
        RETURN jsonb_build_object('action', 'upload_after_photo', 'label', 'Enviar foto AFTER (obrigatório)', 'severity', 'critical');
      END IF;
      IF NOT v_has_before THEN
        RETURN jsonb_build_object('action', 'upload_before_photo', 'label', 'Sugerido: enviar foto BEFORE (opcional)', 'severity', 'normal');
      END IF;
    END IF;
    RETURN jsonb_build_object('action', 'complete_job', 'label', 'Finalizar job', 'severity', 'normal');
  END IF;
  RETURN jsonb_build_object('action', 'unknown', 'label', 'Estado desconhecido', 'severity', 'error');
END;
$function$;