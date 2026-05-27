-- Create proposal_line_items
CREATE TABLE IF NOT EXISTS public.proposal_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'other',
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  amount numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposal_line_items_proposal ON public.proposal_line_items(proposal_id);

GRANT SELECT ON public.proposal_line_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposal_line_items TO authenticated;
GRANT ALL ON public.proposal_line_items TO service_role;

ALTER TABLE public.proposal_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposal_line_items_tenant_all"
ON public.proposal_line_items
FOR ALL
TO authenticated
USING (proposal_id IN (SELECT id FROM public.proposals WHERE organization_id = get_user_org_id()))
WITH CHECK (proposal_id IN (SELECT id FROM public.proposals WHERE organization_id = get_user_org_id()));

CREATE POLICY "proposal_line_items_public_read_by_token"
ON public.proposal_line_items
FOR SELECT
TO anon
USING (proposal_id IN (SELECT id FROM public.proposals WHERE share_token IS NOT NULL));

-- Add rejection columns to proposals
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz;

-- Allow anon to update proposal by share_token (for decline + viewed)
DROP POLICY IF EXISTS "proposals_public_update_by_token" ON public.proposals;
CREATE POLICY "proposals_public_update_by_token"
ON public.proposals
FOR UPDATE
TO anon
USING (share_token IS NOT NULL)
WITH CHECK (share_token IS NOT NULL);