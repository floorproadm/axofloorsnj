-- Add explicit SELECT policy for leads table to prevent unauthorized access to customer data
-- This ensures only admin users can view sensitive customer information

CREATE POLICY "Only admin users can view leads" 
ON public.leads 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- Add comment to document the security purpose
COMMENT ON POLICY "Only admin users can view leads" ON public.leads IS 
'Restricts access to sensitive customer data in leads table to admin users only. Prevents unauthorized access to names, emails, phone numbers, and addresses.';