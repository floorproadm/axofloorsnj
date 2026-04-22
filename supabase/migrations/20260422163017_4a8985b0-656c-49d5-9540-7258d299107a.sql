
-- 1. Add columns to proposals
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_note text;

-- Generate share_token for existing proposals
UPDATE public.proposals
SET share_token = encode(gen_random_bytes(24), 'hex')
WHERE share_token IS NULL;

-- Default for new rows
ALTER TABLE public.proposals
  ALTER COLUMN share_token SET DEFAULT encode(gen_random_bytes(24), 'hex');

CREATE INDEX IF NOT EXISTS idx_proposals_share_token ON public.proposals(share_token);

-- 2. proposal_signatures table
CREATE TABLE IF NOT EXISTS public.proposal_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  signer_name text NOT NULL,
  signer_email text,
  signature_url text NOT NULL,
  selected_tier text CHECK (selected_tier IN ('good','better','best','flat')),
  payment_method text NOT NULL DEFAULT 'check' CHECK (payment_method IN ('check','zelle','stripe','other')),
  client_note text,
  ip_address inet,
  user_agent text,
  signed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposal_signatures_proposal_id ON public.proposal_signatures(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_signatures_org_id ON public.proposal_signatures(organization_id);

ALTER TABLE public.proposal_signatures ENABLE ROW LEVEL SECURITY;

-- Tenant read for admins
CREATE POLICY proposal_signatures_tenant_read
  ON public.proposal_signatures
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_org_id());

-- Public insert if proposal share_token exists (anonymous customer signs)
CREATE POLICY proposal_signatures_public_insert
  ON public.proposal_signatures
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    proposal_id IN (SELECT id FROM public.proposals WHERE share_token IS NOT NULL)
  );

-- 3. Public RLS for proposals: read by token + mark viewed
DROP POLICY IF EXISTS proposals_public_read_by_token ON public.proposals;
CREATE POLICY proposals_public_read_by_token
  ON public.proposals
  FOR SELECT
  TO anon
  USING (share_token IS NOT NULL);

DROP POLICY IF EXISTS proposals_public_mark_viewed ON public.proposals;
CREATE POLICY proposals_public_mark_viewed
  ON public.proposals
  FOR UPDATE
  TO anon
  USING (share_token IS NOT NULL)
  WITH CHECK (share_token IS NOT NULL);

-- 4. Public read companies & customers for proposal page
DROP POLICY IF EXISTS customers_public_read_via_proposal_token ON public.customers;
CREATE POLICY customers_public_read_via_proposal_token
  ON public.customers
  FOR SELECT
  TO anon
  USING (
    id IN (SELECT customer_id FROM public.proposals WHERE share_token IS NOT NULL)
  );

DROP POLICY IF EXISTS projects_public_read_via_proposal_token ON public.projects;
CREATE POLICY projects_public_read_via_proposal_token
  ON public.projects
  FOR SELECT
  TO anon
  USING (
    id IN (SELECT project_id FROM public.proposals WHERE share_token IS NOT NULL)
  );

DROP POLICY IF EXISTS company_settings_public_read_for_proposals ON public.company_settings;
CREATE POLICY company_settings_public_read_for_proposals
  ON public.company_settings
  FOR SELECT
  TO anon
  USING (true);

-- 5. Storage bucket for signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-signatures', 'proposal-signatures', false)
ON CONFLICT (id) DO NOTHING;

-- Public can upload signature (anyone signing)
DROP POLICY IF EXISTS proposal_signatures_anon_upload ON storage.objects;
CREATE POLICY proposal_signatures_anon_upload
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'proposal-signatures');

-- Authenticated admins can read signatures
DROP POLICY IF EXISTS proposal_signatures_admin_read ON storage.objects;
CREATE POLICY proposal_signatures_admin_read
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'proposal-signatures');

-- Public can read their own signature back (for confirmation page)
DROP POLICY IF EXISTS proposal_signatures_anon_read ON storage.objects;
CREATE POLICY proposal_signatures_anon_read
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'proposal-signatures');
