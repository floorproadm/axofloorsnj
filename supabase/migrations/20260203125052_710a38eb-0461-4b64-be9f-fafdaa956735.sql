-- Create trigger function to enforce JobProof before completion
CREATE OR REPLACE FUNCTION public.enforce_job_proof_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_can_complete BOOLEAN;
  v_error_message TEXT;
BEGIN
  -- Only validate when status is being changed TO 'completed'
  IF NEW.project_status = 'completed' AND (OLD.project_status IS NULL OR OLD.project_status != 'completed') THEN
    -- Call existing validation function
    SELECT can_complete, error_message 
    INTO v_can_complete, v_error_message
    FROM public.validate_project_completion(NEW.id);
    
    -- Block if validation fails
    IF NOT v_can_complete THEN
      RAISE EXCEPTION 'JobProof obrigatório: %', COALESCE(v_error_message, 'adicione before e after');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on projects table
DROP TRIGGER IF EXISTS enforce_job_proof_trigger ON public.projects;

CREATE TRIGGER enforce_job_proof_trigger
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_job_proof_on_completion();