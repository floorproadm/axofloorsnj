-- Fix security warning: Function Search Path Mutable
-- Update the migrate_quiz_responses_to_leads function to have proper search path
CREATE OR REPLACE FUNCTION migrate_quiz_responses_to_leads()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.leads (
    name, email, phone, lead_source, services, budget, room_size, 
    city, zip_code, created_at, updated_at
  )
  SELECT 
    name, email, phone, 'quiz' as lead_source, services, budget, room_size,
    city, zip_code, created_at, updated_at
  FROM public.quiz_responses
  ON CONFLICT DO NOTHING;
END;
$$;