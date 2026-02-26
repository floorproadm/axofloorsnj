
-- 1) Create run_sla_engine() function
CREATE OR REPLACE FUNCTION public.run_sla_engine()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lock_acquired boolean;
  v_followup_count int := 0;
  v_estimate_count int := 0;
BEGIN
  -- Prevent concurrent runs
  v_lock_acquired := pg_try_advisory_lock(922337203685477000);
  IF NOT v_lock_acquired THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'lock_not_acquired');
  END IF;

  -- 1) FOLLOW-UP OVERDUE => escalate priority
  WITH targets AS (
    SELECT l.id, l.priority
    FROM public.leads l
    JOIN public.leads_followup_overdue v ON v.id = l.id
    WHERE l.status = 'proposal_sent'
  ),
  updates AS (
    UPDATE public.leads l
    SET priority = CASE
      WHEN t.priority IN ('low','medium') THEN 'high'
      WHEN t.priority = 'high' THEN 'urgent'
      ELSE t.priority
    END
    FROM targets t
    WHERE l.id = t.id
      AND (
        (t.priority IN ('low','medium')) OR (t.priority = 'high')
      )
    RETURNING l.id, t.priority AS old_priority, l.priority AS new_priority
  )
  INSERT INTO public.audit_log (user_id, user_role, operation_type, table_accessed, data_classification)
  SELECT
    NULL,
    'system',
    'SLA_ESCALATION_FOLLOWUP',
    'leads',
    jsonb_build_object(
      'lead_id', u.id,
      'old_priority', u.old_priority,
      'new_priority', u.new_priority,
      'reason', 'followup_overdue'
    )::text
  FROM updates u;

  GET DIAGNOSTICS v_followup_count = ROW_COUNT;

  -- 2) ESTIMATE SCHEDULED STALE (>3d, no project) => escalate priority
  WITH targets AS (
    SELECT l.id, l.priority
    FROM public.leads l
    JOIN public.leads_estimate_scheduled_stale v ON v.id = l.id
    WHERE l.status = 'estimate_scheduled'
      AND l.converted_to_project_id IS NULL
  ),
  updates AS (
    UPDATE public.leads l
    SET priority = CASE
      WHEN t.priority IN ('low','medium') THEN 'high'
      WHEN t.priority = 'high' THEN 'urgent'
      ELSE t.priority
    END
    FROM targets t
    WHERE l.id = t.id
      AND (
        (t.priority IN ('low','medium')) OR (t.priority = 'high')
      )
    RETURNING l.id, t.priority AS old_priority, l.priority AS new_priority
  )
  INSERT INTO public.audit_log (user_id, user_role, operation_type, table_accessed, data_classification)
  SELECT
    NULL,
    'system',
    'SLA_ESCALATION_ESTIMATE',
    'leads',
    jsonb_build_object(
      'lead_id', u.id,
      'old_priority', u.old_priority,
      'new_priority', u.new_priority,
      'reason', 'estimate_scheduled_stale'
    )::text
  FROM updates u;

  GET DIAGNOSTICS v_estimate_count = ROW_COUNT;

  PERFORM pg_advisory_unlock(922337203685477000);

  RETURN jsonb_build_object(
    'ok', true,
    'followup_escalated', v_followup_count,
    'estimate_escalated', v_estimate_count
  );
EXCEPTION WHEN OTHERS THEN
  PERFORM pg_advisory_unlock(922337203685477000);
  RAISE;
END;
$$;

-- 2) Security: restrict access
REVOKE ALL ON FUNCTION public.run_sla_engine() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_sla_engine() TO postgres;

-- 3) Update get_dashboard_metrics() to include recentSystemActions
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

  -- Recent field uploads (last 24h from audit_log)
  SELECT COALESCE((
    SELECT jsonb_agg(row_obj)
    FROM (
      SELECT jsonb_build_object(
        'project_id', (al.data_classification::jsonb)->>'project_id',
        'customer_name', COALESCE(p.customer_name, 'Unknown'),
        'storage_path', (al.data_classification::jsonb)->>'storage_path',
        'folder_type', (al.data_classification::jsonb)->>'folder_type',
        'created_at', al.created_at
      ) AS row_obj
      FROM audit_log al
      LEFT JOIN projects p ON p.id = ((al.data_classification::jsonb)->>'project_id')::uuid
      WHERE al.operation_type = 'COLLABORATOR_UPLOAD'
        AND al.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY al.created_at DESC
      LIMIT 10
    ) sub
  ), '[]'::jsonb)
  INTO v_recent_uploads;

  -- Recent system actions (SLA escalations in last 24h)
  SELECT COALESCE((
    SELECT jsonb_agg(row_obj)
    FROM (
      SELECT jsonb_build_object(
        'operation_type', al.operation_type,
        'created_at', al.created_at,
        'data', al.data_classification::jsonb
      ) AS row_obj
      FROM public.audit_log al
      WHERE al.user_role = 'system'
        AND al.operation_type LIKE 'SLA_ESCALATION_%'
        AND al.created_at > NOW() - INTERVAL '24 hours'
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
$$;
