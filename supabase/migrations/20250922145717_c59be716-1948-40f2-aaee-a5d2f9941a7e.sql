-- Fix gallery_projects security vulnerability by removing policies that allow any authenticated user to modify content

-- Drop the problematic policies that allow any authenticated user to modify gallery content
DROP POLICY IF EXISTS "Users can delete gallery projects" ON public.gallery_projects;
DROP POLICY IF EXISTS "Users can insert gallery projects" ON public.gallery_projects;
DROP POLICY IF EXISTS "Users can update gallery projects" ON public.gallery_projects;

-- The remaining policies will be:
-- 1. "Admin users can manage all gallery projects" (FOR ALL) - allows admin INSERT/UPDATE/DELETE
-- 2. "Gallery projects are viewable by everyone" (FOR SELECT) - allows public viewing

-- Verify the remaining policies are secure by listing them
-- (This is just for verification, the actual policies are already in place)