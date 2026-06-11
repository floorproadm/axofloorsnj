
CREATE OR REPLACE FUNCTION public.spu_org_detail(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org jsonb;
  v_owner jsonb;
  v_members jsonb;
  v_recent_projects jsonb;
  v_lead_summary jsonb;
  v_totals jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT to_jsonb(o) INTO v_org FROM public.organizations o WHERE o.id = p_org_id;
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'organization not found';
  END IF;

  SELECT jsonb_build_object(
    'user_id', p.user_id,
    'full_name', p.full_name,
    'email', p.email,
    'phone', p.phone,
    'created_at', p.created_at
  )
  INTO v_owner
  FROM public.organization_members om
  JOIN public.profiles p ON p.user_id = om.user_id
  WHERE om.organization_id = p_org_id AND om.role = 'owner'
  ORDER BY om.user_id LIMIT 1;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'user_id', p.user_id,
    'full_name', p.full_name,
    'email', p.email,
    'role', om.role
  ) ORDER BY om.role), '[]'::jsonb)
  INTO v_members
  FROM public.organization_members om
  LEFT JOIN public.profiles p ON p.user_id = om.user_id
  WHERE om.organization_id = p_org_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', pr.id,
    'customer_name', pr.customer_name,
    'address', pr.address,
    'project_status', pr.project_status,
    'project_type', pr.project_type,
    'start_date', pr.start_date,
    'completion_date', pr.completion_date,
    'created_at', pr.created_at
  ) ORDER BY pr.created_at DESC), '[]'::jsonb)
  INTO v_recent_projects
  FROM (
    SELECT * FROM public.projects
    WHERE organization_id = p_org_id
    ORDER BY created_at DESC
    LIMIT 10
  ) pr;

  SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::jsonb)
  INTO v_lead_summary
  FROM (
    SELECT status, count(*)::int AS cnt
    FROM public.leads
    WHERE organization_id = p_org_id
    GROUP BY status
  ) s;

  SELECT jsonb_build_object(
    'total_projects', (SELECT count(*) FROM public.projects WHERE organization_id = p_org_id),
    'total_leads', (SELECT count(*) FROM public.leads WHERE organization_id = p_org_id),
    'total_members', (SELECT count(*) FROM public.organization_members WHERE organization_id = p_org_id),
    'total_customers', (SELECT count(*) FROM public.customers WHERE organization_id = p_org_id),
    'total_proposals', (SELECT count(*) FROM public.proposals WHERE organization_id = p_org_id),
    'total_invoices', (SELECT count(*) FROM public.invoices WHERE organization_id = p_org_id)
  ) INTO v_totals;

  RETURN jsonb_build_object(
    'org', v_org,
    'owner', v_owner,
    'members', v_members,
    'recent_projects', v_recent_projects,
    'lead_summary', v_lead_summary,
    'totals', v_totals
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.spu_org_detail(uuid) TO authenticated;
