
-- ============================================================
-- LEAD → CUSTOMER → PROJECT — Schema foundation
-- ============================================================

-- 1) lead_measurements (espelho de project_measurements)
CREATE TABLE IF NOT EXISTS public.lead_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  measurement_date timestamptz,
  measured_by text,
  total_sqft numeric NOT NULL DEFAULT 0,
  total_linear_ft numeric NOT NULL DEFAULT 0,
  service_type text,
  material text,
  finish_type text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_measurements_lead ON public.lead_measurements(lead_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_measurements TO authenticated;
GRANT ALL ON public.lead_measurements TO service_role;
ALTER TABLE public.lead_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_measurements org access"
ON public.lead_measurements FOR ALL TO authenticated
USING (organization_id = public.get_user_org_id())
WITH CHECK (organization_id = public.get_user_org_id());

CREATE TRIGGER trg_lead_measurements_updated
BEFORE UPDATE ON public.lead_measurements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) lead_measurement_areas
CREATE TABLE IF NOT EXISTS public.lead_measurement_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_id uuid NOT NULL REFERENCES public.lead_measurements(id) ON DELETE CASCADE,
  room_name text NOT NULL,
  area_sqft numeric NOT NULL DEFAULT 0,
  linear_ft numeric NOT NULL DEFAULT 0,
  dimensions text,
  area_type text NOT NULL DEFAULT 'floor',
  service_type text,
  notes text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_measurement_areas_m ON public.lead_measurement_areas(measurement_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_measurement_areas TO authenticated;
GRANT ALL ON public.lead_measurement_areas TO service_role;
ALTER TABLE public.lead_measurement_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_measurement_areas via parent"
ON public.lead_measurement_areas FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.lead_measurements m WHERE m.id = measurement_id AND m.organization_id = public.get_user_org_id()))
WITH CHECK (EXISTS (SELECT 1 FROM public.lead_measurements m WHERE m.id = measurement_id AND m.organization_id = public.get_user_org_id()));

-- 3) Recalculate totals when areas change
CREATE OR REPLACE FUNCTION public.recalc_lead_measurement_totals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.lead_measurements lm
  SET total_sqft = COALESCE((SELECT SUM(area_sqft) FROM public.lead_measurement_areas WHERE measurement_id = lm.id AND area_type = 'floor'), 0),
      total_linear_ft = COALESCE((SELECT SUM(linear_ft) FROM public.lead_measurement_areas WHERE measurement_id = lm.id AND area_type IN ('baseboard','handrail')), 0),
      updated_at = now()
  WHERE lm.id = COALESCE(NEW.measurement_id, OLD.measurement_id);
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_recalc_lead_meas_totals
AFTER INSERT OR UPDATE OR DELETE ON public.lead_measurement_areas
FOR EACH ROW EXECUTE FUNCTION public.recalc_lead_measurement_totals();

-- 4) proposals: allow lead-scoped proposals (no project yet)
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;
ALTER TABLE public.proposals ALTER COLUMN project_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_lead ON public.proposals(lead_id);

-- Ensure proposal has at least one parent
ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_parent_chk;
ALTER TABLE public.proposals ADD CONSTRAINT proposals_parent_chk
  CHECK (project_id IS NOT NULL OR lead_id IS NOT NULL);

-- 5) Relax validate_proposal_margin to accept lead-only proposals (no costs yet)
-- existing function still works for project flow; lead flow bypasses via direct insert path

