
CREATE TABLE IF NOT EXISTS public.review_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  customer_id UUID,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  project_address TEXT,
  channel TEXT NOT NULL DEFAULT 'email',
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  rating NUMERIC,
  review_text TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_requests_org ON public.review_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_project ON public.review_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON public.review_requests(status);

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members view review_requests" ON public.review_requests
  FOR SELECT USING (organization_id = public.get_user_org_id());
CREATE POLICY "org members insert review_requests" ON public.review_requests
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "org members update review_requests" ON public.review_requests
  FOR UPDATE USING (organization_id = public.get_user_org_id());
CREATE POLICY "org admins delete review_requests" ON public.review_requests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = review_requests.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin','owner')
    )
  );

CREATE TRIGGER trg_review_requests_updated
  BEFORE UPDATE ON public.review_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: enqueue a pending review request when project marked completed
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
