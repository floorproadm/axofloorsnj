-- 1. Trigger on projects → enqueue review request on completion
DROP TRIGGER IF EXISTS trg_enqueue_review_request ON public.projects;
CREATE TRIGGER trg_enqueue_review_request
AFTER UPDATE OF project_status ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_review_request_on_completion();

-- 2. Retry tracking columns
ALTER TABLE public.review_requests
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz;

-- 3. Retry function — picks failed requests, attempts<3, due, and re-invokes edge function
CREATE OR REPLACE FUNCTION public.retry_failed_review_requests()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZm1ycXJic2Z4dnFoaWhwYW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjE5MTEsImV4cCI6MjA4NTYzNzkxMX0.TKL0qDwIrg9pXLewjpg1YmF_Pw5tCwUK7zdj7vho8A8';
  v_url text := 'https://dcfmrqrbsfxvqhihpamd.supabase.co/functions/v1/reputation-request';
  v_row record;
  v_count int := 0;
BEGIN
  FOR v_row IN
    SELECT id FROM public.review_requests
    WHERE status = 'failed'
      AND attempts < 3
      AND (next_attempt_at IS NULL OR next_attempt_at <= now())
    LIMIT 50
  LOOP
    BEGIN
      PERFORM net.http_post(
        url := v_url,
        headers := jsonb_build_object(
          'Content-Type','application/json',
          'Authorization','Bearer ' || v_anon,
          'apikey', v_anon
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
$$;