
-- PHASE 4: Drop ALL existing RLS policies and create tenant-scoped ones

-- ── LEADS ──
DROP POLICY IF EXISTS "leads_admin_all" ON leads;
DROP POLICY IF EXISTS "leads_authenticated_read" ON leads;
DROP POLICY IF EXISTS "leads_public_insert" ON leads;
DROP POLICY IF EXISTS "leads_admin_crud" ON leads;
DROP POLICY IF EXISTS "leads_tenant_all" ON leads;

CREATE POLICY "leads_tenant_all" ON leads
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- Keep public insert for website lead capture
CREATE POLICY "leads_public_insert" ON leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ── CUSTOMERS ──
DROP POLICY IF EXISTS "customers_admin_all" ON customers;
DROP POLICY IF EXISTS "customers_admin_crud" ON customers;
DROP POLICY IF EXISTS "customers_tenant_all" ON customers;

CREATE POLICY "customers_tenant_all" ON customers
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ── PROJECTS ──
DROP POLICY IF EXISTS "projects_admin_all" ON projects;
DROP POLICY IF EXISTS "projects_authenticated_read" ON projects;
DROP POLICY IF EXISTS "projects_collaborator_read" ON projects;
DROP POLICY IF EXISTS "projects_tenant_all" ON projects;
DROP POLICY IF EXISTS "projects_supply_read" ON projects;

CREATE POLICY "projects_tenant_all" ON projects
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "projects_collaborator_read" ON projects
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = projects.id AND pm.user_id = auth.uid()));

CREATE POLICY "projects_supply_read" ON projects
  FOR SELECT TO authenticated
  USING (supply_has_access(organization_id));

-- ── PROPOSALS ──
DROP POLICY IF EXISTS "proposals_admin_delete" ON proposals;
DROP POLICY IF EXISTS "proposals_admin_insert" ON proposals;
DROP POLICY IF EXISTS "proposals_admin_update" ON proposals;
DROP POLICY IF EXISTS "proposals_authenticated_read" ON proposals;
DROP POLICY IF EXISTS "proposals_tenant_all" ON proposals;

CREATE POLICY "proposals_tenant_all" ON proposals
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ── INVOICES ──
DROP POLICY IF EXISTS "invoices_admin_all" ON invoices;
DROP POLICY IF EXISTS "invoices_authenticated_read" ON invoices;
DROP POLICY IF EXISTS "invoices_tenant_all" ON invoices;

CREATE POLICY "invoices_tenant_all" ON invoices
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ── INVOICE ITEMS ──
DROP POLICY IF EXISTS "invoice_items_admin_all" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_authenticated_read" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_tenant_all" ON invoice_items;

CREATE POLICY "invoice_items_tenant_all" ON invoice_items
  FOR ALL TO authenticated
  USING (invoice_id IN (SELECT id FROM invoices WHERE organization_id = get_user_org_id()));

-- ── PAYMENTS ──
DROP POLICY IF EXISTS "payments_admin_all" ON payments;
DROP POLICY IF EXISTS "payments_authenticated_read" ON payments;
DROP POLICY IF EXISTS "payments_tenant_all" ON payments;

CREATE POLICY "payments_tenant_all" ON payments
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ── APPOINTMENTS ──
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON appointments;
DROP POLICY IF EXISTS "appointments_admin_delete" ON appointments;
DROP POLICY IF EXISTS "appointments_admin_insert" ON appointments;
DROP POLICY IF EXISTS "appointments_admin_update" ON appointments;
DROP POLICY IF EXISTS "appointments_tenant_all" ON appointments;
DROP POLICY IF EXISTS "appointments_public_insert" ON appointments;

CREATE POLICY "appointments_tenant_all" ON appointments
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ── JOB COSTS ──
DROP POLICY IF EXISTS "job_costs_admin_all" ON job_costs;
DROP POLICY IF EXISTS "job_costs_authenticated_read" ON job_costs;
DROP POLICY IF EXISTS "job_costs_tenant_all" ON job_costs;

CREATE POLICY "job_costs_tenant_all" ON job_costs
  FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE organization_id = get_user_org_id()));

-- ── GALLERY FOLDERS ──
DROP POLICY IF EXISTS "Gallery folders are public" ON gallery_folders;
DROP POLICY IF EXISTS "gallery_folders_admin_delete" ON gallery_folders;
DROP POLICY IF EXISTS "gallery_folders_admin_insert" ON gallery_folders;
DROP POLICY IF EXISTS "gallery_folders_admin_update" ON gallery_folders;
DROP POLICY IF EXISTS "gallery_folders_public_read" ON gallery_folders;
DROP POLICY IF EXISTS "gallery_folders_tenant_write" ON gallery_folders;

CREATE POLICY "gallery_folders_public_read" ON gallery_folders
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "gallery_folders_tenant_insert" ON gallery_folders
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "gallery_folders_tenant_update" ON gallery_folders
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "gallery_folders_tenant_delete" ON gallery_folders
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id());

-- ── GALLERY PROJECTS ──
DROP POLICY IF EXISTS "Gallery projects are public" ON gallery_projects;
DROP POLICY IF EXISTS "gallery_projects_admin_delete" ON gallery_projects;
DROP POLICY IF EXISTS "gallery_projects_admin_insert" ON gallery_projects;
DROP POLICY IF EXISTS "gallery_projects_admin_update" ON gallery_projects;
DROP POLICY IF EXISTS "gallery_projects_public_read" ON gallery_projects;
DROP POLICY IF EXISTS "gallery_projects_tenant_write" ON gallery_projects;

CREATE POLICY "gallery_projects_public_read" ON gallery_projects
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "gallery_projects_tenant_insert" ON gallery_projects
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "gallery_projects_tenant_update" ON gallery_projects
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id());

CREATE POLICY "gallery_projects_tenant_delete" ON gallery_projects
  FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id());

-- ── ORGANIZATIONS ──
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orgs_read_own" ON organizations;
DROP POLICY IF EXISTS "orgs_update_owner" ON organizations;

CREATE POLICY "orgs_read_own" ON organizations
  FOR SELECT TO authenticated
  USING (id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "orgs_update_owner" ON organizations
  FOR UPDATE TO authenticated
  USING (id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'owner'));

-- ── ORGANIZATION_MEMBERS ──
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_members_read_own_or_org" ON organization_members;
DROP POLICY IF EXISTS "org_members_manage" ON organization_members;

CREATE POLICY "org_members_read_own_or_org" ON organization_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR organization_id = get_user_org_id());

CREATE POLICY "org_members_manage" ON organization_members
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "org_members_manage_update" ON organization_members
  FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "org_members_manage_delete" ON organization_members
  FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- ── SUPPLY_CONNECTIONS ──
ALTER TABLE supply_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "supply_conn_read_involved" ON supply_connections;
DROP POLICY IF EXISTS "supply_conn_manage" ON supply_connections;

CREATE POLICY "supply_conn_read_involved" ON supply_connections
  FOR SELECT TO authenticated
  USING (supply_org_id = get_user_org_id() OR flooring_org_id = get_user_org_id());

CREATE POLICY "supply_conn_manage" ON supply_connections
  FOR INSERT TO authenticated
  WITH CHECK (supply_org_id = get_user_org_id());

CREATE POLICY "supply_conn_manage_update" ON supply_connections
  FOR UPDATE TO authenticated
  USING (supply_org_id = get_user_org_id());
