
-- =============================================
-- FIX RLS: appointments — admin-only write
-- =============================================

-- Drop overly permissive write policies
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can delete appointments" ON public.appointments;

-- Create admin-only write policies
CREATE POLICY "appointments_admin_insert"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "appointments_admin_update"
ON public.appointments
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "appointments_admin_delete"
ON public.appointments
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- FIX RLS: gallery_folders — admin-only write
-- =============================================

-- Drop overly permissive ALL policy
DROP POLICY IF EXISTS "Authenticated users can manage gallery folders" ON public.gallery_folders;

-- Create admin-only write policies
CREATE POLICY "gallery_folders_admin_insert"
ON public.gallery_folders
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "gallery_folders_admin_update"
ON public.gallery_folders
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "gallery_folders_admin_delete"
ON public.gallery_folders
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- FIX RLS: gallery_projects — admin-only write
-- =============================================

-- Drop overly permissive ALL policy
DROP POLICY IF EXISTS "Authenticated users can manage gallery projects" ON public.gallery_projects;

-- Create admin-only write policies
CREATE POLICY "gallery_projects_admin_insert"
ON public.gallery_projects
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "gallery_projects_admin_update"
ON public.gallery_projects
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "gallery_projects_admin_delete"
ON public.gallery_projects
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
