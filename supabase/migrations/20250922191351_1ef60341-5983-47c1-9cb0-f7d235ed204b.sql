-- Add DELETE policy for admin users on leads table
CREATE POLICY "Admin users can delete leads" 
ON public.leads 
FOR DELETE 
USING (get_current_user_role() = 'admin');