
-- 1) Recurrence on payments
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS recurrence text,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurrence_next_date date,
  ADD COLUMN IF NOT EXISTS recurrence_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_payments_recurrence_due
  ON public.payments (recurrence_next_date)
  WHERE recurrence IS NOT NULL AND recurrence_active = true AND recurrence_parent_id IS NULL;

-- 2) schedule_day_notes
CREATE TABLE IF NOT EXISTS public.schedule_day_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  note_date date NOT NULL,
  content text NOT NULL,
  color text NOT NULL DEFAULT 'amber',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, note_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_day_notes TO authenticated;
GRANT ALL ON public.schedule_day_notes TO service_role;

ALTER TABLE public.schedule_day_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_day_notes_tenant_all"
  ON public.schedule_day_notes
  FOR ALL
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE TRIGGER trg_schedule_day_notes_updated_at
  BEFORE UPDATE ON public.schedule_day_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3) get_partner_balance RPC
CREATE OR REPLACE FUNCTION public.get_partner_balance(p_partner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner public.partners%ROWTYPE;
  v_org uuid := public.get_user_org_id();
  v_lifetime_revenue numeric := 0;
  v_lifetime_received numeric := 0;
  v_open_balance numeric := 0;
  v_open_projects int := 0;
  v_completed_projects int := 0;
  v_avg_value numeric := 0;
  v_aging jsonb;
  v_recent jsonb;
  v_open_invoices jsonb;
  v_total_projects int := 0;
BEGIN
  SELECT * INTO v_partner FROM public.partners
   WHERE id = p_partner_id AND organization_id = v_org;
  IF v_partner.id IS NULL THEN
    RAISE EXCEPTION 'Partner not found or not in your organization';
  END IF;

  -- Collect all project ids linked to this partner (direct + via leads)
  WITH partner_projects AS (
    SELECT DISTINCT p.id, p.project_status, p.estimated_cost, p.start_date, p.completion_date,
                    p.customer_name, p.address, p.city, p.project_type
    FROM public.projects p
    WHERE p.organization_id = v_org
      AND (
        p.referred_by_partner_id = p_partner_id
        OR p.id IN (
          SELECT l.converted_to_project_id FROM public.leads l
          WHERE l.referred_by_partner_id = p_partner_id
            AND l.converted_to_project_id IS NOT NULL
        )
      )
  ),
  invoice_totals AS (
    SELECT
      COALESCE(SUM(i.total_amount), 0) AS billed,
      COUNT(*) AS invoice_count
    FROM public.invoices i
    WHERE i.organization_id = v_org
      AND i.project_id IN (SELECT id FROM partner_projects)
  ),
  received_totals AS (
    SELECT COALESCE(SUM(amount), 0) AS received
    FROM public.payments
    WHERE organization_id = v_org
      AND category = 'received'
      AND status = 'confirmed'
      AND project_id IN (SELECT id FROM partner_projects)
  ),
  proj_counts AS (
    SELECT
      COUNT(*) FILTER (WHERE project_status NOT IN ('completed','cancelled','paid')) AS open_count,
      COUNT(*) FILTER (WHERE project_status IN ('completed','paid')) AS completed_count,
      COUNT(*) AS total_count,
      COALESCE(AVG(estimated_cost) FILTER (WHERE estimated_cost > 0), 0) AS avg_val
    FROM partner_projects
  )
  SELECT
    (SELECT billed FROM invoice_totals),
    (SELECT received FROM received_totals),
    (SELECT open_count FROM proj_counts),
    (SELECT completed_count FROM proj_counts),
    (SELECT total_count FROM proj_counts),
    (SELECT avg_val FROM proj_counts)
  INTO v_lifetime_revenue, v_lifetime_received, v_open_projects, v_completed_projects, v_total_projects, v_avg_value;

  v_open_balance := GREATEST(v_lifetime_revenue - v_lifetime_received, 0);

  -- Aging buckets on unpaid invoices (by due_date)
  WITH partner_projects AS (
    SELECT DISTINCT p.id FROM public.projects p
    WHERE p.organization_id = v_org
      AND (
        p.referred_by_partner_id = p_partner_id
        OR p.id IN (
          SELECT l.converted_to_project_id FROM public.leads l
          WHERE l.referred_by_partner_id = p_partner_id
            AND l.converted_to_project_id IS NOT NULL
        )
      )
  ),
  open_inv AS (
    SELECT i.*, GREATEST(CURRENT_DATE - i.due_date, 0) AS days_overdue
    FROM public.invoices i
    WHERE i.organization_id = v_org
      AND i.status IN ('sent','overdue','draft')
      AND i.project_id IN (SELECT id FROM partner_projects)
  )
  SELECT jsonb_build_object(
    'current',     COALESCE(SUM(total_amount) FILTER (WHERE days_overdue = 0), 0),
    'days_30',     COALESCE(SUM(total_amount) FILTER (WHERE days_overdue BETWEEN 1 AND 30), 0),
    'days_60',     COALESCE(SUM(total_amount) FILTER (WHERE days_overdue BETWEEN 31 AND 60), 0),
    'days_90_plus',COALESCE(SUM(total_amount) FILTER (WHERE days_overdue > 60), 0)
  ),
  COALESCE(jsonb_agg(jsonb_build_object(
    'id', id,
    'invoice_number', invoice_number,
    'total_amount', total_amount,
    'due_date', due_date,
    'status', status,
    'days_overdue', days_overdue,
    'project_id', project_id
  ) ORDER BY due_date ASC) FILTER (WHERE id IS NOT NULL), '[]'::jsonb)
  INTO v_aging, v_open_invoices
  FROM open_inv;

  -- Recent 10 projects
  WITH partner_projects AS (
    SELECT p.id, p.customer_name, p.address, p.city, p.project_type,
           p.project_status, p.start_date, p.completion_date, p.estimated_cost
    FROM public.projects p
    WHERE p.organization_id = v_org
      AND (
        p.referred_by_partner_id = p_partner_id
        OR p.id IN (
          SELECT l.converted_to_project_id FROM public.leads l
          WHERE l.referred_by_partner_id = p_partner_id
            AND l.converted_to_project_id IS NOT NULL
        )
      )
    ORDER BY COALESCE(p.completion_date, p.start_date, '1970-01-01'::date) DESC
    LIMIT 10
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(partner_projects)), '[]'::jsonb)
    INTO v_recent
    FROM partner_projects;

  RETURN jsonb_build_object(
    'partner', to_jsonb(v_partner),
    'totals', jsonb_build_object(
      'lifetime_revenue', v_lifetime_revenue,
      'lifetime_received', v_lifetime_received,
      'open_balance', v_open_balance,
      'open_projects', v_open_projects,
      'completed_projects', v_completed_projects,
      'total_projects', v_total_projects,
      'avg_project_value', v_avg_value
    ),
    'aging', COALESCE(v_aging, jsonb_build_object('current',0,'days_30',0,'days_60',0,'days_90_plus',0)),
    'recent_projects', COALESCE(v_recent, '[]'::jsonb),
    'open_invoices', COALESCE(v_open_invoices, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_partner_balance(uuid) TO authenticated;

-- 4) generate_recurring_expenses
CREATE OR REPLACE FUNCTION public.generate_recurring_expenses()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_created int := 0;
  v_next date;
  v_existing uuid;
BEGIN
  FOR v_row IN
    SELECT *
      FROM public.payments
     WHERE recurrence IS NOT NULL
       AND recurrence_active = true
       AND recurrence_parent_id IS NULL
       AND recurrence_next_date IS NOT NULL
       AND recurrence_next_date <= CURRENT_DATE
  LOOP
    -- Idempotency: skip if a child for this template+date already exists
    SELECT id INTO v_existing
      FROM public.payments
     WHERE recurrence_parent_id = v_row.id
       AND payment_date = v_row.recurrence_next_date
     LIMIT 1;

    IF v_existing IS NULL THEN
      INSERT INTO public.payments (
        project_id, category, amount, payment_date, payment_method, status,
        description, notes, organization_id, recurrence_parent_id
      ) VALUES (
        v_row.project_id, v_row.category, v_row.amount, v_row.recurrence_next_date,
        v_row.payment_method, 'pending',
        v_row.description, v_row.notes, v_row.organization_id, v_row.id
      );
      v_created := v_created + 1;
    END IF;

    -- Advance next date
    v_next := CASE v_row.recurrence
      WHEN 'weekly'    THEN v_row.recurrence_next_date + INTERVAL '7 days'
      WHEN 'biweekly'  THEN v_row.recurrence_next_date + INTERVAL '14 days'
      WHEN 'monthly'   THEN v_row.recurrence_next_date + INTERVAL '1 month'
      WHEN 'quarterly' THEN v_row.recurrence_next_date + INTERVAL '3 months'
      WHEN 'yearly'    THEN v_row.recurrence_next_date + INTERVAL '1 year'
      ELSE v_row.recurrence_next_date + INTERVAL '1 month'
    END;

    UPDATE public.payments
       SET recurrence_next_date = v_next,
           updated_at = now()
     WHERE id = v_row.id;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'created', v_created);
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_recurring_expenses() TO authenticated, service_role;
