
CREATE OR REPLACE FUNCTION public.spu_orphan_users()
RETURNS TABLE(user_id uuid, email text, full_name text, phone text, created_at timestamptz, roles text[])
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
    COALESCE(ARRAY(SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = p.user_id), ARRAY[]::text[]) AS roles
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_members om WHERE om.user_id = p.user_id
  )
  ORDER BY p.created_at DESC;
END;
$$;
