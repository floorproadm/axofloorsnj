GRANT SELECT ON public.proposal_signatures TO anon;

CREATE POLICY "proposal_signatures_public_read_by_token"
ON public.proposal_signatures
FOR SELECT
TO anon
USING (
  proposal_id IN (
    SELECT id FROM public.proposals WHERE share_token IS NOT NULL
  )
);