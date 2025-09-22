-- Create the admin user in Supabase auth
-- This will be done manually, but first let's ensure the RLS policies work correctly

-- Check current RLS policies on gallery_projects
-- The issue is that the hardcoded admin auth bypasses Supabase, so auth.uid() returns NULL

-- Let's create a specific admin user ID and update the RLS policy to allow this specific user
-- Or create a proper admin role policy

-- First, let's add an admin role column to profiles table for proper role-based access
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Create an admin-specific policy for gallery_projects
CREATE POLICY "Admin users can manage all gallery projects" 
ON public.gallery_projects 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Update the existing policies to be more permissive for admins
DROP POLICY IF EXISTS "Authenticated users can insert gallery projects" ON public.gallery_projects;
DROP POLICY IF EXISTS "Authenticated users can update gallery projects" ON public.gallery_projects;  
DROP POLICY IF EXISTS "Authenticated users can delete gallery projects" ON public.gallery_projects;

-- Recreate policies with admin override
CREATE POLICY "Users can insert gallery projects" 
ON public.gallery_projects 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    ) OR auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Users can update gallery projects" 
ON public.gallery_projects 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    ) OR auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Users can delete gallery projects" 
ON public.gallery_projects 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    ) OR auth.uid() IS NOT NULL
  )
);