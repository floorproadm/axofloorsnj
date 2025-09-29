-- Fix RLS policy to allow lead_magnet submissions
DROP POLICY IF EXISTS "Allow lead submissions from all sources" ON public.leads;

CREATE POLICY "Allow lead submissions from all sources"
ON public.leads
FOR INSERT
WITH CHECK (
  lead_source IN ('quiz', 'contact_form', 'contact_page', 'builders_page', 'realtors_page', 'lead_magnet')
  AND name IS NOT NULL 
  AND length(TRIM(name)) > 0
  AND phone IS NOT NULL 
  AND length(TRIM(phone)) > 0
);