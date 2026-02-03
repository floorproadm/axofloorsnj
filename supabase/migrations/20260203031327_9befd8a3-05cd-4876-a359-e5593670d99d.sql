-- 1. Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  zip_code TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for deduplication lookups
CREATE INDEX idx_customers_email_phone ON public.customers (email, phone);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Authenticated users can view customers"
ON public.customers FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create customers"
ON public.customers FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update customers"
ON public.customers FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete customers"
ON public.customers FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add customer_id FK to leads
ALTER TABLE public.leads
ADD COLUMN customer_id UUID REFERENCES public.customers(id);

-- 3. Add customer_id FK to projects
ALTER TABLE public.projects
ADD COLUMN customer_id UUID REFERENCES public.customers(id);

-- 4. Add customer_id FK to appointments
ALTER TABLE public.appointments
ADD COLUMN customer_id UUID REFERENCES public.customers(id);

-- 5. Migrate existing data from leads to customers
INSERT INTO public.customers (full_name, email, phone, address, city, zip_code, created_at)
SELECT DISTINCT ON (COALESCE(email, ''), COALESCE(phone, ''))
  name,
  email,
  phone,
  address,
  city,
  zip_code,
  MIN(created_at) OVER (PARTITION BY COALESCE(email, ''), COALESCE(phone, ''))
FROM public.leads
WHERE name IS NOT NULL
ON CONFLICT DO NOTHING;

-- 6. Migrate existing data from projects to customers (if not already exists)
INSERT INTO public.customers (full_name, email, phone, address, city, zip_code, created_at)
SELECT DISTINCT ON (COALESCE(customer_email, ''), COALESCE(customer_phone, ''))
  customer_name,
  customer_email,
  customer_phone,
  address,
  city,
  zip_code,
  MIN(created_at) OVER (PARTITION BY COALESCE(customer_email, ''), COALESCE(customer_phone, ''))
FROM public.projects
WHERE customer_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.customers c 
    WHERE c.email = projects.customer_email 
      AND c.phone = projects.customer_phone
  )
ON CONFLICT DO NOTHING;

-- 7. Update leads with customer_id
UPDATE public.leads l
SET customer_id = c.id
FROM public.customers c
WHERE (l.email = c.email OR (l.email IS NULL AND c.email IS NULL))
  AND (l.phone = c.phone OR (l.phone IS NULL AND c.phone IS NULL));

-- 8. Update projects with customer_id
UPDATE public.projects p
SET customer_id = c.id
FROM public.customers c
WHERE (p.customer_email = c.email OR (p.customer_email IS NULL AND c.email IS NULL))
  AND (p.customer_phone = c.phone OR (p.customer_phone IS NULL AND c.phone IS NULL));

-- 9. Update appointments with customer_id (match by phone + name)
UPDATE public.appointments a
SET customer_id = c.id
FROM public.customers c
WHERE a.customer_phone = c.phone
  AND a.customer_name = c.full_name;

-- Create indexes for FK lookups
CREATE INDEX idx_leads_customer_id ON public.leads (customer_id);
CREATE INDEX idx_projects_customer_id ON public.projects (customer_id);
CREATE INDEX idx_appointments_customer_id ON public.appointments (customer_id);