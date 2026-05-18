
ALTER TABLE public.appointment_requests
  ALTER COLUMN customer_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

ALTER TABLE public.appointment_requests
  DROP CONSTRAINT IF EXISTS appointment_requests_customer_or_lead_chk;

ALTER TABLE public.appointment_requests
  ADD CONSTRAINT appointment_requests_customer_or_lead_chk
  CHECK (customer_id IS NOT NULL OR lead_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_appointment_requests_lead_id
  ON public.appointment_requests(lead_id);
