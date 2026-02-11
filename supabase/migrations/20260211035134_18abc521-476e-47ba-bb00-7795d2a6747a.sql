
-- NRA: Next Required Action — deterministic, read-only function
CREATE OR REPLACE FUNCTION public.get_lead_nra(p_lead_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_margin numeric;
  v_min_margin numeric;
  v_has_before boolean;
  v_has_after boolean;
  v_has_costs boolean;
BEGIN
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
  
  IF v_lead.id IS NULL THEN
    RETURN jsonb_build_object('action', 'none', 'label', 'Lead não encontrado', 'severity', 'error');
  END IF;

  -- Terminal states
  IF v_lead.status IN ('completed', 'lost') THEN
    RETURN jsonb_build_object('action', 'none', 'label', 'Finalizado', 'severity', 'none');
  END IF;

  -- new_lead → must schedule visit
  IF v_lead.status = 'new_lead' THEN
    RETURN jsonb_build_object(
      'action', 'schedule_visit',
      'label', 'Agendar visita',
      'severity', 'normal'
    );
  END IF;

  -- appt_scheduled → must convert to project
  IF v_lead.status = 'appt_scheduled' THEN
    IF v_lead.converted_to_project_id IS NULL THEN
      RETURN jsonb_build_object(
        'action', 'convert_to_project',
        'label', 'Criar projeto e calcular custos',
        'severity', 'critical'
      );
    ELSE
      -- Has project, check if margin is ready
      SELECT jc.margin_percent INTO v_margin 
      FROM public.job_costs jc 
      WHERE jc.project_id = v_lead.converted_to_project_id;
      
      SELECT default_margin_min_percent INTO v_min_margin FROM public.company_settings LIMIT 1;
      v_min_margin := COALESCE(v_min_margin, 30);

      IF v_margin IS NULL OR v_margin <= 0 THEN
        RETURN jsonb_build_object(
          'action', 'enter_job_costs',
          'label', 'Preencher custos do projeto',
          'severity', 'critical'
        );
      END IF;

      IF v_margin < v_min_margin THEN
        RETURN jsonb_build_object(
          'action', 'fix_margin',
          'label', 'Margem ' || round(v_margin, 1) || '% abaixo do mínimo ' || round(v_min_margin, 1) || '%',
          'severity', 'blocked'
        );
      END IF;

      RETURN jsonb_build_object(
        'action', 'advance_to_proposal',
        'label', 'Avançar para Proposta',
        'severity', 'normal'
      );
    END IF;
  END IF;

  -- proposal → must have follow-up recorded
  IF v_lead.status = 'proposal' THEN
    IF v_lead.follow_up_actions IS NULL OR jsonb_array_length(v_lead.follow_up_actions) = 0 THEN
      RETURN jsonb_build_object(
        'action', 'record_follow_up',
        'label', 'Registrar follow-up obrigatório',
        'severity', 'critical'
      );
    END IF;

    RETURN jsonb_build_object(
      'action', 'advance_pipeline',
      'label', 'Fechar como Won ou Lost',
      'severity', 'normal'
    );
  END IF;

  -- in_production → check job proof
  IF v_lead.status = 'in_production' THEN
    IF v_lead.converted_to_project_id IS NOT NULL THEN
      SELECT 
        EXISTS(SELECT 1 FROM public.job_proof jp WHERE jp.project_id = v_lead.converted_to_project_id AND jp.before_image_url IS NOT NULL AND jp.before_image_url != ''),
        EXISTS(SELECT 1 FROM public.job_proof jp WHERE jp.project_id = v_lead.converted_to_project_id AND jp.after_image_url IS NOT NULL AND jp.after_image_url != '')
      INTO v_has_before, v_has_after;

      IF NOT v_has_before AND NOT v_has_after THEN
        RETURN jsonb_build_object(
          'action', 'upload_photos',
          'label', 'Enviar fotos before & after',
          'severity', 'critical'
        );
      END IF;

      IF NOT v_has_before THEN
        RETURN jsonb_build_object(
          'action', 'upload_before_photo',
          'label', 'Enviar foto BEFORE',
          'severity', 'critical'
        );
      END IF;

      IF NOT v_has_after THEN
        RETURN jsonb_build_object(
          'action', 'upload_after_photo',
          'label', 'Enviar foto AFTER',
          'severity', 'critical'
        );
      END IF;
    END IF;

    RETURN jsonb_build_object(
      'action', 'complete_job',
      'label', 'Finalizar job',
      'severity', 'normal'
    );
  END IF;

  -- Fallback
  RETURN jsonb_build_object('action', 'unknown', 'label', 'Estado desconhecido', 'severity', 'error');
END;
$$;
