
CREATE OR REPLACE FUNCTION public.spu_users_list()
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  phone text,
  created_at timestamptz,
  organization_id uuid,
  organization_name text,
  org_role text,
  roles text[]
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.email,
    p.full_name,
    p.phone,
    p.created_at,
    om.organization_id,
    o.name AS organization_name,
    om.role::text AS org_role,
    COALESCE(ARRAY(SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = p.user_id), ARRAY[]::text[]) AS roles
  FROM public.profiles p
  LEFT JOIN public.organization_members om ON om.user_id = p.user_id
  LEFT JOIN public.organizations o ON o.id = om.organization_id
  ORDER BY p.created_at DESC;
END;
$$;
