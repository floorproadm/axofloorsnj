
-- Table for client appointment requests from public portal
CREATE TABLE public.appointment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  service_type TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

-- Public insert (portal has no auth, uses customer token)
CREATE POLICY "Anyone can create appointment requests"
ON public.appointment_requests
FOR INSERT
WITH CHECK (true);

-- Org admins can read
CREATE POLICY "Org admins can view appointment requests"
ON public.appointment_requests
FOR SELECT
TO authenticated
USING (organization_id = public.get_user_org_id());

-- Org admins can update (confirm/cancel)
CREATE POLICY "Org admins can update appointment requests"
ON public.appointment_requests
FOR UPDATE
TO authenticated
USING (organization_id = public.get_user_org_id());

-- Timestamp trigger
CREATE TRIGGER update_appointment_requests_updated_at
BEFORE UPDATE ON public.appointment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
