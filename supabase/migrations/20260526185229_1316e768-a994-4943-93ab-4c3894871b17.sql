-- 1) Ensure extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2) Schedule automation-engine every 5 minutes (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'automation-engine-cron') THEN
    PERFORM cron.unschedule('automation-engine-cron');
  END IF;
END $$;

SELECT cron.schedule(
  'automation-engine-cron',
  '*/5 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://dcfmrqrbsfxvqhihpamd.supabase.co/functions/v1/automation-engine',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZm1ycXJic2Z4dnFoaWhwYW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjE5MTEsImV4cCI6MjA4NTYzNzkxMX0.TKL0qDwIrg9pXLewjpg1YmF_Pw5tCwUK7zdj7vho8A8',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZm1ycXJic2Z4dnFoaWhwYW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjE5MTEsImV4cCI6MjA4NTYzNzkxMX0.TKL0qDwIrg9pXLewjpg1YmF_Pw5tCwUK7zdj7vho8A8'
    ),
    body := '{}'::jsonb
  );
  $cron$
);

-- 3) Replace trigger function: qualify exit on closed stages
CREATE OR REPLACE FUNCTION public.auto_enroll_lead_automation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_seq RECORD;
  v_drip RECORD;
  v_enrollment_id uuid;
  v_schedule_at timestamptz;
  v_qualified_stages text[] := ARRAY[
    'proposal_accepted','scheduled','in_progress','completed','paid'
  ];
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Cancel existing active enrollments for this lead
  UPDATE public.automation_enrollments
  SET status = 'cancelled', updated_at = now()
  WHERE lead_id = NEW.id AND status = 'active';

  -- Cancel pending drip logs from cancelled enrollments
  UPDATE public.automation_drip_logs
  SET status = 'cancelled'
  WHERE status = 'pending'
    AND enrollment_id IN (
      SELECT id FROM public.automation_enrollments
      WHERE lead_id = NEW.id AND status = 'cancelled'
    );

  -- Qualify exit: lead reached closed/won/terminal stage — no new enrollments
  IF NEW.status = ANY(v_qualified_stages) OR NEW.status IN ('completed', 'lost') THEN
    RETURN NEW;
  END IF;

  -- Otherwise: enroll into matching active sequences
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

    FOR v_drip IN
      SELECT * FROM public.automation_drips
      WHERE sequence_id = v_seq.id AND is_active = true
      ORDER BY display_order
    LOOP
      v_schedule_at := now()
        + (COALESCE(v_drip.delay_days, 0) || ' days')::interval
        + (COALESCE(v_drip.delay_hours, 0) || ' hours')::interval;

      INSERT INTO public.automation_drip_logs (enrollment_id, drip_id, organization_id, scheduled_at)
      VALUES (v_enrollment_id, v_drip.id, NEW.organization_id, v_schedule_at);
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;