-- Clear all existing gallery projects
DELETE FROM public.gallery_projects;

-- Reset the sequence if needed
-- No need to reset UUID sequences as they're random