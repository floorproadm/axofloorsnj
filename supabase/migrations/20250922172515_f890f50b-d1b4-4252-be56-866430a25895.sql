-- Add admin policy to allow administrators to view all user profiles
-- This maintains security while enabling administrative functionality
CREATE POLICY "Admin users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- Add admin policy to allow administrators to update any profile if needed  
CREATE POLICY "Admin users can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (get_current_user_role() = 'admin');