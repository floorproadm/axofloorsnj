CREATE OR REPLACE FUNCTION public.get_org_plan(p_org_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT plan::text FROM public.organizations WHERE id = p_org_id
$$;

GRANT EXECUTE ON FUNCTION public.get_org_plan(uuid) TO anon, authenticated;