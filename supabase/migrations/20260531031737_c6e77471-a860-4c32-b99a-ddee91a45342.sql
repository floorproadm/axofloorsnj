-- Update proposals installer policy to include sander and sander_installer
DROP POLICY IF EXISTS proposals_installer_read ON public.proposals;
CREATE POLICY proposals_installer_read ON public.proposals
FOR SELECT TO authenticated
USING (
  organization_id = get_user_org_id()
  AND (
    has_role(auth.uid(), 'installer'::app_role)
    OR has_role(auth.uid(), 'sander'::app_role)
    OR has_role(auth.uid(), 'sander_installer'::app_role)
  )
  AND project_id IN (
    SELECT pm.project_id FROM public.project_members pm WHERE pm.user_id = auth.uid()
  )
);