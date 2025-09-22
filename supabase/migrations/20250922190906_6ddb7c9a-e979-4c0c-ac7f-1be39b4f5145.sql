-- Fix the test_quiz_submission function search path
CREATE OR REPLACE FUNCTION public.test_quiz_submission()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;