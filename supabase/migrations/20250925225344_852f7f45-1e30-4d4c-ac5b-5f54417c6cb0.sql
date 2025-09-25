-- Add SELECT policy to protect customer contact information in appointments table
-- This ensures only admin users can view sensitive customer data like names and phone numbers

CREATE POLICY "Admin users can view all appointments" 
ON public.appointments 
FOR SELECT 
USING (get_current_user_role() = 'admin');