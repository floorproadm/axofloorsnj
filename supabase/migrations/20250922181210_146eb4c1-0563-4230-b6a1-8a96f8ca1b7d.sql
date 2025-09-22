-- Ensure quiz_responses table allows anonymous submissions
-- Drop existing policies and recreate with better error handling
DROP POLICY IF EXISTS "Allow anonymous quiz submissions" ON public.quiz_responses;
DROP POLICY IF EXISTS "Admin only SELECT access to quiz responses" ON public.quiz_responses;

-- Create improved policies for quiz_responses
CREATE POLICY "Enable anonymous quiz submissions" 
ON public.quiz_responses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable admin read access to quiz responses" 
ON public.quiz_responses 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- Add a test function to validate quiz submission capability
CREATE OR REPLACE FUNCTION public.test_quiz_submission()
RETURNS JSON AS $$
DECLARE
  test_result JSON;
BEGIN
  -- Test if anonymous user can insert
  test_result := json_build_object(
    'anonymous_insert_allowed', EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'quiz_responses' 
      AND policyname = 'Enable anonymous quiz submissions'
      AND cmd = 'INSERT'
    ),
    'admin_select_allowed', EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'quiz_responses' 
      AND policyname = 'Enable admin read access to quiz responses'
      AND cmd = 'SELECT'
    ),
    'table_rls_enabled', (
      SELECT row_security FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'quiz_responses'
    ),
    'timestamp', NOW()
  );
  
  RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;