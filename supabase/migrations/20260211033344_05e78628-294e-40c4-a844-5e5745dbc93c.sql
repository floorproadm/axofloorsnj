
-- ============================================================
-- AXO OS vNEXT — PHASE 0+1+2: LOCKDOWN + ATOMIC CONVERSION + RPC MUTATIONS
-- ============================================================

-- STEP 1: Normalize existing status values to new pipeline names
UPDATE public.leads SET status = 'new_lead' WHERE status = 'new';
UPDATE public.leads SET status = 'appt_scheduled' WHERE status = 'contacted';
UPDATE public.leads SET status = 'proposal' WHERE status = 'quoted';
UPDATE public.leads SET status = 'completed' WHERE status = 'won';
-- 'lost' stays 'lost', 'proposal' stays 'proposal', 'in_production' stays 'in_production'

-- STEP 2: Pipeline validation TRIGGER (replaces UI-only validation)
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
  -- Same status = no-op
  IF v_old_status = v_new_status THEN
    RETURN NEW;
  END IF;

  -- Check follow_up_actions
  v_has_followups := (jsonb_array_length(COALESCE(NEW.follow_up_actions, '[]'::jsonb)) > 0);

  -- ===== ENFORCE LINEAR PIPELINE =====
  -- new_lead -> appt_scheduled ONLY
  IF v_old_status = 'new_lead' AND v_new_status <> 'appt_scheduled' THEN
    RAISE EXCEPTION 'Pipeline bloqueado: % → % não permitido. Próximo: appt_scheduled', v_old_status, v_new_status;
  END IF;

  -- appt_scheduled -> proposal ONLY
  IF v_old_status = 'appt_scheduled' AND v_new_status <> 'proposal' THEN
    RAISE EXCEPTION 'Pipeline bloqueado: % → % não permitido. Próximo: proposal', v_old_status, v_new_status;
  END IF;

  -- proposal -> in_production OR lost ONLY
  IF v_old_status = 'proposal' AND v_new_status NOT IN ('in_production', 'lost') THEN
    RAISE EXCEPTION 'Pipeline bloqueado: % → % não permitido. De proposal: in_production ou lost', v_old_status, v_new_status;
  END IF;

  -- in_production -> completed OR lost ONLY
  IF v_old_status = 'in_production' AND v_new_status NOT IN ('completed', 'lost') THEN
    RAISE EXCEPTION 'Pipeline bloqueado: % → % não permitido. De in_production: completed ou lost', v_old_status, v_new_status;
  END IF;

  -- completed and lost are TERMINAL - no transitions out
  IF v_old_status IN ('completed', 'lost') THEN
    RAISE EXCEPTION 'Pipeline bloqueado: % é estado terminal, não pode mudar', v_old_status;
  END IF;

  -- ===== GATE: proposal requires project link + margin =====
  IF v_new_status = 'proposal' THEN
    IF NEW.converted_to_project_id IS NULL THEN
      RAISE EXCEPTION 'Bloqueado: lead precisa estar linkado a um projeto antes de entrar em proposal';
    END IF;

    SELECT default_margin_min_percent INTO v_min_margin
    FROM public.company_settings LIMIT 1;
    v_min_margin := COALESCE(v_min_margin, 30);

    SELECT jc.margin_percent INTO v_margin
    FROM public.job_costs jc
    WHERE jc.project_id = NEW.converted_to_project_id;

    IF v_margin IS NULL THEN
      RAISE EXCEPTION 'Bloqueado: job_costs não encontrado para o projeto linkado';
    END IF;

    IF v_margin < v_min_margin THEN
      INSERT INTO public.audit_log(operation_type, table_accessed, data_classification, user_id, user_role)
      VALUES ('BLOCK_PROPOSAL_MARGIN', 'leads', 'margin=' || v_margin || '%, min=' || v_min_margin || '%, lead_id=' || NEW.id, auth.uid(), 'authenticated');
      RAISE EXCEPTION 'Bloqueado: margem %.2f%% abaixo do mínimo %.2f%%', v_margin, v_min_margin;
    END IF;
  END IF;

  -- ===== GATE: leaving proposal requires follow-up =====
  IF v_old_status = 'proposal' AND v_new_status IN ('in_production', 'lost') THEN
    IF NOT v_has_followups THEN
      INSERT INTO public.audit_log(operation_type, table_accessed, data_classification, user_id, user_role)
      VALUES ('BLOCK_NO_FOLLOWUP', 'leads', 'from=' || v_old_status || ', to=' || v_new_status || ', lead_id=' || NEW.id, auth.uid(), 'authenticated');
      RAISE EXCEPTION 'Bloqueado: registre pelo menos 1 follow-up antes de sair de proposal';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_lead_transition ON public.leads;
CREATE TRIGGER trg_validate_lead_transition
BEFORE UPDATE OF status ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.axo_validate_lead_transition();

