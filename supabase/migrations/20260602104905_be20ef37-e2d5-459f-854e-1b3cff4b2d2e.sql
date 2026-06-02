
-- Migration 2: labor_entries extensions

-- 2.1 Add FK column to payroll_periods
ALTER TABLE public.labor_entries
  ADD COLUMN payroll_period_id uuid REFERENCES public.payroll_periods(id) ON DELETE SET NULL;

CREATE INDEX idx_labor_entries_payroll_period ON public.labor_entries(payroll_period_id);

-- 2.2 Widen status CHECK to include 'paid'
ALTER TABLE public.labor_entries DROP CONSTRAINT labor_entries_status_check;
ALTER TABLE public.labor_entries
  ADD CONSTRAINT labor_entries_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'paid'));

-- 2.3 Sync legacy is_paid / paid_at fields whenever status changes
CREATE OR REPLACE FUNCTION public.sync_labor_entry_paid_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paid' AND COALESCE(OLD.status, '') <> 'paid' THEN
    NEW.is_paid := true;
    IF NEW.paid_at IS NULL THEN
      NEW.paid_at := now();
    END IF;
  ELSIF NEW.status <> 'paid' AND COALESCE(OLD.status, '') = 'paid' THEN
    NEW.is_paid := false;
    NEW.paid_at := NULL;
    NEW.payroll_period_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_labor_entries_paid_flag ON public.labor_entries;
CREATE TRIGGER trg_labor_entries_paid_flag
BEFORE INSERT OR UPDATE OF status ON public.labor_entries
FOR EACH ROW
EXECUTE FUNCTION public.sync_labor_entry_paid_flag();

-- 2.4 Update job cost sync to include 'paid' alongside 'approved'
CREATE OR REPLACE FUNCTION public.sync_labor_entries_to_job_costs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_project_id uuid;
  v_total numeric;
BEGIN
  v_project_id := COALESCE(NEW.project_id, OLD.project_id);

  SELECT COALESCE(SUM(
    CASE
      WHEN pay_mode = 'sqft' THEN COALESCE(sqft_rate, 0) * COALESCE(sqft_worked, 0)
      ELSE COALESCE(daily_rate, 0) * COALESCE(days_worked, 0)
    END
  ), 0) INTO v_total
  FROM public.labor_entries
  WHERE project_id = v_project_id
    AND status IN ('approved', 'paid');

  UPDATE public.job_costs
  SET labor_cost = v_total, updated_at = now()
  WHERE project_id = v_project_id;

  RETURN NULL;
END;
$function$;
