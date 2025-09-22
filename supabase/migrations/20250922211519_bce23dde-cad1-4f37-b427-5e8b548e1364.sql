-- Fix security vulnerability in quiz_responses table
-- Drop the existing SELECT policy and recreate it with proper restrictions

DROP POLICY IF EXISTS "Allow admin to view quiz responses" ON public.quiz_responses;

-- Create a restrictive policy that only allows admin users to view quiz responses
CREATE POLICY "Admin users can view quiz responses" 
ON public.quiz_responses 
FOR SELECT 
TO authenticated
USING (get_current_user_role() = 'admin');

-- Also add a policy for anonymous users that explicitly denies access
-- This ensures no accidental data exposure
CREATE POLICY "Deny anonymous access to quiz responses" 
ON public.quiz_responses 
FOR SELECT 
TO anon
USING (false);

-- Verify that RLS is enabled (it should be, but let's make sure)
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Add audit logging for quiz response access
CREATE OR REPLACE FUNCTION log_quiz_access() 
RETURNS TRIGGER AS $$
BEGIN
  -- Log when admin users access quiz responses
  IF get_current_user_role() = 'admin' THEN
    PERFORM log_admin_access('quiz_responses', 'SELECT', auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;