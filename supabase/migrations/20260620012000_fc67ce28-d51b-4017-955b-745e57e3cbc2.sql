
CREATE OR REPLACE FUNCTION public.get_lead_nra(p_lead_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_lead public.leads%ROWTYPE;
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
    RETURN jsonb_build_object('action', 'advance_to_draft', 'label', 'Avançar para Em Elaboração', 'severity', 'normal');
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
  v_proposal_status text;
  v_valid_next text[];
BEGIN
  IF v_old_status = v_new_status THEN
    RETURN NEW;
  END IF;

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
      RETURN NEW;
  END CASE;

  IF NOT (v_new_status = ANY(v_valid_next)) THEN
    RAISE EXCEPTION 'Pipeline bloqueado: % → % não permitido. Permitidos: %', v_old_status, v_new_status, array_to_string(v_valid_next, ', ');
  END IF;

  -- GATE: leaving proposal_sent requires follow-up
  IF v_old_status = 'proposal_sent' AND v_new_status IN ('in_production', 'proposal_rejected') THEN
    v_has_followups := (jsonb_array_length(COALESCE(NEW.follow_up_actions, '[]'::jsonb)) > 0);
    IF NOT v_has_followups THEN
      RAISE EXCEPTION 'Bloqueado: registre pelo menos 1 follow-up antes de sair de Proposal Sent';
    END IF;
  END IF;

  -- GATE: proposal_sent → in_production requires accepted proposal (if project linked)
  IF v_old_status = 'proposal_sent' AND v_new_status = 'in_production' AND NEW.converted_to_project_id IS NOT NULL THEN
    SELECT p.status INTO v_proposal_status
    FROM public.proposals p
    WHERE p.project_id = NEW.converted_to_project_id AND p.status = 'accepted'
    LIMIT 1;
    -- Soft-check: only enforce if a proposal exists for this project
    IF v_proposal_status IS NULL AND EXISTS (
      SELECT 1 FROM public.proposals p WHERE p.project_id = NEW.converted_to_project_id
    ) THEN
      RAISE EXCEPTION 'Bloqueado: proposta precisa estar aceita antes de iniciar produção.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
