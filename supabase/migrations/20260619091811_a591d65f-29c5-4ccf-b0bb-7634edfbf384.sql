
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS review_auto_send_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_auto_send_delay_days integer NOT NULL DEFAULT 3;

ALTER TABLE public.review_requests
  ADD COLUMN IF NOT EXISTS scheduled_send_at timestamptz;

CREATE OR REPLACE FUNCTION public.enqueue_review_request_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZm1ycXJic2Z4dnFoaWhwYW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjE5MTEsImV4cCI6MjA4NTYzNzkxMX0.TKL0qDwIrg9pXLewjpg1YmF_Pw5tCwUK7zdj7vho8A8';
  v_url text := 'https://dcfmrqrbsfxvqhihpamd.supabase.co/functions/v1/reputation-request';
  v_request_id uuid;
  v_enabled boolean;
  v_delay int;
  v_scheduled timestamptz;
BEGIN
  IF NEW.project_status = 'completed' AND (OLD.project_status IS NULL OR OLD.project_status <> 'completed') THEN
    SELECT COALESCE(review_auto_send_enabled, false), COALESCE(review_auto_send_delay_days, 3)
      INTO v_enabled, v_delay
      FROM public.company_settings
      ORDER BY created_at ASC
      LIMIT 1;

    IF NOT COALESCE(v_enabled, false) THEN
      RETURN NEW;
    END IF;

    v_scheduled := now() + make_interval(days => COALESCE(v_delay, 0));

    INSERT INTO public.review_requests (
      organization_id, project_id, customer_id, customer_name,
      customer_email, customer_phone, project_address, channel, status, scheduled_send_at
    )
    SELECT
      NEW.organization_id, NEW.id, NEW.customer_id, NEW.customer_name,
      NEW.customer_email, NEW.customer_phone,
      COALESCE(NEW.address, '') || CASE WHEN NEW.city IS NOT NULL THEN ', ' || NEW.city ELSE '' END,
      CASE WHEN NEW.customer_email IS NOT NULL AND NEW.customer_email <> '' THEN 'email' ELSE 'sms' END,
      'pending', v_scheduled
    WHERE NOT EXISTS (
      SELECT 1 FROM public.review_requests rr WHERE rr.project_id = NEW.id
    )
    RETURNING id INTO v_request_id;

    IF v_request_id IS NOT NULL AND COALESCE(v_delay, 0) <= 0 THEN
      BEGIN
        PERFORM net.http_post(
          url := v_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_anon,
            'apikey', v_anon
          ),
          body := jsonb_build_object('review_request_id', v_request_id)
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'reputation-request invocation failed: %', SQLERRM;
      END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_review_request ON public.projects;
CREATE TRIGGER trg_enqueue_review_request
  AFTER UPDATE OF project_status ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_review_request_on_completion();

CREATE OR REPLACE FUNCTION public.dispatch_scheduled_review_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZm1ycXJic2Z4dnFoaWhwYW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjE5MTEsImV4cCI6MjA4NTYzNzkxMX0.TKL0qDwIrg9pXLewjpg1YmF_Pw5tCwUK7zdj7vho8A8';
  v_url text := 'https://dcfmrqrbsfxvqhihpamd.supabase.co/functions/v1/reputation-request';
  r record;
BEGIN
  FOR r IN
    SELECT id FROM public.review_requests
     WHERE status = 'pending'
       AND scheduled_send_at IS NOT NULL
       AND scheduled_send_at <= now()
     LIMIT 100
  LOOP
    BEGIN
      PERFORM net.http_post(
        url := v_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_anon,
          'apikey', v_anon
        ),
        body := jsonb_build_object('review_request_id', r.id)
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'reputation-request dispatch failed for %: %', r.id, SQLERRM;
    END;
  END LOOP;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('dispatch-scheduled-review-requests')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'dispatch-scheduled-review-requests');
    PERFORM cron.schedule(
      'dispatch-scheduled-review-requests',
      '0 * * * *',
      $cron$ SELECT public.dispatch_scheduled_review_requests(); $cron$
    );
  END IF;
END $$;
