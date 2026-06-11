
-- 1. Add onboarded_at to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz DEFAULT NULL;

-- 2. Add services_offered + team_size to company_settings
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS services_offered text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS team_size text DEFAULT NULL;

-- 3. RPC create_organization_with_owner
CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
  p_name text,
  p_phone text,
  p_email text,
  p_state text DEFAULT 'NJ',
  p_city text DEFAULT NULL,
  p_services_offered text[] DEFAULT NULL,
  p_team_size text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_org_id uuid;
  v_base_slug text;
  v_slug text;
  v_n int := 1;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'name_required';
  END IF;

  -- Guard: user must not already belong to an org
  IF EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'already_in_org';
  END IF;

  -- Build unique slug
  v_base_slug := regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g');
  v_base_slug := regexp_replace(v_base_slug, '(^-+|-+$)', '', 'g');
  IF v_base_slug = '' THEN v_base_slug := 'org'; END IF;
  v_slug := v_base_slug;
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_slug) LOOP
    v_n := v_n + 1;
    v_slug := v_base_slug || '-' || v_n;
  END LOOP;

  -- 1. Organization
  INSERT INTO public.organizations (name, slug, plan, state, is_active, trial_ends_at, phone, email, city)
  VALUES (trim(p_name), v_slug, 'starter', COALESCE(p_state,'NJ'), true, now() + interval '30 days', p_phone, p_email, p_city)
  RETURNING id INTO v_org_id;

  -- 2. Org membership (owner)
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, v_uid, 'owner');

  -- 3. App role (admin) — user_roles has organization_id col? Insert defensively
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_uid, 'admin'::app_role)
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- 4. Company settings
  INSERT INTO public.company_settings (
    organization_id, company_name, phone, email,
    default_margin_min_percent, services_offered, team_size, singleton_key
  )
  VALUES (
    v_org_id, trim(p_name), p_phone, p_email,
    20, p_services_offered, p_team_size, false
  );

  RETURN v_org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_organization_with_owner(text, text, text, text, text, text[], text) TO authenticated;
