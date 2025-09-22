-- Update RLS policies for gallery_projects table to allow public access
-- Since this is an admin interface without authentication, we need to allow public operations

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only authenticated users can insert gallery projects" ON gallery_projects;
DROP POLICY IF EXISTS "Only authenticated users can update gallery projects" ON gallery_projects;
DROP POLICY IF EXISTS "Only authenticated users can delete gallery projects" ON gallery_projects;

-- Create new public policies for gallery management
CREATE POLICY "Anyone can insert gallery projects" 
ON gallery_projects 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update gallery projects" 
ON gallery_projects 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete gallery projects" 
ON gallery_projects 
FOR DELETE 
USING (true);