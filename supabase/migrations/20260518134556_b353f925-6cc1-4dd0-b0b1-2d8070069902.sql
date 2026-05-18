
-- B2B price list
CREATE TABLE public.b2b_price_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  wholesale_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  retail_price NUMERIC(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_b2b_price_list_org ON public.b2b_price_list(organization_id);
ALTER TABLE public.b2b_price_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read prices" ON public.b2b_price_list
FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Org members manage prices" ON public.b2b_price_list
FOR ALL TO authenticated
USING (organization_id = public.get_user_org_id())
WITH CHECK (organization_id = public.get_user_org_id());

CREATE TRIGGER trg_b2b_price_list_updated
BEFORE UPDATE ON public.b2b_price_list
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Partner quotes
CREATE TABLE public.partner_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  quote_number TEXT,
  job_address TEXT,
  partner_client_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ
);
CREATE INDEX idx_partner_quotes_org ON public.partner_quotes(organization_id);
CREATE INDEX idx_partner_quotes_partner ON public.partner_quotes(partner_id);
ALTER TABLE public.partner_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read quotes" ON public.partner_quotes
FOR SELECT TO authenticated
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Org members manage quotes" ON public.partner_quotes
FOR ALL TO authenticated
USING (organization_id = public.get_user_org_id())
WITH CHECK (organization_id = public.get_user_org_id());

-- Partner users can read their own quotes
CREATE POLICY "Partner reads own quotes" ON public.partner_quotes
FOR SELECT TO authenticated
USING (partner_id = public.get_partner_id_for_user());

-- Partner users can update status (accept/decline) on their own quotes
CREATE POLICY "Partner updates own quote status" ON public.partner_quotes
FOR UPDATE TO authenticated
USING (partner_id = public.get_partner_id_for_user())
WITH CHECK (partner_id = public.get_partner_id_for_user());

CREATE TRIGGER trg_partner_quotes_updated
BEFORE UPDATE ON public.partner_quotes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default B2B price list for AXO org
INSERT INTO public.b2b_price_list (organization_id, service_name, unit, wholesale_price, retail_price, display_order) VALUES
('a0000000-0000-0000-0000-000000000001', 'Sanding & Finish', 'sqft', 3.50, 5.00, 10),
('a0000000-0000-0000-0000-000000000001', 'Hardwood Installation', 'sqft', 4.50, 7.00, 20),
('a0000000-0000-0000-0000-000000000001', 'Stair Steps - Sanding', 'step', 35.00, 55.00, 30),
('a0000000-0000-0000-0000-000000000001', 'Stair Steps - Installation', 'step', 75.00, 110.00, 40),
('a0000000-0000-0000-0000-000000000001', 'Railings', 'linear ft', 25.00, 40.00, 50),
('a0000000-0000-0000-0000-000000000001', 'Wood Repair', 'sqft', 8.00, 12.00, 60),
('a0000000-0000-0000-0000-000000000001', 'Subfloor Repair', 'sqft', 6.00, 9.00, 70),
('a0000000-0000-0000-0000-000000000001', 'Transition Strips', 'unit', 35.00, 55.00, 80),
('a0000000-0000-0000-0000-000000000001', 'Baseboard Removal', 'linear ft', 2.50, 4.00, 90);
