
DROP POLICY IF EXISTS "customers_public_read_by_token" ON public.customers;
DROP POLICY IF EXISTS "projects_public_list_by_customer" ON public.projects;
DROP POLICY IF EXISTS "proposals_public_list_by_customer" ON public.proposals;
DROP POLICY IF EXISTS "invoices_public_list_by_customer" ON public.invoices;
DROP POLICY IF EXISTS "Anonymous can view change requests for portal customers" ON public.proposal_change_requests;

DROP POLICY IF EXISTS "customers_authenticated_read" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view audit log" ON public.audit_log;
DROP POLICY IF EXISTS "job_proof_authenticated_read" ON public.job_proof;
DROP POLICY IF EXISTS "project_documents_authenticated_read" ON public.project_documents;
DROP POLICY IF EXISTS "Authenticated users can view quiz responses" ON public.quiz_responses;

CREATE POLICY "audit_log_org_read" ON public.audit_log
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "job_proof_org_read" ON public.job_proof
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = public.get_user_org_id()));

CREATE POLICY "project_documents_org_read" ON public.project_documents
  FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = public.get_user_org_id()));

CREATE POLICY "quiz_responses_org_read" ON public.quiz_responses
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

DROP POLICY IF EXISTS "feed_posts_shared_read" ON public.feed_posts;
CREATE POLICY "feed_posts_shared_read" ON public.feed_posts
  FOR SELECT TO anon, authenticated
  USING (share_token IS NOT NULL AND visibility = 'public' AND status = 'published');

DROP POLICY IF EXISTS "media_anon_read" ON storage.objects;

CREATE OR REPLACE FUNCTION public.get_customer_portal(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_proposals jsonb;
  v_projects jsonb;
  v_invoices jsonb;
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_customer
  FROM public.customers
  WHERE portal_token = p_token
  LIMIT 1;

  IF v_customer.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(p) - 'margin_good' - 'margin_better' - 'margin_best' - 'internal_notes' ORDER BY p.created_at DESC), '[]'::jsonb)
    INTO v_proposals
  FROM public.proposals p
  WHERE p.customer_id = v_customer.id;

  SELECT COALESCE(jsonb_agg(to_jsonb(pr) ORDER BY pr.created_at DESC), '[]'::jsonb)
    INTO v_projects
  FROM public.projects pr
  WHERE pr.customer_id = v_customer.id;

  SELECT COALESCE(jsonb_agg(to_jsonb(i) ORDER BY i.due_date DESC), '[]'::jsonb)
    INTO v_invoices
  FROM public.invoices i
  WHERE i.project_id IN (SELECT id FROM public.projects WHERE customer_id = v_customer.id);

  RETURN jsonb_build_object(
    'customer', jsonb_build_object(
      'id', v_customer.id,
      'full_name', v_customer.full_name,
      'email', v_customer.email,
      'phone', v_customer.phone,
      'portal_token', v_customer.portal_token,
      'organization_id', v_customer.organization_id
    ),
    'proposals', v_proposals,
    'projects', v_projects,
    'invoices', v_invoices
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_customer_portal(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_customer_portal(text) TO anon, authenticated;
