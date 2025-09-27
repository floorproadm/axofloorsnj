-- Fix RLS policies for quiz_responses table
-- Remove existing policies that might be blocking access
DROP POLICY IF EXISTS "Allow anonymous quiz submissions" ON public.quiz_responses;
DROP POLICY IF EXISTS "Admin view quiz responses with logging" ON public.quiz_responses;

-- Create new improved policies for quiz submissions
CREATE POLICY "Enable anonymous quiz submissions with proper validation" 
ON public.quiz_responses 
FOR INSERT 
WITH CHECK (
  -- Allow any user to submit quiz responses
  (source = 'quiz'::text) AND 
  (name IS NOT NULL AND length(trim(name)) > 0) AND 
  (email IS NOT NULL AND length(trim(email)) > 0) AND 
  (phone IS NOT NULL AND length(trim(phone)) > 0) AND
  (services IS NOT NULL)
);

-- Create policy for admin to read quiz responses
CREATE POLICY "Admin can read quiz responses" 
ON public.quiz_responses 
FOR SELECT 
USING (
  get_current_user_role() = 'admin'::text
);

-- Also fix the leads table to ensure anonymous users can submit
DROP POLICY IF EXISTS "Allow authenticated lead submissions" ON public.leads;

-- Create better policy for lead submissions
CREATE POLICY "Allow lead submissions from all sources" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  -- Allow submissions from various sources
  (lead_source = ANY (ARRAY['quiz'::text, 'contact_form'::text, 'contact_page'::text, 'builders_page'::text, 'realtors_page'::text])) AND 
  (name IS NOT NULL AND length(trim(name)) > 0) AND 
  (phone IS NOT NULL AND length(trim(phone)) > 0)
);