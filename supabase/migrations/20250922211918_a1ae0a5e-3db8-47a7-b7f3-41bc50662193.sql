-- Enhanced security for projects table containing sensitive customer data
-- Replace the broad "ALL" policy with specific, granular policies for better security

-- Drop the existing broad policy
DROP POLICY IF EXISTS "Admin users can manage all projects" ON public.projects;

-- Create specific policies for each operation type

-- 1. SELECT policy - Only admins can view customer data
CREATE POLICY "Admin users can view all projects" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (get_current_user_role() = 'admin');

-- 2. INSERT policy - Only admins can create projects
CREATE POLICY "Admin users can create projects" 
ON public.projects 
FOR INSERT 
TO authenticated
WITH CHECK (get_current_user_role() = 'admin');

-- 3. UPDATE policy - Only admins can modify projects
CREATE POLICY "Admin users can update projects" 
ON public.projects 
FOR UPDATE 
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- 4. DELETE policy - Only admins can delete projects
CREATE POLICY "Admin users can delete projects" 
ON public.projects 
FOR DELETE 
TO authenticated
USING (get_current_user_role() = 'admin');

-- 5. Explicit deny policy for anonymous users
CREATE POLICY "Deny anonymous access to projects" 
ON public.projects 
FOR ALL 
TO anon
USING (false);

-- Ensure RLS is enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Add function to log customer data access for compliance
CREATE OR REPLACE FUNCTION log_customer_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when customer data is accessed through INSERT/UPDATE/DELETE operations
  IF get_current_user_role() = 'admin' THEN
    PERFORM log_admin_access('projects', TG_OP, auth.uid());
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for audit logging on data modifications
CREATE TRIGGER log_project_insert
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION log_customer_data_access();

CREATE TRIGGER log_project_update
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION log_customer_data_access();

CREATE TRIGGER log_project_delete
  AFTER DELETE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION log_customer_data_access();