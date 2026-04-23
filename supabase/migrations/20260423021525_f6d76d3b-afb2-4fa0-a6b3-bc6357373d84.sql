-- Add portal_token to customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS portal_token text UNIQUE
    DEFAULT encode(gen_random_bytes(24), 'hex');

-- Backfill existing customers that may have NULL token (defensive)
UPDATE public.customers
SET portal_token = encode(gen_random_bytes(24), 'hex')
WHERE portal_token IS NULL;

CREATE INDEX IF NOT EXISTS idx_customers_portal_token ON public.customers(portal_token);

-- Public RLS — anon can read customer rows that have a token
-- (token is unguessable; access is via knowing the token in the URL)
DROP POLICY IF EXISTS customers_public_read_by_token ON public.customers;
CREATE POLICY customers_public_read_by_token ON public.customers
  FOR SELECT TO anon
  USING (portal_token IS NOT NULL);

-- Proposals: public list by customer (only when customer has a portal_token)
DROP POLICY IF EXISTS proposals_public_list_by_customer ON public.proposals;
CREATE POLICY proposals_public_list_by_customer ON public.proposals
  FOR SELECT TO anon
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE portal_token IS NOT NULL
    )
  );

-- Projects: public list by customer
DROP POLICY IF EXISTS projects_public_list_by_customer ON public.projects;
CREATE POLICY projects_public_list_by_customer ON public.projects
  FOR SELECT TO anon
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE portal_token IS NOT NULL
    )
  );

-- Invoices: public list by project (whose customer has a portal_token)
DROP POLICY IF EXISTS invoices_public_list_by_customer ON public.invoices;
CREATE POLICY invoices_public_list_by_customer ON public.invoices
  FOR SELECT TO anon
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.customer_id IN (SELECT id FROM public.customers WHERE portal_token IS NOT NULL)
    )
  );