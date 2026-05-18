
ALTER TABLE public.appointment_requests
  ADD COLUMN IF NOT EXISTS address text;
