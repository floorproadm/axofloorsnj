CREATE POLICY "Assigned collaborators can view checklist"
ON public.project_checklists FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_checklists.project_id AND pm.user_id = auth.uid()));

CREATE POLICY "Assigned collaborators can update checklist"
ON public.project_checklists FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_checklists.project_id AND pm.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_checklists.project_id AND pm.user_id = auth.uid()));

CREATE POLICY "Assigned collaborators can insert checklist"
ON public.project_checklists FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_checklists.project_id AND pm.user_id = auth.uid()));