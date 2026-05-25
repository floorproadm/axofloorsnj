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
  v_missing_photos jsonb;
  v_sla_breaches jsonb;
  v_recent_uploads jsonb;
  v_recent_system_actions jsonb;
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

  -- Average cycle time
  SELECT ROUND(AVG(completion_date - start_date), 0)
  INTO v_avg_cycle
  FROM projects
  WHERE project_status = 'completed'
    AND start_date IS NOT NULL
    AND completion_date IS NOT NULL;

  -- Financial metrics
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

  -- Money metrics
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

  -- Missing progress photos
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'project_id', project_id,
      'customer_name', customer_name
    )
  ), '[]'::jsonb)
  INTO v_missing_photos
  FROM projects_missing_progress_photos;

  -- SLA Breaches
  SELECT jsonb_build_object(
    'followupOverdue', jsonb_build_object(
      'count', COALESCE((SELECT COUNT(*) FROM leads_followup_overdue), 0),
      'items', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name, 'next_action_date', next_action_date))
        FROM leads_followup_overdue
      ), '[]'::jsonb)
    ),
    'estimateStale', jsonb_build_object(
      'count', COALESCE((SELECT COUNT(*) FROM leads_estimate_scheduled_stale), 0),
      'items', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name, 'days_stale', days_stale))
        FROM leads_estimate_scheduled_stale
      ), '[]'::jsonb)
    )
  )
  INTO v_sla_breaches;

  -- Recent field uploads (last 24h from audit_log) — only if project still exists
  SELECT COALESCE((
    SELECT jsonb_agg(row_obj)
    FROM (
      SELECT jsonb_build_object(
        'project_id', p.id,
        'customer_name', p.customer_name,
        'storage_path', (al.data_classification::jsonb)->>'storage_path',
        'folder_type', (al.data_classification::jsonb)->>'folder_type',
        'created_at', al.created_at
      ) AS row_obj
      FROM audit_log al
      JOIN projects p ON p.id = ((al.data_classification::jsonb)->>'project_id')::uuid
      WHERE al.operation_type = 'COLLABORATOR_UPLOAD'
        AND al.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY al.created_at DESC
      LIMIT 10
    ) sub
  ), '[]'::jsonb)
  INTO v_recent_uploads;

  -- Recent system actions (SLA escalations last 24h) — only if referenced lead still exists AND is still active
  SELECT COALESCE((
    SELECT jsonb_agg(row_obj)
    FROM (
      SELECT jsonb_build_object(
        'operation_type', al.operation_type,
        'created_at', al.created_at,
        'data', al.data_classification::jsonb
      ) AS row_obj
      FROM public.audit_log al
      JOIN public.leads l
        ON l.id = ((al.data_classification::jsonb)->>'lead_id')::uuid
      WHERE al.user_role = 'system'
        AND al.operation_type LIKE 'SLA_ESCALATION_%'
        AND al.created_at > NOW() - INTERVAL '24 hours'
        AND l.status NOT IN ('completed', 'lost')
      ORDER BY al.created_at DESC
      LIMIT 20
    ) sub
  ), '[]'::jsonb)
  INTO v_recent_system_actions;

  RETURN jsonb_build_object(
    'pipeline', v_pipeline,
    'financial', v_financial,
    'aging_top10', v_aging,
    'money', v_money,
    'alerts', v_alerts,
    'missingProgressPhotos', v_missing_photos,
    'slaBreaches', v_sla_breaches,
    'recentFieldUploads', v_recent_uploads,
    'recentSystemActions', v_recent_system_actions
  );
END;
$function$;