-- Create security definer function to check current user role
-- This prevents potential RLS recursion issues and strengthens security
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing SELECT policy and recreate with security definer function
DROP POLICY IF EXISTS "Admin users can view all quiz responses" ON public.quiz_responses;

-- Create new restrictive SELECT policy using security definer function
CREATE POLICY "Only admin users can view quiz responses" 
ON public.quiz_responses 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

-- Ensure no other permissive SELECT policies exist by being explicit
-- Add a restrictive default policy that denies all non-admin access
CREATE POLICY "Deny non-admin SELECT access to quiz responses" 
ON public.quiz_responses 
FOR SELECT 
USING (false);

-- Make the admin policy take precedence by dropping and recreating it last
DROP POLICY "Deny non-admin SELECT access to quiz responses" ON public.quiz_responses;
DROP POLICY "Only admin users can view quiz responses" ON public.quiz_responses;

-- Create the final secure policy
CREATE POLICY "Admin only SELECT access to quiz responses" 
ON public.quiz_responses 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');