-- STEP 3: Atomic Lead → Project Conversion RPC
CREATE OR REPLACE FUNCTION public.convert_lead_to_project(p_lead_id uuid, p_project_type text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_customer_id uuid;
  v_project_id uuid;
BEGIN
  -- Lock the lead row
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;

  IF v_lead.id IS NULL THEN
    RAISE EXCEPTION 'Lead não encontrado: %', p_lead_id;
  END IF;

  -- Already converted?
  IF v_lead.converted_to_project_id IS NOT NULL THEN
    RAISE EXCEPTION 'Lead já convertido para projeto: %', v_lead.converted_to_project_id;
  END IF;

  -- Find or create customer
  IF v_lead.customer_id IS NOT NULL THEN
    v_customer_id := v_lead.customer_id;
  ELSE
    INSERT INTO public.customers(full_name, email, phone, address, city, zip_code, notes)
    VALUES (v_lead.name, v_lead.email, v_lead.phone, v_lead.address, v_lead.city, v_lead.zip_code, v_lead.notes)
    RETURNING id INTO v_customer_id;
  END IF;

  -- Create project
  INSERT INTO public.projects(
    customer_id, customer_name, customer_email, customer_phone,
    project_type, project_status, address, city, zip_code, notes
  )
  VALUES (
    v_customer_id, v_lead.name, COALESCE(v_lead.email, ''), v_lead.phone,
    p_project_type, 'pending', v_lead.address, v_lead.city, v_lead.zip_code, v_lead.notes
  )
  RETURNING id INTO v_project_id;

  -- Ensure job_costs exists (zeroed out, ready for input)
  INSERT INTO public.job_costs(project_id, labor_cost, material_cost, additional_costs, estimated_revenue)
  VALUES (v_project_id, 0, 0, 0, 0);

  -- Link lead to customer and project
  UPDATE public.leads
  SET customer_id = v_customer_id,
      converted_to_project_id = v_project_id
  WHERE id = p_lead_id;

  -- Audit log
  INSERT INTO public.audit_log(operation_type, table_accessed, data_classification, user_id, user_role)
  VALUES ('LEAD_CONVERTED', 'leads', 'lead_id=' || p_lead_id || ', project_id=' || v_project_id || ', customer_id=' || v_customer_id, auth.uid(), 'authenticated');

  RETURN v_project_id;
END;
$$;

-- STEP 4: RPC for status transitions (no more direct .update())
CREATE OR REPLACE FUNCTION public.transition_lead_status(p_lead_id uuid, p_new_status text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lead public.leads;
BEGIN
  UPDATE public.leads
  SET status = p_new_status,
      updated_at = now()
  WHERE id = p_lead_id
  RETURNING * INTO v_lead;

  IF v_lead.id IS NULL THEN
    RAISE EXCEPTION 'Lead não encontrado: %', p_lead_id;
  END IF;

  -- The trigger axo_validate_lead_transition handles ALL validation
  -- If we get here, transition was valid

  RETURN row_to_json(v_lead);
END;
$$;

-- STEP 5: RLS LOCKDOWN
-- Drop ALL existing overly-permissive policies on critical tables

-- === LEADS ===
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;

-- Public insert (for website forms)
CREATE POLICY "leads_public_insert" ON public.leads
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Admin full CRUD
CREATE POLICY "leads_admin_all" ON public.leads
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated read (so admin UI works even before role check in some queries)
CREATE POLICY "leads_authenticated_read" ON public.leads
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- === PROJECTS ===
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;

CREATE POLICY "projects_admin_all" ON public.projects
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "projects_authenticated_read" ON public.projects
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- === JOB_COSTS ===
DROP POLICY IF EXISTS "Authenticated users can create job costs" ON public.job_costs;
DROP POLICY IF EXISTS "Authenticated users can delete job costs" ON public.job_costs;
DROP POLICY IF EXISTS "Authenticated users can update job costs" ON public.job_costs;
DROP POLICY IF EXISTS "Authenticated users can view job costs" ON public.job_costs;

CREATE POLICY "job_costs_admin_all" ON public.job_costs
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "job_costs_authenticated_read" ON public.job_costs
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- === JOB_PROOF ===
DROP POLICY IF EXISTS "Authenticated users can create job proof" ON public.job_proof;
DROP POLICY IF EXISTS "Authenticated users can delete job proof" ON public.job_proof;
DROP POLICY IF EXISTS "Authenticated users can update job proof" ON public.job_proof;
DROP POLICY IF EXISTS "Authenticated users can view job proof" ON public.job_proof;

CREATE POLICY "job_proof_admin_all" ON public.job_proof
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "job_proof_authenticated_read" ON public.job_proof
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- === CUSTOMERS ===
DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;

CREATE POLICY "customers_admin_all" ON public.customers
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "customers_authenticated_read" ON public.customers
FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);
