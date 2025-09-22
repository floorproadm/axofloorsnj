-- Fix RLS policy for quiz submissions
-- Drop existing policy and recreate it
DROP POLICY IF EXISTS "Allow anonymous quiz submissions" ON public.quiz_responses;

-- Create a new policy that explicitly allows anonymous insertions
CREATE POLICY "Allow anonymous quiz submissions" 
ON public.quiz_responses 
FOR INSERT 
TO public
WITH CHECK (true);

-- Also make sure anon role can insert
GRANT INSERT ON public.quiz_responses TO anon;