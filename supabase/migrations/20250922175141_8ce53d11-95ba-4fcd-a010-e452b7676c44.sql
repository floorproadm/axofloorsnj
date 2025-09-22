-- Phase 4: Security Review and Cleanup - RLS Policy Optimization

-- Fix potential recursion issue in gallery_projects admin policy
-- Replace direct subquery with security definer function

-- Drop the existing policy that could cause recursion
DROP POLICY IF EXISTS "Admin users can manage all gallery projects" ON public.gallery_projects;

-- Create new optimized policy using security definer function
CREATE POLICY "Admin users can manage all gallery projects" 
ON public.gallery_projects 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Ensure all policies are optimized and secure
-- Review comment: All policies now use security definer functions to prevent RLS recursion

-- Add helpful policy descriptions for documentation
COMMENT ON POLICY "Admin users can manage all gallery projects" ON public.gallery_projects 
IS 'Allows admin users to perform all operations (SELECT, INSERT, UPDATE, DELETE) on gallery projects using security definer function to prevent RLS recursion';

COMMENT ON POLICY "Gallery projects are viewable by everyone" ON public.gallery_projects 
IS 'Allows public read access to all gallery projects for website display';

COMMENT ON POLICY "Admin users can view all profiles" ON public.profiles 
IS 'Allows admin users to view all user profiles using security definer function';

COMMENT ON POLICY "Admin users can update all profiles" ON public.profiles 
IS 'Allows admin users to update any user profile using security definer function';

COMMENT ON POLICY "Admin only SELECT access to quiz responses" ON public.quiz_responses 
IS 'Restricts quiz response viewing to admin users only using security definer function';

COMMENT ON POLICY "Allow anonymous quiz submissions" ON public.quiz_responses 
IS 'Allows anonymous users to submit quiz responses for lead generation';