-- Drop the existing policy
DROP POLICY IF EXISTS "Allow lead submissions from all sources" ON public.leads;

-- Create updated policy that includes floor-diagnostic source
CREATE POLICY "Allow lead submissions from all sources" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  lead_source IN ('quiz', 'contact_form', 'contact_page', 'builders_page', 'realtors_page', 'lead_magnet', 'floor-diagnostic')
  AND name IS NOT NULL 
  AND length(TRIM(BOTH FROM name)) > 0
  AND phone IS NOT NULL 
  AND length(TRIM(BOTH FROM phone)) > 0
);