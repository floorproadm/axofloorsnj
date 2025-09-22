-- Fix quiz_responses policies properly
-- First check existing policies
SELECT policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'quiz_responses';

-- Recreate RLS policies to ensure anonymous quiz submissions work
DROP POLICY IF EXISTS "Enable anonymous quiz submissions" ON public.quiz_responses;
DROP POLICY IF EXISTS "Enable admin read access to quiz responses" ON public.quiz_responses;

-- Create simple and effective policies
CREATE POLICY "Allow public quiz submissions" 
ON public.quiz_responses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow admin to view quiz responses" 
ON public.quiz_responses 
FOR SELECT 
USING (get_current_user_role() = 'admin');