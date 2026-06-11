
-- RPC 1: Platform Overview
CREATE OR REPLACE FUNCTION public.spu_platform_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT jsonb_build_object(
    'total_orgs', (SELECT count(*) FROM public.organizations),
    'active_orgs', (SELECT count(*) FROM public.organizations WHERE is_active = true),
    'trial_orgs', (SELECT count(*) FROM public.organizations WHERE trial_ends_at IS NOT NULL AND trial_ends_at > now()),
    'starter_orgs', (SELECT count(*) FROM public.organizations WHERE plan = 'starter'),
    'pro_orgs', (SELECT count(*) FROM public.organizations WHERE plan = 'pro'),
    'enterprise_orgs', (SELECT count(*) FROM public.organizations WHERE plan = 'enterprise'),
    'total_users', (SELECT count(*) FROM public.profiles),
    'total_projects', (SELECT count(*) FROM public.projects),
    'total_leads', (SELECT count(*) FROM public.leads),
    'waitlist_leads', (SELECT count(*) FROM public.leads WHERE lead_source = 'floorpro_waitlist'),
    'new_orgs_30d', (SELECT count(*) FROM public.organizations WHERE created_at > now() - interval '30 days'),
    'new_orgs_7d', (SELECT count(*) FROM public.organizations WHERE created_at > now() - interval '7 days')
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- RPC 2: Organizations List
CREATE OR REPLACE FUNCTION public.spu_organizations_list()
RETURNS TABLE (
  org_id uuid,
  name text,
  slug text,
  plan text,
  is_active boolean,
  trial_ends_at timestamptz,
  onboarded_at timestamptz,
  created_at timestamptz,
  owner_email text,
  owner_name text,
  project_count bigint,
  lead_count bigint,
  user_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    o.id AS org_id,
    o.name,
    o.slug,
    o.plan,
    o.is_active,
    o.trial_ends_at,
    o.onboarded_at,
    o.created_at,
    (SELECT p.email FROM public.organization_members om
       JOIN public.profiles p ON p.user_id = om.user_id
       WHERE om.organization_id = o.id AND om.role = 'owner'
       ORDER BY om.user_id LIMIT 1) AS owner_email,
    (SELECT p.full_name FROM public.organization_members om
       JOIN public.profiles p ON p.user_id = om.user_id
       WHERE om.organization_id = o.id AND om.role = 'owner'
       ORDER BY om.user_id LIMIT 1) AS owner_name,
    (SELECT count(*) FROM public.projects pr WHERE pr.organization_id = o.id) AS project_count,
    (SELECT count(*) FROM public.leads l WHERE l.organization_id = o.id) AS lead_count,
    (SELECT count(*) FROM public.organization_members om WHERE om.organization_id = o.id) AS user_count
  FROM public.organizations o
  ORDER BY o.created_at DESC;
END;
$$;

-- RPC 3: Waitlist List
CREATE OR REPLACE FUNCTION public.spu_waitlist_list()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  phone text,
  city text,
  notes text,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN QUERY
  SELECT l.id, l.name, l.email, l.phone, l.city, l.notes, l.status, l.created_at
  FROM public.leads l
  WHERE l.lead_source = 'floorpro_waitlist'
  ORDER BY l.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.spu_platform_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.spu_organizations_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.spu_waitlist_list() TO authenticated;