-- 6) RPC: convert lead → customer + project + transfer measurements + accept proposal
CREATE OR REPLACE FUNCTION public.convert_lead_to_full_project(p_lead_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_customer_id uuid;
  v_project_id uuid;
  v_org uuid;
  v_proposal_id uuid;
  v_proposal_value numeric;
  v_lead_meas record;
  v_new_meas_id uuid;
BEGIN
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id AND deleted_at IS NULL;
  IF v_lead.id IS NULL THEN RAISE EXCEPTION 'Lead não encontrado'; END IF;
  IF v_lead.converted_to_project_id IS NOT NULL THEN
    RETURN v_lead.converted_to_project_id;
  END IF;

  v_org := v_lead.organization_id;

  -- a) Customer (reuse if linked, else create)
  IF v_lead.customer_id IS NOT NULL THEN
    v_customer_id := v_lead.customer_id;
  ELSE
    INSERT INTO public.customers (full_name, email, phone, address, city, zip_code, organization_id)
    VALUES (v_lead.name, v_lead.email, v_lead.phone, v_lead.address, v_lead.city, v_lead.zip_code, v_org)
    RETURNING id INTO v_customer_id;
  END IF;

  -- b) Proposal value (best available)
  SELECT id, COALESCE(NULLIF(flat_price,0), GREATEST(COALESCE(best_price,0), COALESCE(better_price,0), COALESCE(good_price,0)))
  INTO v_proposal_id, v_proposal_value
  FROM public.proposals
  WHERE lead_id = p_lead_id
  ORDER BY created_at DESC LIMIT 1;

  -- c) Project
  INSERT INTO public.projects (
    customer_name, customer_email, customer_phone, address, city, zip_code,
    customer_id, project_status, project_type, estimated_cost, organization_id
  ) VALUES (
    v_lead.name,
    COALESCE(v_lead.email, ''),
    COALESCE(v_lead.phone, ''),
    v_lead.address, v_lead.city, v_lead.zip_code,
    v_customer_id, 'pending',
    COALESCE((v_lead.services->>0)::text, 'refinishing'),
    COALESCE(v_proposal_value, v_lead.budget, 0),
    v_org
  ) RETURNING id INTO v_project_id;

  -- d) Transfer measurements: lead_measurements → project_measurements
  FOR v_lead_meas IN SELECT * FROM public.lead_measurements WHERE lead_id = p_lead_id LOOP
    INSERT INTO public.project_measurements (
      project_id, status, measurement_date, measured_by, total_sqft, total_linear_ft,
      service_type, material, finish_type, notes
    ) VALUES (
      v_project_id, v_lead_meas.status, v_lead_meas.measurement_date, v_lead_meas.measured_by,
      v_lead_meas.total_sqft, v_lead_meas.total_linear_ft,
      v_lead_meas.service_type, v_lead_meas.material, v_lead_meas.finish_type, v_lead_meas.notes
    ) RETURNING id INTO v_new_meas_id;

    INSERT INTO public.measurement_areas (measurement_id, room_name, area_sqft, linear_ft, dimensions, area_type, notes, display_order)
    SELECT v_new_meas_id, room_name, area_sqft, linear_ft, dimensions, area_type, notes, display_order
    FROM public.lead_measurement_areas WHERE measurement_id = v_lead_meas.id;
  END LOOP;

  -- e) Promote proposal: bind to project, mark accepted
  IF v_proposal_id IS NOT NULL THEN
    UPDATE public.proposals
    SET project_id = v_project_id,
        customer_id = v_customer_id,
        lead_id = NULL,
        status = CASE WHEN status IN ('accepted') THEN status ELSE 'accepted' END,
        accepted_at = COALESCE(accepted_at, now()),
        selected_tier = COALESCE(selected_tier, CASE WHEN flat_price IS NULL THEN 'better' ELSE NULL END),
        updated_at = now()
    WHERE id = v_proposal_id;
  END IF;

  -- f) Update lead
  UPDATE public.leads
  SET status = 'in_production',
      customer_id = v_customer_id,
      converted_to_project_id = v_project_id,
      updated_at = now()
  WHERE id = p_lead_id;

  RETURN v_project_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.convert_lead_to_full_project(uuid) TO authenticated;

-- 7) Loosen lead transition: allow proposal_sent → in_production WITHOUT requiring
-- linked project (RPC above creates project as part of conversion)
CREATE OR REPLACE FUNCTION public.axo_validate_lead_transition()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old_status text := COALESCE(OLD.status, '');
  v_new_status text := COALESCE(NEW.status, '');
  v_has_followups boolean;
  v_valid_next text[];
BEGIN
  IF v_old_status = v_new_status THEN RETURN NEW; END IF;

  CASE v_old_status
    WHEN 'cold_lead' THEN v_valid_next := ARRAY['warm_lead'];
    WHEN 'warm_lead' THEN v_valid_next := ARRAY['estimate_requested'];
    WHEN 'estimate_requested' THEN v_valid_next := ARRAY['estimate_scheduled'];
    WHEN 'estimate_scheduled' THEN v_valid_next := ARRAY['in_draft'];
    WHEN 'in_draft' THEN v_valid_next := ARRAY['proposal_sent'];
    WHEN 'proposal_sent' THEN v_valid_next := ARRAY['in_production','proposal_rejected'];
    WHEN 'proposal_rejected' THEN v_valid_next := ARRAY['in_draft'];
    WHEN 'in_production' THEN v_valid_next := ARRAY['completed','lost'];
    WHEN 'completed' THEN RAISE EXCEPTION 'Pipeline bloqueado: completed é terminal';
    WHEN 'lost' THEN RAISE EXCEPTION 'Pipeline bloqueado: lost é terminal';
    ELSE RETURN NEW;
  END CASE;

  IF NOT (v_new_status = ANY(v_valid_next)) THEN
    RAISE EXCEPTION 'Pipeline bloqueado: % → % não permitido. Permitidos: %', v_old_status, v_new_status, array_to_string(v_valid_next, ', ');
  END IF;

  IF v_old_status = 'proposal_sent' AND v_new_status IN ('in_production','proposal_rejected') THEN
    v_has_followups := (jsonb_array_length(COALESCE(NEW.follow_up_actions, '[]'::jsonb)) > 0);
    IF NOT v_has_followups AND v_new_status = 'proposal_rejected' THEN
      RAISE EXCEPTION 'Bloqueado: registre pelo menos 1 follow-up antes de rejeitar';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
