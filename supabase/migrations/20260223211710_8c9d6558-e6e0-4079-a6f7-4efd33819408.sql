
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pipeline jsonb;
  v_financial jsonb;
  v_aging jsonb;
  v_alerts jsonb;
  v_money jsonb;
  v_conversion_rate numeric;
  v_avg_cycle numeric;
  v_recent_total bigint;
  v_recent_converted bigint;
BEGIN
  -- Pipeline metrics
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

  -- Conversion rate (30d)
  SELECT COUNT(*), COUNT(*) FILTER (WHERE converted_to_project_id IS NOT NULL)
  INTO v_recent_total, v_recent_converted
  FROM leads
  WHERE created_at >= NOW() - INTERVAL '30 days';

  IF v_recent_total > 0 THEN
    v_conversion_rate := ROUND((v_recent_converted::numeric / v_recent_total::numeric) * 100, 1);
  ELSE
    v_conversion_rate := NULL;
  END IF;

  -- Average cycle time (completed projects with both dates)
  SELECT ROUND(AVG(completion_date - start_date), 0)
  INTO v_avg_cycle
  FROM projects
  WHERE project_status = 'completed'
    AND start_date IS NOT NULL
    AND completion_date IS NOT NULL;

  -- Financial metrics (extended with 2 new fields)
  SELECT jsonb_build_object(
    'active_jobs', COALESCE(active_jobs, 0),
    'completed_jobs', COALESCE(completed_jobs, 0),
    'pipeline_value', COALESCE(pipeline_value, 0),
    'total_profit', COALESCE(total_profit, 0),
    'total_revenue', COALESCE(total_revenue, 0),
    'avg_margin_30d', avg_margin_30d,
    'conversion_rate_30d', v_conversion_rate,
    'avg_cycle_days', v_avg_cycle
  )
  INTO v_financial
  FROM view_financial_metrics;

  -- Top 10 aging leads
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

  -- Money metrics (active leads)
  SELECT jsonb_build_object(
    'activeLeadsCount', COUNT(*),
    'estimatedValueOpen', COALESCE(SUM(budget), 0)
  )
  INTO v_money
  FROM leads
  WHERE status NOT IN ('completed', 'lost');

  -- Critical alerts
  SELECT jsonb_build_object(
    'proposalWithoutFollowUp', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name))
      FROM leads
      WHERE status = 'proposal_sent'
        AND (follow_up_actions IS NULL OR follow_up_actions = '[]'::jsonb)
    ), '[]'::jsonb),
    'newLeadsNoContact24h', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name))
      FROM leads
      WHERE status = 'cold_lead'
        AND created_at < NOW() - INTERVAL '24 hours'
    ), '[]'::jsonb),
    'leadsStalled48h', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name))
      FROM leads
      WHERE status NOT IN ('completed', 'lost')
        AND updated_at < NOW() - INTERVAL '48 hours'
    ), '[]'::jsonb)
  )
  INTO v_alerts;

  RETURN jsonb_build_object(
    'pipeline', v_pipeline,
    'financial', v_financial,
    'aging_top10', v_aging,
    'money', v_money,
    'alerts', v_alerts
  );
END;
$function$;
