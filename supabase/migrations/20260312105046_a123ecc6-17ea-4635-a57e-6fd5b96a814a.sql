
-- PHASE 3: RLS helper functions

CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION supply_has_access(p_org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM supply_connections sc
    JOIN organization_members om ON om.organization_id = sc.supply_org_id
    WHERE sc.flooring_org_id = p_org_id
      AND sc.status = 'active'
      AND om.user_id = auth.uid()
  );
$$;
