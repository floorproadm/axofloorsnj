
-- Branding columns for company_settings
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#d97706';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#1e3a5f';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS trade_name text DEFAULT 'AXO Floors';

-- Allow admins to view all profiles (for Team section)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
