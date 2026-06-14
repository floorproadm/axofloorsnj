
-- 1. Drop anon "IS NOT NULL" share_token policies
DROP POLICY IF EXISTS invoices_public_read_by_token ON public.invoices;
DROP POLICY IF EXISTS invoices_public_mark_viewed ON public.invoices;
DROP POLICY IF EXISTS proposals_public_read_by_token ON public.proposals;
DROP POLICY IF EXISTS proposals_public_mark_viewed ON public.proposals;
DROP POLICY IF EXISTS proposals_public_update_by_token ON public.proposals;
DROP POLICY IF EXISTS projects_public_read_via_proposal_token ON public.projects;
DROP POLICY IF EXISTS customers_public_read_via_proposal_token ON public.customers;
DROP POLICY IF EXISTS customer_properties_public_read_via_invoice_token ON public.customer_properties;
DROP POLICY IF EXISTS customer_properties_public_read_via_proposal_token ON public.customer_properties;
DROP POLICY IF EXISTS proposal_signatures_public_read_by_token ON public.proposal_signatures;
DROP POLICY IF EXISTS proposal_signatures_public_insert ON public.proposal_signatures;

-- 2. Drop the unsafe anon insert on proposal_change_requests (the new SECURITY DEFINER RPC handles it)
DROP POLICY IF EXISTS "Anonymous can submit change requests via portal token" ON public.proposal_change_requests;

-- 3. Tighten feed_post_images_shared_read with visibility/status (idempotent re-create)
DROP POLICY IF EXISTS feed_post_images_shared_read ON public.feed_post_images;
CREATE POLICY feed_post_images_shared_read ON public.feed_post_images
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.feed_posts fp
    WHERE fp.id = feed_post_images.feed_post_id
      AND fp.share_token IS NOT NULL
      AND fp.visibility = 'public'
      AND fp.status = 'published'
  ));

