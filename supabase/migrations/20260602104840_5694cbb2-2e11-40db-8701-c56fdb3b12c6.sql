
-- Migration 1: payroll_periods table
CREATE TABLE public.payroll_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','confirmed')),
  confirmed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  confirmed_at timestamptz,
  total_paid numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_periods_dates_valid CHECK (period_end >= period_start)
);

CREATE INDEX idx_payroll_periods_org ON public.payroll_periods(organization_id);
CREATE INDEX idx_payroll_periods_status ON public.payroll_periods(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_periods TO authenticated;
GRANT ALL ON public.payroll_periods TO service_role;

ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;

-- Admin/manager full access scoped to org (mirrors labor_entries_admin_manager_all)
CREATE POLICY "payroll_periods_admin_manager_all"
ON public.payroll_periods
FOR ALL
TO authenticated
USING (
  organization_id = public.get_user_org_id()
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
)
WITH CHECK (
  organization_id = public.get_user_org_id()
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
);

-- Accountant read-only access
CREATE POLICY "payroll_periods_accountant_read"
ON public.payroll_periods
FOR SELECT
TO authenticated
USING (
  organization_id = public.get_user_org_id()
  AND public.has_role(auth.uid(), 'accountant'::app_role)
);

CREATE TRIGGER trg_payroll_periods_updated_at
BEFORE UPDATE ON public.payroll_periods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
