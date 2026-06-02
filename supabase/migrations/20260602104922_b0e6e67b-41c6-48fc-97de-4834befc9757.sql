
CREATE OR REPLACE FUNCTION public.get_payroll_summary(
  p_period_start date DEFAULT NULL,
  p_period_end date DEFAULT NULL
)
RETURNS TABLE (
  technician_id uuid,
  full_name text,
  total_days numeric,
  total_sqft numeric,
  total_amount numeric,
  entry_count bigint,
  pending_count bigint,
  approved_count bigint,
  paid_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    le.crew_member_id AS technician_id,
    COALESCE(p.full_name, le.worker_name) AS full_name,
    COALESCE(SUM(CASE WHEN le.pay_mode = 'daily' THEN le.days_worked ELSE 0 END), 0) AS total_days,
    COALESCE(SUM(CASE WHEN le.pay_mode = 'sqft'  THEN le.sqft_worked ELSE 0 END), 0) AS total_sqft,
    COALESCE(SUM(le.total_cost), 0) AS total_amount,
    COUNT(*) AS entry_count,
    COUNT(*) FILTER (WHERE le.status = 'pending')  AS pending_count,
    COUNT(*) FILTER (WHERE le.status = 'approved') AS approved_count,
    COUNT(*) FILTER (WHERE le.status = 'paid')     AS paid_count
  FROM public.labor_entries le
  LEFT JOIN public.profiles p ON p.id = le.crew_member_id
  WHERE le.organization_id = public.get_user_org_id()
    AND (p_period_start IS NULL OR le.work_date >= p_period_start)
    AND (p_period_end   IS NULL OR le.work_date <= p_period_end)
  GROUP BY le.crew_member_id, COALESCE(p.full_name, le.worker_name)
  ORDER BY full_name NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_payroll_summary(date, date) TO authenticated;
