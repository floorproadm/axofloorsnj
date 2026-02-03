-- 1. Create enum for labor pricing model
CREATE TYPE public.labor_pricing_model AS ENUM ('sqft', 'daily');

-- 2. Create company_settings table (single row)
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'AXO Floors',
  default_margin_min_percent NUMERIC NOT NULL DEFAULT 30,
  labor_pricing_model labor_pricing_model NOT NULL DEFAULT 'sqft',
  default_labor_rate NUMERIC NOT NULL DEFAULT 3.50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Constraint: only one row allowed
  CONSTRAINT single_company CHECK (id IS NOT NULL)
);

-- 3. Create unique constraint to enforce single row
CREATE UNIQUE INDEX idx_company_settings_singleton ON public.company_settings ((true));

-- 4. Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - readable by authenticated, writable by admin only
CREATE POLICY "Authenticated users can view company settings"
ON public.company_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update company settings"
ON public.company_settings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert company settings"
ON public.company_settings FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Insert default row
INSERT INTO public.company_settings (company_name, default_margin_min_percent, labor_pricing_model, default_labor_rate)
VALUES ('AXO Floors', 30, 'sqft', 3.50);