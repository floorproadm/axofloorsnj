CREATE OR REPLACE FUNCTION public.get_revenue_by_lead_source(
  p_org_id uuid,
  p_start date DEFAULT NULL
) RETURNS TABLE (
  lead_source text,
  project_count bigint,
  revenue numeric,
  cost numeric,
  profit numeric,
  margin numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH project_revenue AS (
    SELECT 
      p.project_id,
      SUM(p.amount) AS revenue
    FROM public.payments p
    WHERE p.organization_id = p_org_id
      AND p.status = 'confirmed'
      AND p.category = 'invoice_payment'
      AND p.project_id IS NOT NULL
      AND (p_start IS NULL OR p.payment_date >= p_start)
    GROUP BY p.project_id
  ),
  joined AS (
    SELECT
      COALESCE(NULLIF(TRIM(l.lead_source), ''), 'Direct') AS lead_source,
      pr.project_id,
      pr.revenue,
      COALESCE(jc.total_cost, 0) AS cost
    FROM project_revenue pr
    LEFT JOIN public.leads l 
      ON l.converted_to_project_id = pr.project_id 
     AND l.organization_id = p_org_id
    LEFT JOIN public.job_costs jc 
      ON jc.project_id = pr.project_id
  )
  SELECT
    lead_source,
    COUNT(DISTINCT project_id)::bigint AS project_count,
    COALESCE(SUM(revenue), 0)::numeric AS revenue,
    COALESCE(SUM(cost), 0)::numeric AS cost,
    COALESCE(SUM(revenue - cost), 0)::numeric AS profit,
    CASE 
      WHEN COALESCE(SUM(revenue), 0) > 0 
      THEN ROUND((SUM(revenue - cost) / SUM(revenue)) * 100, 1)
      ELSE 0
    END AS margin
  FROM joined
  GROUP BY lead_source
  ORDER BY revenue DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_revenue_by_lead_source(uuid, date) TO authenticated;