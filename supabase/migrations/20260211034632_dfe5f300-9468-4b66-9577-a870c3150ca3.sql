CREATE OR REPLACE FUNCTION public.axo_validate_lead_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_status text := COALESCE(OLD.status, '');
  v_new_status text := COALESCE(NEW.status, '');
  v_has_followups boolean;
  v_min_margin numeric;
  v_margin numeric;
BEGIN
  IF v_old_status = v_new_status THEN
    RETURN NEW;
  END IF;

  v_has_followups := (jsonb_array_length(COALESCE(NEW.follow_up_actions, '[]'::jsonb)) > 0);

  IF v_old_status = 'new_lead' AND v_new_status <> 'appt_scheduled' THEN
    RAISE EXCEPTION 'Pipeline bloqueado: % → % não permitido. Próximo: appt_scheduled', v_old_status, v_new_status;
  END IF;

  IF v_old_status = 'appt_scheduled' AND v_new_status <> 'proposal' THEN
    RAISE EXCEPTION 'Pipeline bloqueado: % → % não permitido. Próximo: proposal', v_old_status, v_new_status;
  END IF;

  IF v_old_status = 'proposal' AND v_new_status NOT IN ('in_production', 'lost') THEN
    RAISE EXCEPTION 'Pipeline bloqueado: % → % não permitido. De proposal: in_production ou lost', v_old_status, v_new_status;
  END IF;

  IF v_old_status = 'in_production' AND v_new_status NOT IN ('completed', 'lost') THEN
    RAISE EXCEPTION 'Pipeline bloqueado: % → % não permitido. De in_production: completed ou lost', v_old_status, v_new_status;
  END IF;

  IF v_old_status IN ('completed', 'lost') THEN
    RAISE EXCEPTION 'Pipeline bloqueado: % é estado terminal, não pode mudar', v_old_status;
  END IF;

  IF v_new_status = 'proposal' THEN
    IF NEW.converted_to_project_id IS NULL THEN
      RAISE EXCEPTION 'Bloqueado: lead precisa estar linkado a um projeto antes de entrar em proposal';
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

  IF v_old_status = 'proposal' AND v_new_status IN ('in_production', 'lost') THEN
    IF NOT v_has_followups THEN
      RAISE EXCEPTION 'Bloqueado: registre pelo menos 1 follow-up antes de sair de proposal';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;