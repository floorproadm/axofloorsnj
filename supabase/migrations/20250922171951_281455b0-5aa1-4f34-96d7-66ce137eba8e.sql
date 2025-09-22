-- Re-enable RLS on quiz_responses table to protect customer data
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Ensure anon role has INSERT permission (this was likely the missing piece)
GRANT INSERT ON public.quiz_responses TO anon;

-- Verify existing policies are still in place:
-- 1. Admin only SELECT access to quiz responses (already exists)
-- 2. Allow anonymous quiz submissions (already exists)

-- Additional security: Ensure anon role cannot SELECT data
REVOKE SELECT ON public.quiz_responses FROM anon;