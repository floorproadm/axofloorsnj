-- 1. DATA MIGRATION
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT om.user_id,
  CASE om.role::text
    WHEN 'owner' THEN 'admin'::public.app_role
    WHEN 'admin' THEN 'admin'::public.app_role
    WHEN 'collaborator' THEN 'installer'::public.app_role
  END
FROM public.organization_members om
WHERE om.user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. OWNER COLUMN
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);

ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_owner_id ON public.proposals(owner_id);

-- 3. LEADS
DROP POLICY IF EXISTS leads_tenant_all ON public.leads;

CREATE POLICY leads_admin_manager_all ON public.leads
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id()
         AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (organization_id = public.get_user_org_id()
              AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));

CREATE POLICY leads_salesperson_own ON public.leads
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id()
         AND public.has_role(auth.uid(),'salesperson')
         AND owner_id = auth.uid())
  WITH CHECK (organization_id = public.get_user_org_id()
              AND public.has_role(auth.uid(),'salesperson')
              AND owner_id = auth.uid());

-- 4. PROPOSALS
DROP POLICY IF EXISTS proposals_tenant_all ON public.proposals;

CREATE POLICY proposals_sales_all ON public.proposals
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id()
         AND (public.has_role(auth.uid(),'admin')
              OR public.has_role(auth.uid(),'manager')
              OR public.has_role(auth.uid(),'salesperson')))
  WITH CHECK (organization_id = public.get_user_org_id()
              AND (public.has_role(auth.uid(),'admin')
                   OR public.has_role(auth.uid(),'manager')
                   OR public.has_role(auth.uid(),'salesperson')));

CREATE POLICY proposals_installer_read ON public.proposals
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id()
         AND public.has_role(auth.uid(),'installer')
         AND project_id IN (SELECT pm.project_id FROM public.project_members pm WHERE pm.user_id = auth.uid()));

CREATE POLICY proposals_accountant_read ON public.proposals
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id()
         AND public.has_role(auth.uid(),'accountant'));

-- 5. INVOICES
DROP POLICY IF EXISTS invoices_tenant_all ON public.invoices;

CREATE POLICY invoices_finance_all ON public.invoices
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id()
         AND (public.has_role(auth.uid(),'admin')
              OR public.has_role(auth.uid(),'manager')
              OR public.has_role(auth.uid(),'accountant')))
  WITH CHECK (organization_id = public.get_user_org_id()
              AND (public.has_role(auth.uid(),'admin')
                   OR public.has_role(auth.uid(),'manager')
                   OR public.has_role(auth.uid(),'accountant')));

CREATE POLICY invoices_salesperson_read ON public.invoices
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id()
         AND public.has_role(auth.uid(),'salesperson'));

-- 6. PAYMENTS
DROP POLICY IF EXISTS payments_tenant_all ON public.payments;

CREATE POLICY payments_finance_all ON public.payments
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id()
         AND (public.has_role(auth.uid(),'admin')
              OR public.has_role(auth.uid(),'manager')
              OR public.has_role(auth.uid(),'accountant')))
  WITH CHECK (organization_id = public.get_user_org_id()
              AND (public.has_role(auth.uid(),'admin')
                   OR public.has_role(auth.uid(),'manager')
                   OR public.has_role(auth.uid(),'accountant')));

CREATE POLICY payments_salesperson_read ON public.payments
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id()
         AND public.has_role(auth.uid(),'salesperson'));

-- 7. LABOR_ENTRIES
DROP POLICY IF EXISTS labor_entries_tenant_all ON public.labor_entries;

CREATE POLICY labor_entries_admin_manager_all ON public.labor_entries
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id()
         AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (organization_id = public.get_user_org_id()
              AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));

CREATE POLICY labor_entries_accountant_read ON public.labor_entries
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id()
         AND public.has_role(auth.uid(),'accountant'));

-- 8. PROJECTS
DROP POLICY IF EXISTS projects_tenant_all ON public.projects;

CREATE POLICY projects_admin_manager_all ON public.projects
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id()
         AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')))
  WITH CHECK (organization_id = public.get_user_org_id()
              AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));

CREATE POLICY projects_sales_finance_read ON public.projects
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id()
         AND (public.has_role(auth.uid(),'salesperson') OR public.has_role(auth.uid(),'accountant')));

-- 9. JOB_COSTS (no organization_id column → scope via projects)
DROP POLICY IF EXISTS job_costs_tenant_all ON public.job_costs;

CREATE POLICY job_costs_finance_all ON public.job_costs
  FOR ALL TO authenticated
  USING (
    project_id IN (SELECT id FROM public.projects WHERE organization_id = public.get_user_org_id())
    AND (public.has_role(auth.uid(),'admin')
         OR public.has_role(auth.uid(),'manager')
         OR public.has_role(auth.uid(),'accountant'))
  )
  WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE organization_id = public.get_user_org_id())
    AND (public.has_role(auth.uid(),'admin')
         OR public.has_role(auth.uid(),'manager')
         OR public.has_role(auth.uid(),'accountant'))
  );

CREATE POLICY job_costs_salesperson_read ON public.job_costs
  FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT id FROM public.projects WHERE organization_id = public.get_user_org_id())
    AND public.has_role(auth.uid(),'salesperson')
  );

-- 10. COMPANY_SETTINGS — add manager
DROP POLICY IF EXISTS "Admins can insert company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Admins can update company settings" ON public.company_settings;

CREATE POLICY company_settings_admin_manager_insert ON public.company_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY company_settings_admin_manager_update ON public.company_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- 11. SERVICE_CATALOG — add manager
DROP POLICY IF EXISTS service_catalog_admin_all ON public.service_catalog;

CREATE POLICY service_catalog_admin_manager_all ON public.service_catalog
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));