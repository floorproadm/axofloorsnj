
-- Detail RPC
CREATE OR REPLACE FUNCTION public.spu_user_detail(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile jsonb;
  v_auth jsonb;
  v_membership jsonb;
  v_roles text[];
  v_activity jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT to_jsonb(p) INTO v_profile FROM public.profiles p WHERE p.user_id = p_user_id;
  IF v_profile IS NULL THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  SELECT jsonb_build_object(
    'last_sign_in_at', u.last_sign_in_at,
    'email_confirmed_at', u.email_confirmed_at,
    'banned_until', u.banned_until,
    'created_at', u.created_at,
    'provider', (u.raw_app_meta_data->>'provider')
  )
  INTO v_auth
  FROM auth.users u WHERE u.id = p_user_id;

  SELECT jsonb_build_object(
    'organization_id', om.organization_id,
    'organization_name', o.name,
    'role', om.role,
    'joined_at', om.created_at
  )
  INTO v_membership
  FROM public.organization_members om
  JOIN public.organizations o ON o.id = om.organization_id
  WHERE om.user_id = p_user_id
  LIMIT 1;

  SELECT COALESCE(ARRAY(SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = p_user_id ORDER BY ur.role::text), ARRAY[]::text[])
  INTO v_roles;

  SELECT jsonb_build_object(
    'projects_assigned', (SELECT count(*) FROM public.project_members WHERE user_id = p_user_id),
    'labor_entries', (SELECT count(*) FROM public.labor_entries le WHERE le.crew_member_id IN (SELECT id FROM public.profiles WHERE user_id = p_user_id)),
    'leads_owned', (SELECT count(*) FROM public.leads WHERE owner_id = p_user_id),
    'appointments', (SELECT count(*) FROM public.appointment_assignees aa WHERE aa.profile_id IN (SELECT id FROM public.profiles WHERE user_id = p_user_id))
  ) INTO v_activity;

  RETURN jsonb_build_object(
    'profile', v_profile,
    'auth', v_auth,
    'membership', v_membership,
    'platform_roles', v_roles,
    'activity', v_activity,
    'is_self', (auth.uid() = p_user_id)
  );
END;
$$;

-- Set / assign org membership
CREATE OR REPLACE FUNCTION public.spu_user_set_org(p_user_id uuid, p_org_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF p_role NOT IN ('owner','admin','member') THEN
    RAISE EXCEPTION 'invalid role: %', p_role;
  END IF;

  DELETE FROM public.organization_members WHERE user_id = p_user_id;
  INSERT INTO public.organization_members (user_id, organization_id, role)
  VALUES (p_user_id, p_org_id, p_role);
END;
$$;

-- Remove from org
CREATE OR REPLACE FUNCTION public.spu_user_remove_org(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  DELETE FROM public.organization_members WHERE user_id = p_user_id;
END;
$$;

-- Add platform role
CREATE OR REPLACE FUNCTION public.spu_user_add_role(p_user_id uuid, p_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Remove platform role (block self-revoke of platform_admin)
CREATE OR REPLACE FUNCTION public.spu_user_remove_role(p_user_id uuid, p_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF p_role = 'platform_admin' AND p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot remove your own platform_admin role';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = p_user_id AND role = p_role;
END;
$$;
