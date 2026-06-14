
-- 1) Provision a random shared secret in vault if not present.
DO $$
DECLARE
  v_secret text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'edge_webhook_secret') THEN
    v_secret := encode(gen_random_bytes(32), 'hex');
    PERFORM vault.create_secret(v_secret, 'edge_webhook_secret');
  END IF;
END $$;

-- 2) Service-role-only reader.
CREATE OR REPLACE FUNCTION public._get_edge_webhook_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'edge_webhook_secret' LIMIT 1
$$;
REVOKE EXECUTE ON FUNCTION public._get_edge_webhook_secret() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._get_edge_webhook_secret() TO service_role;

-- 3) Update notify_new_lead_email to include the secret header.
CREATE OR REPLACE FUNCTION public.notify_new_lead_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'vault'
AS $function$
DECLARE
  v_url text := 'https://dcfmrqrbsfxvqhihpamd.supabase.co/functions/v1/notify-new-lead';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZm1ycXJic2Z4dnFoaWhwYW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjE5MTEsImV4cCI6MjA4NTYzNzkxMX0.TKL0qDwIrg9pXLewjpg1YmF_Pw5tCwUK7zdj7vho8A8';
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'edge_webhook_secret' LIMIT 1;
  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon,
        'apikey', v_anon,
        'x-edge-webhook-secret', COALESCE(v_secret, '')
      ),
      body := jsonb_build_object('record', to_jsonb(NEW))
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_new_lead_email failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$function$;

-- 4) Update notify_partner_lead_progress_email.
CREATE OR REPLACE FUNCTION public.notify_partner_lead_progress_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'vault'
AS $function$
DECLARE
  v_url text := 'https://dcfmrqrbsfxvqhihpamd.supabase.co/functions/v1/notify-partner-lead-progress';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZm1ycXJic2Z4dnFoaWhwYW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjE5MTEsImV4cCI6MjA4NTYzNzkxMX0.TKL0qDwIrg9pXLewjpg1YmF_Pw5tCwUK7zdj7vho8A8';
  v_secret text;
BEGIN
  IF NEW.referred_by_partner_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'edge_webhook_secret' LIMIT 1;

  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon,
        'apikey', v_anon,
        'x-edge-webhook-secret', COALESCE(v_secret, '')
      ),
      body := jsonb_build_object('record', to_jsonb(NEW), 'old_status', OLD.status)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_partner_lead_progress_email failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$function$;

-- 5) Update enqueue_review_request_on_completion.
CREATE OR REPLACE FUNCTION public.enqueue_review_request_on_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'vault'
AS $function$
DECLARE
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZm1ycXJic2Z4dnFoaWhwYW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjE5MTEsImV4cCI6MjA4NTYzNzkxMX0.TKL0qDwIrg9pXLewjpg1YmF_Pw5tCwUK7zdj7vho8A8';
  v_url text := 'https://dcfmrqrbsfxvqhihpamd.supabase.co/functions/v1/reputation-request';
  v_request_id uuid;
  v_secret text;
BEGIN
  IF NEW.project_status = 'completed' AND (OLD.project_status IS NULL OR OLD.project_status <> 'completed') THEN
    INSERT INTO public.review_requests (
      organization_id, project_id, customer_id, customer_name,
      customer_email, customer_phone, project_address, channel, status
    )
    SELECT
      NEW.organization_id, NEW.id, NEW.customer_id, NEW.customer_name,
      NEW.customer_email, NEW.customer_phone,
      COALESCE(NEW.address, '') || CASE WHEN NEW.city IS NOT NULL THEN ', ' || NEW.city ELSE '' END,
      CASE WHEN NEW.customer_email IS NOT NULL AND NEW.customer_email <> '' THEN 'email' ELSE 'sms' END,
      'pending'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.review_requests rr WHERE rr.project_id = NEW.id
    )
    RETURNING id INTO v_request_id;

    IF v_request_id IS NOT NULL THEN
      SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'edge_webhook_secret' LIMIT 1;
      BEGIN
        PERFORM net.http_post(
          url := v_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_anon,
            'apikey', v_anon,
            'x-edge-webhook-secret', COALESCE(v_secret, '')
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
$function$;

-- 6) Update retry_failed_review_requests.
CREATE OR REPLACE FUNCTION public.retry_failed_review_requests()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'vault'
AS $function$
DECLARE
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZm1ycXJic2Z4dnFoaWhwYW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjE5MTEsImV4cCI6MjA4NTYzNzkxMX0.TKL0qDwIrg9pXLewjpg1YmF_Pw5tCwUK7zdj7vho8A8';
  v_url text := 'https://dcfmrqrbsfxvqhihpamd.supabase.co/functions/v1/reputation-request';
  v_row record;
  v_count int := 0;
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'edge_webhook_secret' LIMIT 1;
  FOR v_row IN
    SELECT id FROM public.review_requests
    WHERE status = 'failed' AND attempts < 3
      AND (next_attempt_at IS NULL OR next_attempt_at <= now())
    LIMIT 50
  LOOP
    BEGIN
      PERFORM net.http_post(
        url := v_url,
        headers := jsonb_build_object(
          'Content-Type','application/json',
          'Authorization','Bearer ' || v_anon,
          'apikey', v_anon,
          'x-edge-webhook-secret', COALESCE(v_secret, '')
        ),
        body := jsonb_build_object('review_request_id', v_row.id, 'is_retry', true)
      );
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'retry invoke failed for %: %', v_row.id, SQLERRM;
    END;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'retried', v_count);
END;
$function$;
