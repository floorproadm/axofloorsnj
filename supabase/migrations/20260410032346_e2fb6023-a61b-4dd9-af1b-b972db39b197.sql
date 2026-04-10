
-- 1. material_costs table
CREATE TABLE public.material_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  description text NOT NULL DEFAULT '',
  supplier text,
  amount numeric NOT NULL DEFAULT 0,
  purchase_date date DEFAULT CURRENT_DATE,
  receipt_url text,
  is_paid boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.material_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "material_costs_tenant_all" ON public.material_costs
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

CREATE INDEX idx_material_costs_project ON public.material_costs(project_id);

-- 2. labor_entries table
CREATE TABLE public.labor_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  worker_name text NOT NULL,
  role text DEFAULT 'helper',
  daily_rate numeric NOT NULL DEFAULT 0,
  days_worked numeric NOT NULL DEFAULT 1,
  total_cost numeric GENERATED ALWAYS AS (daily_rate * days_worked) STORED,
  work_date date DEFAULT CURRENT_DATE,
  is_paid boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.labor_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "labor_entries_tenant_all" ON public.labor_entries
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

CREATE INDEX idx_labor_entries_project ON public.labor_entries(project_id);

-- 3. weekly_reviews table
CREATE TABLE public.weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  week_start date NOT NULL,
  week_end date NOT NULL,
  total_revenue numeric DEFAULT 0,
  total_profit numeric DEFAULT 0,
  avg_margin numeric DEFAULT 0,
  jobs_completed integer DEFAULT 0,
  leads_won integer DEFAULT 0,
  notes text,
  action_items text,
  status text DEFAULT 'open',
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, week_start)
);

ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_reviews_tenant_all" ON public.weekly_reviews
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- 4. weekly_review_projects junction
CREATE TABLE public.weekly_review_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_review_id uuid NOT NULL REFERENCES public.weekly_reviews(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(weekly_review_id, project_id)
);

ALTER TABLE public.weekly_review_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_review_projects_tenant_all" ON public.weekly_review_projects
  FOR ALL TO authenticated
  USING (weekly_review_id IN (
    SELECT id FROM public.weekly_reviews WHERE organization_id = get_user_org_id()
  ))
  WITH CHECK (weekly_review_id IN (
    SELECT id FROM public.weekly_reviews WHERE organization_id = get_user_org_id()
  ));

-- 5. Add next_action columns to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS next_action text,
  ADD COLUMN IF NOT EXISTS next_action_date date;

-- 6. Trigger: material_costs → job_costs.material_cost sync
CREATE OR REPLACE FUNCTION public.sync_material_costs_to_job_costs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
  v_total numeric;
BEGIN
  v_project_id := COALESCE(NEW.project_id, OLD.project_id);
  
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM public.material_costs
  WHERE project_id = v_project_id;
  
  UPDATE public.job_costs
  SET material_cost = v_total, updated_at = now()
  WHERE project_id = v_project_id;
  
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_material_costs
AFTER INSERT OR UPDATE OR DELETE ON public.material_costs
FOR EACH ROW EXECUTE FUNCTION public.sync_material_costs_to_job_costs();

-- 7. Trigger: labor_entries → job_costs.labor_cost sync
CREATE OR REPLACE FUNCTION public.sync_labor_entries_to_job_costs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
  v_total numeric;
BEGIN
  v_project_id := COALESCE(NEW.project_id, OLD.project_id);
  
  SELECT COALESCE(SUM(daily_rate * days_worked), 0) INTO v_total
  FROM public.labor_entries
  WHERE project_id = v_project_id;
  
  UPDATE public.job_costs
  SET labor_cost = v_total, updated_at = now()
  WHERE project_id = v_project_id;
  
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_labor_entries
AFTER INSERT OR UPDATE OR DELETE ON public.labor_entries
FOR EACH ROW EXECUTE FUNCTION public.sync_labor_entries_to_job_costs();

-- 8. Function: compute_project_next_action
CREATE OR REPLACE FUNCTION public.compute_project_next_action(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Get min margin
  SELECT COALESCE(default_margin_min_percent, 30) INTO v_min_margin FROM public.company_settings LIMIT 1;

  -- Check costs
  SELECT EXISTS(SELECT 1 FROM public.job_costs WHERE project_id = p_project_id AND (labor_cost > 0 OR material_cost > 0)) INTO v_has_costs;
  
  -- Check margin
  SELECT margin_percent INTO v_margin FROM public.job_costs WHERE project_id = p_project_id;

  -- Check photos
  SELECT 
    EXISTS(SELECT 1 FROM public.job_proof WHERE project_id = p_project_id AND before_image_url IS NOT NULL AND before_image_url != ''),
    EXISTS(SELECT 1 FROM public.job_proof WHERE project_id = p_project_id AND after_image_url IS NOT NULL AND after_image_url != '')
  INTO v_has_before, v_has_after;

  -- Check invoicing
  SELECT EXISTS(SELECT 1 FROM public.invoices WHERE project_id = p_project_id) INTO v_has_invoice;
  
  SELECT COALESCE(SUM(i.amount) - COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.project_id = p_project_id AND p.category = 'received' AND p.status = 'completed'), 0), 0)
  INTO v_balance_due
  FROM public.invoices i WHERE i.project_id = p_project_id;

  -- Determine next action based on priority
  IF v_project.project_status = 'completed' THEN
    IF v_balance_due > 0 THEN
      v_action := 'Cobrar saldo pendente: $' || round(v_balance_due, 0);
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
  ELSIF v_project.project_status = 'in_progress' AND NOT v_has_before THEN
    v_action := 'Enviar foto BEFORE do projeto';
    v_action_date := CURRENT_DATE;
  ELSIF v_project.project_status = 'in_progress' AND NOT v_has_after THEN
    v_action := 'Enviar foto AFTER do projeto';
    v_action_date := CURRENT_DATE;
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
$$;

-- 9. Trigger on projects to recompute next_action on status change
CREATE OR REPLACE FUNCTION public.trg_recompute_next_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.compute_project_next_action(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_project_next_action
AFTER UPDATE OF project_status ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_next_action();

-- 10. updated_at triggers
CREATE TRIGGER update_material_costs_updated_at
BEFORE UPDATE ON public.material_costs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
