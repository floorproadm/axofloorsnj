
-- 1. Create partners table
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text,
  phone text,
  partner_type text NOT NULL DEFAULT 'builder',
  service_zone text NOT NULL DEFAULT 'core',
  status text NOT NULL DEFAULT 'active',
  last_contacted_at timestamptz,
  next_action_date date,
  next_action_note text,
  total_referrals integer NOT NULL DEFAULT 0,
  total_converted integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- 3. RLS: admin full access
CREATE POLICY "partners_admin_all" ON public.partners
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. RLS: authenticated read
CREATE POLICY "partners_authenticated_read" ON public.partners
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 5. Add referred_by_partner_id to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS referred_by_partner_id uuid REFERENCES public.partners(id);

-- 6. Updated_at trigger for partners
CREATE TRIGGER set_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
