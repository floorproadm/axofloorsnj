CREATE OR REPLACE FUNCTION public.notify_partner_lead_progress_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_url text := 'https://dcfmrqrbsfxvqhihpamd.supabase.co/functions/v1/notify-partner-lead-progress';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZm1ycXJic2Z4dnFoaWhwYW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjE5MTEsImV4cCI6MjA4NTYzNzkxMX0.TKL0qDwIrg9pXLewjpg1YmF_Pw5tCwUK7zdj7vho8A8';
BEGIN
  -- Only when status actually changed and the lead came from a partner
  IF NEW.referred_by_partner_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon,
        'apikey', v_anon
      ),
      body := jsonb_build_object(
        'record', to_jsonb(NEW),
        'old_status', OLD.status
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_partner_lead_progress_email failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_partner_lead_progress ON public.leads;
CREATE TRIGGER trg_notify_partner_lead_progress
AFTER UPDATE OF status ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.notify_partner_lead_progress_email();