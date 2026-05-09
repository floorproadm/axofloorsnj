-- 1) Update auto_enroll_lead_automation to also mark pending drip_logs as 'skipped'
CREATE OR REPLACE FUNCTION public.auto_enroll_lead_automation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_seq RECORD;
  v_drip RECORD;
  v_enrollment_id uuid;
  v_schedule_at timestamptz;
  v_drip_index int;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Cancel existing active enrollments for this lead
  UPDATE public.automation_enrollments
  SET status = 'cancelled', updated_at = now()
  WHERE lead_id = NEW.id AND status = 'active';

  -- Skip pending drip logs from cancelled enrollments
  UPDATE public.automation_drip_logs
  SET status = 'skipped'
  WHERE status = 'pending'
    AND enrollment_id IN (
      SELECT id FROM public.automation_enrollments
      WHERE lead_id = NEW.id AND status = 'cancelled'
    );

  -- If terminal status, do not enroll new sequences
  IF NEW.status IN ('completed', 'lost') THEN
    RETURN NEW;
  END IF;

  -- Find active sequences matching new status
  FOR v_seq IN
    SELECT s.* FROM public.automation_sequences s
    WHERE s.stage_key = NEW.status
      AND s.is_active = true
      AND s.organization_id = NEW.organization_id
    ORDER BY s.display_order
  LOOP
    INSERT INTO public.automation_enrollments (lead_id, sequence_id, organization_id)
    VALUES (NEW.id, v_seq.id, NEW.organization_id)
    RETURNING id INTO v_enrollment_id;

    v_drip_index := 0;
    FOR v_drip IN
      SELECT * FROM public.automation_drips
      WHERE sequence_id = v_seq.id AND is_active = true
      ORDER BY display_order
    LOOP
      v_schedule_at := now() + (COALESCE(v_drip.delay_days, 0) || ' days')::interval
                             + (COALESCE(v_drip.delay_hours, 0) || ' hours')::interval;

      INSERT INTO public.automation_drip_logs (enrollment_id, drip_id, organization_id, scheduled_at)
      VALUES (v_enrollment_id, v_drip.id, NEW.organization_id, v_schedule_at);

      v_drip_index := v_drip_index + 1;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- 2) Aggregated automation status RPC for batch lookup (used in Intake cards)
CREATE OR REPLACE FUNCTION public.get_leads_automation_status(p_lead_ids uuid[])
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT
      e.lead_id,
      l.status_text,
      l.scheduled_at,
      l.sent_at,
      l.error_message
    FROM public.automation_enrollments e
    JOIN LATERAL (
      SELECT dl.status AS status_text, dl.scheduled_at, dl.sent_at, dl.error_message
      FROM public.automation_drip_logs dl
      WHERE dl.enrollment_id = e.id
    ) l ON true
    WHERE e.lead_id = ANY(p_lead_ids)
      AND e.organization_id = public.get_user_org_id()
  ),
  per_lead AS (
    SELECT
      lead_id,
      MAX(sent_at) FILTER (WHERE status_text = 'sent') AS last_sent_at,
      MIN(scheduled_at) FILTER (WHERE status_text = 'pending') AS next_scheduled_at,
      COUNT(*) FILTER (WHERE status_text = 'failed') AS failed_count,
      COUNT(*) FILTER (WHERE status_text = 'pending') AS pending_count,
      MAX(error_message) FILTER (WHERE status_text = 'failed') AS last_error
    FROM base
    GROUP BY lead_id
  )
  SELECT COALESCE(jsonb_object_agg(
    lead_id::text,
    jsonb_build_object(
      'last_sent_at', last_sent_at,
      'next_scheduled_at', next_scheduled_at,
      'failed_count', failed_count,
      'pending_count', pending_count,
      'last_error', last_error
    )
  ), '{}'::jsonb)
  FROM per_lead;
$function$;

-- Make sure trigger is attached (idempotent)
DROP TRIGGER IF EXISTS trg_auto_enroll_lead_automation ON public.leads;
CREATE TRIGGER trg_auto_enroll_lead_automation
AFTER UPDATE OF status ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.auto_enroll_lead_automation();

-- Trigger on INSERT too, so new leads get enrolled
DROP TRIGGER IF EXISTS trg_auto_enroll_lead_automation_ins ON public.leads;
CREATE TRIGGER trg_auto_enroll_lead_automation_ins
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.auto_enroll_lead_automation();