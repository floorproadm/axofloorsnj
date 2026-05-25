-- 1. Add fields to profiles (crew member rate/type — get out of bio text)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employment_type text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS is_active_crew boolean DEFAULT true;

-- 2. Add crew_member_id to labor_entries (link to profile)
ALTER TABLE public.labor_entries
  ADD COLUMN IF NOT EXISTS crew_member_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_method text;

CREATE INDEX IF NOT EXISTS idx_labor_entries_crew_member ON public.labor_entries(crew_member_id);
CREATE INDEX IF NOT EXISTS idx_labor_entries_is_paid ON public.labor_entries(is_paid) WHERE is_paid = false;

-- 3. Helper view: crew earnings aggregate
CREATE OR REPLACE VIEW public.view_crew_earnings AS
SELECT
  p.id AS crew_member_id,
  p.full_name,
  p.role,
  p.daily_rate AS default_rate,
  COUNT(DISTINCT le.project_id) AS jobs_count,
  COALESCE(SUM(le.daily_rate * le.days_worked), 0) AS total_earned,
  COALESCE(SUM(le.daily_rate * le.days_worked) FILTER (WHERE le.is_paid = false), 0) AS unpaid_amount,
  COALESCE(SUM(le.daily_rate * le.days_worked) FILTER (WHERE le.is_paid = true), 0) AS paid_amount,
  COALESCE(AVG(le.daily_rate), p.daily_rate) AS avg_rate,
  MAX(le.work_date) AS last_worked_at
FROM public.profiles p
LEFT JOIN public.labor_entries le ON le.crew_member_id = p.id
GROUP BY p.id, p.full_name, p.role, p.daily_rate;

GRANT SELECT ON public.view_crew_earnings TO authenticated;