
-- ============================================================
-- STEP 1: FIRST rewrite the trigger to accept ALL statuses during migration
-- Temporarily allow any transition so data migration can proceed
-- ============================================================
CREATE OR REPLACE FUNCTION public.axo_validate_lead_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_old_status text := COALESCE(OLD.status, '');
  v_new_status text := COALESCE(NEW.status, '');
  v_has_followups boolean;
  v_min_margin numeric;
  v_margin numeric;
  v_proposal_status text;
  v_valid_next text[];
BEGIN
  IF v_old_status = v_new_status THEN
    RETURN NEW;
  END IF;

  -- Define valid transitions for the expanded pipeline
  CASE v_old_status
    WHEN 'cold_lead' THEN v_valid_next := ARRAY['warm_lead'];
    WHEN 'warm_lead' THEN v_valid_next := ARRAY['estimate_requested'];
    WHEN 'estimate_requested' THEN v_valid_next := ARRAY['estimate_scheduled'];
    WHEN 'estimate_scheduled' THEN v_valid_next := ARRAY['in_draft'];
    WHEN 'in_draft' THEN v_valid_next := ARRAY['proposal_sent'];
    WHEN 'proposal_sent' THEN v_valid_next := ARRAY['in_production', 'proposal_rejected'];
    WHEN 'proposal_rejected' THEN v_valid_next := ARRAY['in_draft'];
    WHEN 'in_production' THEN v_valid_next := ARRAY['completed', 'lost'];
    WHEN 'completed' THEN
      RAISE EXCEPTION 'Pipeline bloqueado: completed é estado terminal';
    WHEN 'lost' THEN
      RAISE EXCEPTION 'Pipeline bloqueado: lost é estado terminal';
    ELSE
      -- Allow legacy statuses to transition to new ones (migration compatibility)
      RETURN NEW;
  END CASE;

  IF NOT (v_new_status = ANY(v_valid_next)) THEN
    RAISE EXCEPTION 'Pipeline bloqueado: % → % não permitido. Permitidos: %', v_old_status, v_new_status, array_to_string(v_valid_next, ', ');
  END IF;

  -- GATE: in_draft requires project linked + margin
  IF v_new_status = 'in_draft' THEN
    IF NEW.converted_to_project_id IS NULL THEN
      RAISE EXCEPTION 'Bloqueado: lead precisa estar linkado a um projeto antes de entrar em In Draft';
    END IF;
    SELECT default_margin_min_percent INTO v_min_margin FROM public.company_settings LIMIT 1;
    v_min_margin := COALESCE(v_min_margin, 30);
    SELECT jc.margin_percent INTO v_margin FROM public.job_costs jc WHERE jc.project_id = NEW.converted_to_project_id;
    IF v_margin IS NULL THEN
      RAISE EXCEPTION 'Bloqueado: job_costs não encontrado para o projeto linkado';
    END IF;
    IF v_margin < v_min_margin THEN
      RAISE EXCEPTION '%', 'Bloqueado: margem ' || round(v_margin, 2) || '% abaixo do mínimo ' || round(v_min_margin, 2) || '%';
    END IF;
  END IF;

  -- GATE: leaving proposal_sent requires follow-up
  IF v_old_status = 'proposal_sent' AND v_new_status IN ('in_production', 'proposal_rejected') THEN
    v_has_followups := (jsonb_array_length(COALESCE(NEW.follow_up_actions, '[]'::jsonb)) > 0);
    IF NOT v_has_followups THEN
      RAISE EXCEPTION 'Bloqueado: registre pelo menos 1 follow-up antes de sair de Proposal Sent';
    END IF;
  END IF;

  -- GATE: proposal_sent → in_production requires accepted proposal
  IF v_old_status = 'proposal_sent' AND v_new_status = 'in_production' THEN
    SELECT p.status INTO v_proposal_status
    FROM public.proposals p
    WHERE p.project_id = NEW.converted_to_project_id AND p.status = 'accepted'
    LIMIT 1;
    IF v_proposal_status IS NULL THEN
      RAISE EXCEPTION 'Bloqueado: proposta precisa estar aceita antes de iniciar produção.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- ============================================================
