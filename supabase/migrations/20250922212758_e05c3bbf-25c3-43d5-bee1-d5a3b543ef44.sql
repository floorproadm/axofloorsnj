-- Fix conflicting RLS policies on leads table
-- The issue is that we have an "ALL" policy that conflicts with the specific INSERT policy

-- Drop the conflicting "ALL" policy that's blocking public submissions
DROP POLICY IF EXISTS "Admin users can manage all leads" ON public.leads;

-- Keep the specific policies that work correctly
-- The "Allow public lead submissions" INSERT policy should work fine now
-- The "Only admin users can view leads" SELECT policy is correct
-- The "Admin users can delete leads" DELETE policy is correct

-- Add missing UPDATE policy for admins
CREATE POLICY "Admin users can update leads" 
ON public.leads 
FOR UPDATE 
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Ensure RLS is enabled
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;