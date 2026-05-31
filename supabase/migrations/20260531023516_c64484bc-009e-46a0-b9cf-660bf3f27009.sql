-- 1. Add approval workflow columns to labor_entries
ALTER TABLE public.labor_entries
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS submitted_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE public.labor_entries
  DROP CONSTRAINT IF EXISTS labor_entries_status_check;
ALTER TABLE public.labor_entries
  ADD CONSTRAINT labor_entries_status_check CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_labor_entries_status ON public.labor_entries(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_labor_entries_submitted_by ON public.labor_entries(submitted_by_user_id);

-- 2. Update sync trigger: only approved entries count toward job_costs
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

  SELECT COALESCE(SUM(daily_rate * days_worked), 0) INTO v_total
  FROM public.labor_entries
  WHERE project_id = v_project_id
    AND status = 'approved';

  UPDATE public.job_costs
  SET labor_cost = v_total, updated_at = now()
  WHERE project_id = v_project_id;

  RETURN NULL;
END;
$function$;

-- 3. RLS: allow collaborators to submit their own timesheet entries (pending) and read their own
CREATE POLICY "labor_entries_collab_insert_own"
ON public.labor_entries
FOR INSERT
TO authenticated
WITH CHECK (
  submitted_by_user_id = auth.uid()
  AND status = 'pending'
  AND crew_member_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "labor_entries_collab_select_own"
ON public.labor_entries
FOR SELECT
TO authenticated
USING (
  submitted_by_user_id = auth.uid()
);

CREATE POLICY "labor_entries_collab_delete_own_pending"
ON public.labor_entries
FOR DELETE
TO authenticated
USING (
  submitted_by_user_id = auth.uid()
  AND status = 'pending'
);