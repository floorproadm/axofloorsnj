-- Create function to validate margin before proposal send
-- Returns error if margin is below minimum, logs blocked attempts
CREATE OR REPLACE FUNCTION public.validate_proposal_margin(p_project_id UUID)
RETURNS TABLE (
  can_send BOOLEAN,
  error_message TEXT,
  current_margin NUMERIC,
  min_margin NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_margin_percent NUMERIC;
  v_min_margin NUMERIC;
  v_can_send BOOLEAN;
  v_error_message TEXT;
BEGIN
  -- Get minimum margin from company settings
  SELECT default_margin_min_percent INTO v_min_margin
  FROM public.company_settings
  LIMIT 1;
  
  v_min_margin := COALESCE(v_min_margin, 30);
  
  -- Get current margin for project
  SELECT jc.margin_percent INTO v_margin_percent
  FROM public.job_costs jc
  WHERE jc.project_id = p_project_id;
  
  -- Validate
  IF v_margin_percent IS NULL THEN
    v_can_send := FALSE;
    v_error_message := 'BLOCKED: No margin data found for project. Calculate costs before sending proposal.';
    v_margin_percent := 0;
  ELSIF v_margin_percent < v_min_margin THEN
    v_can_send := FALSE;
    v_error_message := 'BLOCKED: Margin ' || v_margin_percent || '% is below minimum ' || v_min_margin || '%. No exceptions allowed.';
  ELSE
    v_can_send := TRUE;
    v_error_message := NULL;
  END IF;
  
  -- Log blocked attempt to audit_log
  IF NOT v_can_send THEN
    INSERT INTO public.audit_log (
      user_id,
      user_role,
      operation_type,
      table_accessed,
      data_classification
    ) VALUES (
      auth.uid(),
      'authenticated',
      'PROPOSAL_BLOCKED',
      'projects',
      'MARGIN_VIOLATION: project_id=' || p_project_id || ', margin=' || COALESCE(v_margin_percent::TEXT, 'NULL') || '%, min=' || v_min_margin || '%'
    );
  END IF;
  
  RETURN QUERY SELECT v_can_send, v_error_message, v_margin_percent, v_min_margin;
END;
$$;