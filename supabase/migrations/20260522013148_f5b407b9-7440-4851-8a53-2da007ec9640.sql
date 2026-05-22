
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS referring_partner_id uuid;

CREATE INDEX IF NOT EXISTS idx_proposals_referring_partner
  ON public.proposals (referring_partner_id)
  WHERE referring_partner_id IS NOT NULL;

DROP POLICY IF EXISTS proposals_partner_read_own ON public.proposals;
CREATE POLICY proposals_partner_read_own
  ON public.proposals
  FOR SELECT
  TO authenticated
  USING (
    referring_partner_id IS NOT NULL
    AND referring_partner_id = public.get_partner_id_for_user()
  );
