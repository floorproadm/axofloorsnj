-- Ensure pg_net is available for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_new_lead_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_url text := 'https://dcfmrqrbsfxvqhihpamd.supabase.co/functions/v1/notify-new-lead';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZm1ycXJic2Z4dnFoaWhwYW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjE5MTEsImV4cCI6MjA4NTYzNzkxMX0.TKL0qDwIrg9pXLewjpg1YmF_Pw5tCwUK7zdj7vho8A8';
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon,
        'apikey', v_anon
      ),
      body := jsonb_build_object('record', to_jsonb(NEW))
    );
  EXCEPTION WHEN OTHERS THEN
    -- Best-effort: never break lead creation due to notification failure
    RAISE WARNING 'notify_new_lead_email failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_lead ON public.leads;

CREATE TRIGGER trg_notify_new_lead
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_lead_email();