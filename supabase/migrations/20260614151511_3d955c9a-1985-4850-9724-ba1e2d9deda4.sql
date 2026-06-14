-- 1) Tenant-isolate service_catalog
ALTER TABLE public.service_catalog
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.service_catalog
SET organization_id = 'a0000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE public.service_catalog
  ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_service_catalog_org
  ON public.service_catalog(organization_id);

DROP POLICY IF EXISTS service_catalog_authenticated_read ON public.service_catalog;
DROP POLICY IF EXISTS service_catalog_admin_manager_all   ON public.service_catalog;

CREATE POLICY service_catalog_tenant_read
  ON public.service_catalog
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY service_catalog_tenant_write
  ON public.service_catalog
  FOR ALL TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
  );

-- 2) Extend create_organization_with_owner to seed a default service catalog for new tenants
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

  IF EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = v_uid) THEN
    RAISE EXCEPTION 'already_in_org';
  END IF;

  v_base_slug := regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g');
  v_base_slug := regexp_replace(v_base_slug, '(^-+|-+$)', '', 'g');
  IF v_base_slug = '' THEN v_base_slug := 'org'; END IF;
  v_slug := v_base_slug;
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_slug) LOOP
    v_n := v_n + 1;
    v_slug := v_base_slug || '-' || v_n;
  END LOOP;

  INSERT INTO public.organizations (name, slug, plan, state, is_active, trial_ends_at, phone, email, city)
  VALUES (trim(p_name), v_slug, 'starter', COALESCE(p_state,'NJ'), true, now() + interval '30 days', p_phone, p_email, p_city)
  RETURNING id INTO v_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, v_uid, 'owner');

  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_uid, 'admin'::app_role)
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  INSERT INTO public.company_settings (
    organization_id, company_name, phone, email,
    default_margin_min_percent, services_offered, team_size, singleton_key
  )
  VALUES (
    v_org_id, trim(p_name), p_phone, p_email,
    20, p_services_offered, p_team_size, false
  );

  -- Seed default service catalog (placeholder prices, tenant edits later)
  INSERT INTO public.service_catalog
    (organization_id, item_type, name, category, price_unit, base_price, is_active, display_order)
  VALUES
    (v_org_id, 'service', 'Hardwood Installation',    'Installation', 'sqft',      6.00,  true, 1),
    (v_org_id, 'service', 'Hardwood Refinishing',     'Refinishing',  'sqft',      3.50,  true, 2),
    (v_org_id, 'service', 'Vinyl / LVP Installation', 'Installation', 'sqft',      4.50,  true, 3),
    (v_org_id, 'service', 'Stair Refinishing',        'Stairs',       'step',     75.00,  true, 4),
    (v_org_id, 'service', 'Stair Installation',       'Stairs',       'step',    125.00,  true, 5),
    (v_org_id, 'service', 'Baseboard Installation',   'Trim',         'linear_ft', 4.00,  true, 6),
    (v_org_id, 'service', 'Floor Repair (per board)', 'Repair',       'unit',     45.00,  true, 7),
    (v_org_id, 'service', 'Furniture Moving',         'Add-ons',      'unit',    150.00,  true, 8);

  RETURN v_org_id;
END;
$$;