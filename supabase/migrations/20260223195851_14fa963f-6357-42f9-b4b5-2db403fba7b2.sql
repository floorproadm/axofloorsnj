
-- Phase 1.3: Aggregated SQL Views + RPC get_dashboard_metrics

-- 1. view_pipeline_metrics
CREATE OR REPLACE VIEW public.view_pipeline_metrics AS
SELECT
  status,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30d,
  AVG(EXTRACT(DAY FROM (now() - created_at)))::int as avg_days_in_pipeline
FROM leads
WHERE status NOT IN ('completed', 'lost')
GROUP BY status;

-- 2. view_financial_metrics
CREATE OR REPLACE VIEW public.view_financial_metrics AS
SELECT
  COUNT(*) FILTER (WHERE p.project_status = 'in_progress') as active_jobs,
  COUNT(*) FILTER (WHERE p.project_status = 'completed') as completed_jobs,
  COALESCE(SUM(jc.estimated_revenue) FILTER (WHERE p.project_status = 'in_progress'), 0) as pipeline_value,
  COALESCE(SUM(jc.profit_amount) FILTER (WHERE p.project_status = 'completed'), 0) as total_profit,
  COALESCE(SUM(jc.estimated_revenue) FILTER (WHERE p.project_status = 'completed'), 0) as total_revenue,
  AVG(jc.margin_percent) FILTER (
    WHERE p.project_status = 'completed'
    AND p.created_at >= NOW() - INTERVAL '30 days'
  ) as avg_margin_30d
FROM projects p
LEFT JOIN job_costs jc ON jc.project_id = p.id;

-- 3. view_stage_aging
CREATE OR REPLACE VIEW public.view_stage_aging AS
SELECT
  l.id as lead_id,
  l.name,
  l.status,
  EXTRACT(DAY FROM (now() - l.created_at))::int as days_in_pipeline,
  l.next_action_date,
  CASE
    WHEN l.next_action_date IS NOT NULL AND l.next_action_date < CURRENT_DATE
    THEN true ELSE false
  END as action_overdue
FROM leads l
WHERE l.status NOT IN ('completed', 'lost')
ORDER BY days_in_pipeline DESC;

-- 4. RPC get_dashboard_metrics()
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pipeline jsonb;
  v_financial jsonb;
  v_aging jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'status', status,
      'total', total,
      'last_30d', last_30d,
      'avg_days_in_pipeline', avg_days_in_pipeline
    )
  ), '[]'::jsonb)
  INTO v_pipeline
  FROM view_pipeline_metrics;

  SELECT jsonb_build_object(
    'active_jobs', COALESCE(active_jobs, 0),
    'completed_jobs', COALESCE(completed_jobs, 0),
    'pipeline_value', COALESCE(pipeline_value, 0),
    'total_profit', COALESCE(total_profit, 0),
    'total_revenue', COALESCE(total_revenue, 0),
    'avg_margin_30d', avg_margin_30d
  )
  INTO v_financial
  FROM view_financial_metrics;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'lead_id', lead_id,
      'name', name,
      'status', status,
      'days_in_pipeline', days_in_pipeline,
      'action_overdue', action_overdue
    )
  ), '[]'::jsonb)
  INTO v_aging
  FROM (SELECT * FROM view_stage_aging LIMIT 10) sub;

  RETURN jsonb_build_object(
    'pipeline', v_pipeline,
    'financial', v_financial,
    'aging_top10', v_aging
  );
END;
$$;
