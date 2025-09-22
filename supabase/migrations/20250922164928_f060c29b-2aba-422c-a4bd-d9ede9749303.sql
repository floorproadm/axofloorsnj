-- Fix RLS policy for quiz_responses to allow anonymous submissions
-- First drop the existing policy
DROP POLICY IF EXISTS "Anyone can submit quiz responses" ON public.quiz_responses;

-- Create a new policy that explicitly allows anonymous users to insert
CREATE POLICY "Allow anonymous quiz submissions" 
ON public.quiz_responses 
FOR INSERT 
WITH CHECK (true);

-- Ensure the admin-only SELECT policy is still in place
DROP POLICY IF EXISTS "Admin only SELECT access to quiz responses" ON public.quiz_responses;

CREATE POLICY "Admin only SELECT access to quiz responses" 
ON public.quiz_responses 
FOR SELECT 
USING (get_current_user_role() = 'admin'::text);