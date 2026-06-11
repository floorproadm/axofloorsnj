
CREATE OR REPLACE FUNCTION public.spu_organizations_list()
RETURNS TABLE(org_id uuid, name text, slug text, plan text, is_active boolean, trial_ends_at timestamp with time zone, onboarded_at timestamp with time zone, created_at timestamp with time zone, owner_email text, owner_name text, project_count bigint, lead_count bigint, user_count bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    o.id AS org_id,
    o.name,
    o.slug,
    o.plan::text,
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
$function$;