-- STEP 2: Now migrate data (trigger allows legacy → new transitions)
-- ============================================================
UPDATE public.leads SET status = 'cold_lead' WHERE status = 'new_lead';
UPDATE public.leads SET status = 'estimate_scheduled' WHERE status = 'appt_scheduled';
UPDATE public.leads SET status = 'proposal_sent' WHERE status = 'proposal';

-- Update default
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'cold_lead';

-- ============================================================
-- STEP 3: Rewrite get_lead_nra
-- ============================================================
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
      IF NOT v_has_before AND NOT v_has_after THEN
        RETURN jsonb_build_object('action', 'upload_photos', 'label', 'Enviar fotos before & after', 'severity', 'critical');
      END IF;
      IF NOT v_has_before THEN
        RETURN jsonb_build_object('action', 'upload_before_photo', 'label', 'Enviar foto BEFORE', 'severity', 'critical');
      END IF;
      IF NOT v_has_after THEN
        RETURN jsonb_build_object('action', 'upload_after_photo', 'label', 'Enviar foto AFTER', 'severity', 'critical');
      END IF;
    END IF;
    RETURN jsonb_build_object('action', 'complete_job', 'label', 'Finalizar job', 'severity', 'normal');
  END IF;
  RETURN jsonb_build_object('action', 'unknown', 'label', 'Estado desconhecido', 'severity', 'error');
END;
$function$;

-- ============================================================
-- STEP 4: Update set_follow_up_on_quoted for proposal_sent
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_follow_up_on_quoted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'proposal_sent' AND (OLD.status IS NULL OR OLD.status != 'proposal_sent') THEN
    NEW.follow_up_required := TRUE;
    IF NEW.next_action_date IS NULL THEN
      NEW.next_action_date := CURRENT_DATE + INTERVAL '2 days';
    END IF;
  END IF;
  IF NEW.status IN ('completed', 'lost', 'in_production') THEN
    NEW.follow_up_required := FALSE;
  END IF;
  RETURN NEW;
END;
$function$;

-- ============================================================
-- STEP 5: Update validate_lead_insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_lead_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF length(NEW.name) > 200 THEN RAISE EXCEPTION 'Nome excede limite de 200 caracteres'; END IF;
  IF length(NEW.phone) > 30 THEN RAISE EXCEPTION 'Telefone excede limite de 30 caracteres'; END IF;
  IF NEW.email IS NOT NULL AND length(NEW.email) > 255 THEN RAISE EXCEPTION 'Email excede limite de 255 caracteres'; END IF;
  IF NEW.message IS NOT NULL AND length(NEW.message) > 2000 THEN RAISE EXCEPTION 'Mensagem excede limite de 2000 caracteres'; END IF;
  IF NOT public.has_role(COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 'admin') THEN
    NEW.status := 'cold_lead';
    NEW.priority := 'medium';
    NEW.assigned_to := NULL;
    NEW.converted_to_project_id := NULL;
    NEW.customer_id := NULL;
    NEW.follow_up_actions := '[]'::jsonb;
  END IF;
  RETURN NEW;
END;
$function$;

-- ============================================================
-- STEP 6: Deprecate validate_lead_transition
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_lead_transition(p_lead_id uuid, p_new_status text)
 RETURNS TABLE(can_transition boolean, error_message text, current_status text, required_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_status TEXT;
BEGIN
  SELECT l.status INTO v_current_status FROM public.leads l WHERE l.id = p_lead_id;
  IF v_current_status IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Lead not found'::TEXT, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  RETURN QUERY SELECT TRUE, NULL::TEXT, v_current_status, NULL::TEXT;
END;
$function$;
