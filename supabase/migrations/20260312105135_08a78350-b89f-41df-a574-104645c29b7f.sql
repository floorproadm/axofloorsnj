
-- PHASE 5: Migrate existing users from user_roles into organization_members + trigger

INSERT INTO organization_members (user_id, organization_id, role)
SELECT
  ur.user_id,
  'a0000000-0000-0000-0000-000000000001',
  CASE ur.role
    WHEN 'admin' THEN 'owner'::org_member_role
    ELSE 'collaborator'::org_member_role
  END
FROM user_roles ur
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Trigger updated_at for organizations
DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
