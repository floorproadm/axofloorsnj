-- Create job_proof table
CREATE TABLE public.job_proof (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  before_image_url TEXT,
  after_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_proof ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view job proof"
ON public.job_proof FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create job proof"
ON public.job_proof FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update job proof"
ON public.job_proof FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete job proof"
ON public.job_proof FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_job_proof_updated_at
BEFORE UPDATE ON public.job_proof
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for job proof images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('job-proof', 'job-proof', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload job proof images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'job-proof' AND auth.uid() IS NOT NULL);

CREATE POLICY "Job proof images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-proof');

CREATE POLICY "Authenticated users can update job proof images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'job-proof' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete job proof images"
ON storage.objects FOR DELETE
USING (bucket_id = 'job-proof' AND auth.uid() IS NOT NULL);

-- Server-side validation function
CREATE OR REPLACE FUNCTION public.validate_project_completion(p_project_id UUID)
RETURNS TABLE(
  can_complete BOOLEAN,
  error_message TEXT,
  has_before_image BOOLEAN,
  has_after_image BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_has_before BOOLEAN := FALSE;
  v_has_after BOOLEAN := FALSE;
  v_can_complete BOOLEAN := FALSE;
  v_error_message TEXT := NULL;
BEGIN
  -- Check for at least one before image
  SELECT EXISTS(
    SELECT 1 FROM public.job_proof jp
    WHERE jp.project_id = p_project_id
    AND jp.before_image_url IS NOT NULL
    AND jp.before_image_url != ''
  ) INTO v_has_before;
  
  -- Check for at least one after image
  SELECT EXISTS(
    SELECT 1 FROM public.job_proof jp
    WHERE jp.project_id = p_project_id
    AND jp.after_image_url IS NOT NULL
    AND jp.after_image_url != ''
  ) INTO v_has_after;
  
  -- Determine if can complete
  IF NOT v_has_before AND NOT v_has_after THEN
    v_error_message := 'BLOCKED: Missing before AND after images. Upload at least 1 of each.';
  ELSIF NOT v_has_before THEN
    v_error_message := 'BLOCKED: Missing before image. Upload at least 1 before photo.';
  ELSIF NOT v_has_after THEN
    v_error_message := 'BLOCKED: Missing after image. Upload at least 1 after photo.';
  ELSE
    v_can_complete := TRUE;
  END IF;
  
  -- Log blocked attempt
  IF NOT v_can_complete THEN
    INSERT INTO public.audit_log (
      user_id,
      user_role,
      operation_type,
      table_accessed,
      data_classification
    ) VALUES (
      auth.uid(),
      'authenticated',
      'COMPLETION_BLOCKED',
      'projects',
      'PROOF_MISSING: project_id=' || p_project_id || ', before=' || v_has_before || ', after=' || v_has_after
    );
  END IF;
  
  RETURN QUERY SELECT v_can_complete, v_error_message, v_has_before, v_has_after;
END;
$$;