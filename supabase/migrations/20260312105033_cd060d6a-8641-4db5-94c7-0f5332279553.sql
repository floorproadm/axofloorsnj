
-- PHASE 2: Add organization_id to all core tables, backfill, enforce NOT NULL

ALTER TABLE leads ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
UPDATE leads SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
UPDATE customers SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
UPDATE projects SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
UPDATE appointments SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
UPDATE proposals SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
UPDATE invoices SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
UPDATE payments SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

ALTER TABLE gallery_folders ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
UPDATE gallery_folders SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

ALTER TABLE gallery_projects ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
UPDATE gallery_projects SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
UPDATE quiz_responses SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
UPDATE company_settings SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
UPDATE audit_log SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- Enforce NOT NULL on core tables (quiz_responses and audit_log stay nullable for anon inserts)
ALTER TABLE leads          ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE customers      ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE projects       ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE proposals      ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE invoices       ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE payments       ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE appointments   ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE gallery_folders   ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE gallery_projects  ALTER COLUMN organization_id SET NOT NULL;
