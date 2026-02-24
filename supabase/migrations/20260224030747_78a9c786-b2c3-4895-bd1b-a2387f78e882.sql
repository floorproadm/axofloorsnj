
-- Fix: set security_invoker on the view so RLS of the querying user applies
DROP VIEW IF EXISTS public.projects_missing_progress_photos;
CREATE VIEW public.projects_missing_progress_photos
WITH (security_invoker = true)
AS
SELECT p.id AS project_id, p.customer_name
FROM public.projects p
WHERE p.project_status = 'in_production'
  AND p.requires_progress_photos = true
  AND NOT EXISTS (
    SELECT 1 FROM public.media_files m
    WHERE m.project_id = p.id
      AND m.folder_type = 'job_progress'
  );
