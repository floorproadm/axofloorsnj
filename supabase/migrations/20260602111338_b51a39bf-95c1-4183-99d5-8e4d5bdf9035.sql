
-- =========================================================
-- Phase 1: Multi-property per customer (additive)
-- =========================================================

-- 1) customer_properties table
CREATE TABLE public.customer_properties (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  customer_id     uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  unit_identifier text NOT NULL,
  resident_name   text,
  address_line1   text,
  address_line2   text,
  city            text,
  state           text,
  zip             text,
  is_primary      boolean NOT NULL DEFAULT false,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_properties_customer ON public.customer_properties(customer_id);
CREATE INDEX idx_customer_properties_org      ON public.customer_properties(organization_id);
CREATE UNIQUE INDEX uniq_customer_primary_property
  ON public.customer_properties(customer_id) WHERE is_primary;

-- 2) GRANTs (auth-only writes; anon SELECT permitted only via token-chained policy)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_properties TO authenticated;
GRANT SELECT ON public.customer_properties TO anon;
GRANT ALL    ON public.customer_properties TO service_role;

-- 3) RLS
ALTER TABLE public.customer_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_properties_tenant_all
  ON public.customer_properties
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

-- Public read via proposal share token (mirror of customers_public_read_via_proposal_token)
CREATE POLICY customer_properties_public_read_via_proposal_token
  ON public.customer_properties
  FOR SELECT TO anon
  USING (
    customer_id IN (
      SELECT p.customer_id FROM public.proposals p WHERE p.share_token IS NOT NULL
    )
  );

-- Public read via invoice share token
CREATE POLICY customer_properties_public_read_via_invoice_token
  ON public.customer_properties
  FOR SELECT TO anon
  USING (
    customer_id IN (
      SELECT i.customer_id FROM public.invoices i WHERE i.share_token IS NOT NULL
    )
  );

-- 4) updated_at trigger (reuse existing helper)
CREATE TRIGGER trg_customer_properties_updated_at
  BEFORE UPDATE ON public.customer_properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Additive nullable FKs on existing tables
ALTER TABLE public.projects
  ADD COLUMN property_id uuid NULL REFERENCES public.customer_properties(id) ON DELETE SET NULL;

ALTER TABLE public.proposals
  ADD COLUMN property_id uuid NULL REFERENCES public.customer_properties(id) ON DELETE SET NULL;

ALTER TABLE public.appointments
  ADD COLUMN property_id uuid NULL REFERENCES public.customer_properties(id) ON DELETE SET NULL;

ALTER TABLE public.invoices
  ADD COLUMN property_id uuid NULL REFERENCES public.customer_properties(id) ON DELETE SET NULL;

CREATE INDEX idx_projects_property_id     ON public.projects(property_id);
CREATE INDEX idx_proposals_property_id    ON public.proposals(property_id);
CREATE INDEX idx_appointments_property_id ON public.appointments(property_id);
CREATE INDEX idx_invoices_property_id     ON public.invoices(property_id);

-- 6) Backfill: one primary property per existing customer that has an address
INSERT INTO public.customer_properties
  (organization_id, customer_id, unit_identifier, address_line1, city, zip, is_primary)
SELECT
  c.organization_id,
  c.id,
  'Primary',
  c.address,
  c.city,
  c.zip_code,
  true
FROM public.customers c
WHERE c.address IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.customer_properties cp WHERE cp.customer_id = c.id
  );
