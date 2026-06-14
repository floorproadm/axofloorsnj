
-- 1) Cross-tenant fix for media_files: scope authenticated reads to caller's org.
DROP POLICY IF EXISTS media_files_authenticated_read ON public.media_files;
CREATE POLICY media_files_authenticated_read ON public.media_files
FOR SELECT TO authenticated
USING (
  visibility = 'public'
  OR (
    visibility = ANY (ARRAY['internal','client'])
    AND (
      (project_id IS NOT NULL AND project_id IN (
        SELECT id FROM public.projects WHERE organization_id = public.get_user_org_id()
      ))
      OR (feed_post_id IS NOT NULL AND feed_post_id IN (
        SELECT id FROM public.feed_posts WHERE organization_id = public.get_user_org_id()
      ))
    )
  )
);

-- 2) Feed post images shared read must require published + public.
DROP POLICY IF EXISTS feed_post_images_shared_read ON public.feed_post_images;
CREATE POLICY feed_post_images_shared_read ON public.feed_post_images
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.feed_posts fp
    WHERE fp.id = feed_post_images.feed_post_id
      AND fp.share_token IS NOT NULL
      AND fp.visibility = 'public'
      AND fp.status = 'published'
  )
);

-- 3) Replace open anon insert on proposal_change_requests with a portal-token gated RPC.
DROP POLICY IF EXISTS proposal_change_requests_portal_token_insert ON public.proposal_change_requests;

CREATE OR REPLACE FUNCTION public.submit_proposal_change_request(
  p_token text,
  p_proposal_id uuid,
  p_message text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_proposal public.proposals%ROWTYPE;
  v_id uuid;
BEGIN
  IF p_token IS NULL OR length(p_token) < 8 THEN
    RAISE EXCEPTION 'invalid token';
  END IF;
  IF p_message IS NULL OR length(btrim(p_message)) < 10 THEN
    RAISE EXCEPTION 'message must be at least 10 characters';
  END IF;
  IF length(p_message) > 4000 THEN
    RAISE EXCEPTION 'message too long';
  END IF;

  SELECT * INTO v_customer FROM public.customers WHERE portal_token = p_token LIMIT 1;
  IF v_customer.id IS NULL THEN
    RAISE EXCEPTION 'invalid token';
  END IF;

  SELECT * INTO v_proposal FROM public.proposals WHERE id = p_proposal_id LIMIT 1;
  IF v_proposal.id IS NULL THEN
    RAISE EXCEPTION 'proposal not found';
  END IF;
  IF v_proposal.customer_id IS DISTINCT FROM v_customer.id THEN
    RAISE EXCEPTION 'proposal does not belong to this portal';
  END IF;

  INSERT INTO public.proposal_change_requests (
    proposal_id, customer_id, organization_id, message
  ) VALUES (
    p_proposal_id, v_customer.id, v_proposal.organization_id, btrim(p_message)
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_proposal_change_request(text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_proposal_change_request(text, uuid, text) TO anon, authenticated;
