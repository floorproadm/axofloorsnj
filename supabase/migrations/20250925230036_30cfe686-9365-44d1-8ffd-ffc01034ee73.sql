-- Fix the leads table RLS policy for quiz submissions
-- The current INSERT policy may be too restrictive

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Allow public lead submissions" ON public.leads;

-- Create a more explicit INSERT policy that allows anonymous quiz submissions
CREATE POLICY "Allow quiz submissions from public" 
ON public.leads 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  lead_source IN ('quiz', 'contact_form', 'contact_page', 'builders_page', 'realtors_page')
  AND name IS NOT NULL 
  AND phone IS NOT NULL
  AND (email IS NOT NULL OR email IS NULL)  -- email can be optional
);