-- 4. SECURITY DEFINER RPCs for public consumption via share_token
CREATE OR REPLACE FUNCTION public.public_get_proposal_bundle(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prop public.proposals%ROWTYPE;
  v_proj jsonb;
  v_cust jsonb;
  v_prop_addr jsonb;
  v_items jsonb;
  v_company jsonb;
  v_plan text;
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN
    RETURN NULL;
  END IF;
  SELECT * INTO v_prop FROM public.proposals WHERE share_token = p_token LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT to_jsonb(p) INTO v_proj FROM public.projects p WHERE p.id = v_prop.project_id;
  IF v_prop.customer_id IS NOT NULL THEN
    SELECT to_jsonb(c) INTO v_cust FROM public.customers c WHERE c.id = v_prop.customer_id;
  END IF;
  IF v_prop.property_id IS NOT NULL THEN
    SELECT to_jsonb(cp) INTO v_prop_addr FROM public.customer_properties cp WHERE cp.id = v_prop.property_id;
  END IF;
  SELECT COALESCE(jsonb_agg(to_jsonb(li) ORDER BY li.display_order NULLS LAST), '[]'::jsonb)
    INTO v_items FROM public.proposal_line_items li WHERE li.proposal_id = v_prop.id;

  BEGIN
    SELECT public.get_org_plan(v_prop.organization_id) INTO v_plan;
  EXCEPTION WHEN OTHERS THEN v_plan := NULL;
  END;

  IF v_plan IN ('pro','enterprise') THEN
    SELECT to_jsonb(cs) INTO v_company FROM public.company_settings cs
      WHERE cs.organization_id = v_prop.organization_id LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'proposal', to_jsonb(v_prop),
    'project', v_proj,
    'customer', v_cust,
    'property', v_prop_addr,
    'line_items', v_items,
    'company', v_company,
    'plan', v_plan
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.public_mark_proposal_viewed(p_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.proposals
     SET viewed_at = COALESCE(viewed_at, now()),
         status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END
   WHERE share_token = p_token AND p_token IS NOT NULL AND length(p_token) >= 16;
$$;

CREATE OR REPLACE FUNCTION public.public_accept_proposal(
  p_token text,
  p_signer_name text,
  p_signer_email text,
  p_signature_url text,
  p_selected_tier text DEFAULT NULL,
  p_payment_method text DEFAULT 'check',
  p_user_agent text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prop public.proposals%ROWTYPE;
  v_sig_id uuid;
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN
    RAISE EXCEPTION 'invalid token';
  END IF;
  IF coalesce(trim(p_signer_name), '') = '' OR coalesce(trim(p_signature_url), '') = '' THEN
    RAISE EXCEPTION 'missing required fields';
  END IF;
  SELECT * INTO v_prop FROM public.proposals WHERE share_token = p_token LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found'; END IF;
  IF v_prop.status IN ('accepted','rejected','expired') THEN
    RAISE EXCEPTION 'proposal not acceptable';
  END IF;

  INSERT INTO public.proposal_signatures(
    proposal_id, organization_id, signer_name, signer_email,
    signature_url, selected_tier, payment_method, user_agent
  ) VALUES (
    v_prop.id, v_prop.organization_id,
    left(trim(p_signer_name), 200),
    nullif(left(trim(p_signer_email), 320), ''),
    left(p_signature_url, 2000),
    CASE WHEN p_selected_tier IN ('good','better','best','flat') THEN p_selected_tier ELSE NULL END,
    CASE WHEN p_payment_method IN ('check','zelle','stripe','other') THEN p_payment_method ELSE 'check' END,
    left(coalesce(p_user_agent,''), 500)
  ) RETURNING id INTO v_sig_id;

  UPDATE public.proposals
     SET status = 'accepted',
         accepted_at = now(),
         selected_tier = CASE
           WHEN p_selected_tier IN ('good','better','best') THEN p_selected_tier
           ELSE selected_tier
         END
   WHERE id = v_prop.id;

  RETURN jsonb_build_object('signature_id', v_sig_id, 'proposal_id', v_prop.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.public_decline_proposal(p_token text, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN
    RAISE EXCEPTION 'invalid token';
  END IF;
  UPDATE public.proposals
     SET status = 'rejected',
         rejected_at = now(),
         rejection_reason = nullif(left(coalesce(p_reason,''), 1000), '')
   WHERE share_token = p_token
     AND status NOT IN ('accepted','rejected','expired');
END;
$$;

CREATE OR REPLACE FUNCTION public.public_get_invoice_bundle(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.invoices%ROWTYPE;
  v_items jsonb;
  v_schedule jsonb;
  v_property jsonb;
  v_company jsonb;
  v_customer jsonb;
  v_project jsonb;
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN RETURN NULL; END IF;
  SELECT * INTO v_inv FROM public.invoices WHERE share_token = p_token LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(i) ORDER BY i.created_at), '[]'::jsonb)
    INTO v_items FROM public.invoice_items i WHERE i.invoice_id = v_inv.id;
  SELECT COALESCE(jsonb_agg(to_jsonb(s) ORDER BY s.phase_order), '[]'::jsonb)
    INTO v_schedule FROM public.invoice_payment_schedule s WHERE s.invoice_id = v_inv.id;
  IF v_inv.property_id IS NOT NULL THEN
    SELECT to_jsonb(cp) INTO v_property FROM public.customer_properties cp WHERE cp.id = v_inv.property_id;
  END IF;
  IF v_inv.customer_id IS NOT NULL THEN
    SELECT jsonb_build_object('id', c.id, 'name', c.name, 'email', c.email, 'phone', c.phone, 'address', c.address)
      INTO v_customer FROM public.customers c WHERE c.id = v_inv.customer_id;
  END IF;
  SELECT jsonb_build_object('id', p.id, 'project_number', p.project_number, 'address', p.address, 'status', p.status)
    INTO v_project FROM public.projects p WHERE p.id = v_inv.project_id;
  SELECT jsonb_build_object('company_name', cs.company_name, 'phone', cs.phone, 'email', cs.email, 'website', cs.website, 'logo_url', cs.logo_url)
    INTO v_company FROM public.company_settings cs WHERE cs.organization_id = v_inv.organization_id LIMIT 1;

  RETURN jsonb_build_object(
    'invoice', to_jsonb(v_inv),
    'items', v_items,
    'schedule', v_schedule,
    'property', v_property,
    'customer', v_customer,
    'project', v_project,
    'company', v_company
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.public_mark_invoice_viewed(p_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.invoices SET viewed_at = COALESCE(viewed_at, now())
   WHERE share_token = p_token AND p_token IS NOT NULL AND length(p_token) >= 16;
$$;

CREATE OR REPLACE FUNCTION public.public_get_deposit_invoice_bundle(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bundle jsonb;
  v_prop_id uuid;
  v_sig jsonb;
BEGIN
  v_bundle := public.public_get_proposal_bundle(p_token);
  IF v_bundle IS NULL THEN RETURN NULL; END IF;
  v_prop_id := (v_bundle->'proposal'->>'id')::uuid;
  SELECT to_jsonb(ps) INTO v_sig
    FROM public.proposal_signatures ps
   WHERE ps.proposal_id = v_prop_id
   ORDER BY ps.signed_at DESC
   LIMIT 1;
  RETURN v_bundle || jsonb_build_object('signature', v_sig);
END;
$$;

REVOKE ALL ON FUNCTION public.public_get_proposal_bundle(text) FROM public;
REVOKE ALL ON FUNCTION public.public_get_invoice_bundle(text) FROM public;
REVOKE ALL ON FUNCTION public.public_get_deposit_invoice_bundle(text) FROM public;
REVOKE ALL ON FUNCTION public.public_mark_proposal_viewed(text) FROM public;
REVOKE ALL ON FUNCTION public.public_mark_invoice_viewed(text) FROM public;
REVOKE ALL ON FUNCTION public.public_accept_proposal(text,text,text,text,text,text,text) FROM public;
REVOKE ALL ON FUNCTION public.public_decline_proposal(text,text) FROM public;

GRANT EXECUTE ON FUNCTION public.public_get_proposal_bundle(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_get_invoice_bundle(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_get_deposit_invoice_bundle(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_mark_proposal_viewed(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_mark_invoice_viewed(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_accept_proposal(text,text,text,text,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_decline_proposal(text,text) TO anon, authenticated;
