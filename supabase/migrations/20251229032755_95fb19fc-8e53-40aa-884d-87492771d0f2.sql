-- Drop the existing policy
DROP POLICY IF EXISTS "Allow lead submissions from all sources" ON public.leads;

-- Create updated policy that includes ALL lead sources used in the app
CREATE POLICY "Allow lead submissions from all sources" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  lead_source IN (
    'quiz', 
    'contact_form', 
    'contact_page', 
    'builders_page', 
    'realtors_page', 
    'lead_magnet', 
    'floor-diagnostic',
    'contact_section',
    'review_system'
  )
  AND name IS NOT NULL 
  AND length(TRIM(BOTH FROM name)) > 0
  AND phone IS NOT NULL 
  AND length(TRIM(BOTH FROM phone)) > 0
);