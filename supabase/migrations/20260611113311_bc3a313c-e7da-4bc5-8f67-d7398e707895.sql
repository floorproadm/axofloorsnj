
CREATE OR REPLACE FUNCTION public.spu_organization_create(
  p_name text,
  p_owner_email text,
  p_plan text DEFAULT 'starter',
  p_trial_days int DEFAULT 14
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_slug text;
  v_base_slug text;
  v_org_id uuid;
  v_counter int := 0;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF NOT public.has_role(v_caller, 'platform_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;
  IF p_owner_email IS NULL OR p_owner_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  IF p_plan NOT IN ('starter','pro','enterprise') THEN
    RAISE EXCEPTION 'invalid_plan';
  END IF;

  v_base_slug := regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g');
  v_base_slug := regexp_replace(v_base_slug, '(^-+|-+$)', '', 'g');
  IF v_base_slug = '' THEN v_base_slug := 'org'; END IF;
  v_slug := v_base_slug;
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_slug) LOOP
    v_counter := v_counter + 1;
    v_slug := v_base_slug || '-' || v_counter::text;
  END LOOP;

  INSERT INTO public.organizations (name, slug, plan, type, is_active, trial_ends_at, email)
  VALUES (
    trim(p_name),
    v_slug,
    p_plan::org_plan,
    'flooring_owner'::org_type,
    true,
    now() + (p_trial_days || ' days')::interval,
    lower(trim(p_owner_email))
  )
  RETURNING id INTO v_org_id;

  RETURN jsonb_build_object(
    'org_id', v_org_id,
    'slug', v_slug,
    'name', trim(p_name),
    'owner_email', lower(trim(p_owner_email)),
    'plan', p_plan
  );
END;
$$;

REVOKE ALL ON FUNCTION public.spu_organization_create(text, text, text, int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.spu_organization_create(text, text, text, int) TO authenticated, service_role;
