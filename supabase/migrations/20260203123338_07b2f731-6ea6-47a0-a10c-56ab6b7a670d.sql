-- Add follow-up tracking columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS next_action_date DATE,
ADD COLUMN IF NOT EXISTS follow_up_actions JSONB DEFAULT '[]'::jsonb;

-- Comment explaining the columns
COMMENT ON COLUMN public.leads.follow_up_required IS 'True when lead is in quoted status and requires follow-up';
COMMENT ON COLUMN public.leads.next_action_date IS 'Required date for next follow-up action when in quoted status';
COMMENT ON COLUMN public.leads.follow_up_actions IS 'Array of follow-up actions: [{date, action, notes}]';

-- Update validate_lead_transition to enforce follow-up rules
CREATE OR REPLACE FUNCTION public.validate_lead_transition(
  p_lead_id UUID,
  p_new_status TEXT
)
RETURNS TABLE(
  can_transition BOOLEAN,
  error_message TEXT,
  current_status TEXT,
  required_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_status TEXT;
  v_has_proposal BOOLEAN;
  v_has_margin BOOLEAN;
  v_project_id UUID;
  v_follow_up_actions JSONB;
  v_has_follow_up_action BOOLEAN;
  v_can_transition BOOLEAN := FALSE;
  v_error_message TEXT := NULL;
  v_required_status TEXT := NULL;
  
  -- Define valid pipeline order
  v_pipeline_order TEXT[] := ARRAY['new', 'contacted', 'quoted', 'won', 'lost'];
  v_current_index INT;
  v_new_index INT;
BEGIN
  -- Get current lead status and follow-up data
  SELECT l.status, l.converted_to_project_id, l.follow_up_actions
  INTO v_current_status, v_project_id, v_follow_up_actions
  FROM public.leads l
  WHERE l.id = p_lead_id;
  
  IF v_current_status IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Lead not found'::TEXT, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  -- If same status, allow
  IF v_current_status = p_new_status THEN
    RETURN QUERY SELECT TRUE, NULL::TEXT, v_current_status, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Get index positions in pipeline
  v_current_index := array_position(v_pipeline_order, v_current_status);
  v_new_index := array_position(v_pipeline_order, p_new_status);
  
  -- Handle unknown statuses
  IF v_current_index IS NULL THEN
    v_current_index := 1; -- Treat unknown as 'new'
  END IF;
  
  IF v_new_index IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Invalid status: ' || p_new_status, v_current_status, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Special case: won and lost are terminal states from quoted
  IF p_new_status IN ('won', 'lost') THEN
    IF v_current_status != 'quoted' THEN
      v_error_message := 'Can only move to ' || p_new_status || ' from "quoted" status';
      v_required_status := 'quoted';
      RETURN QUERY SELECT FALSE, v_error_message, v_current_status, v_required_status;
      RETURN;
    END IF;
    
    -- CHECK: Must have at least ONE follow-up action recorded
    v_has_follow_up_action := (
      v_follow_up_actions IS NOT NULL AND 
      jsonb_array_length(v_follow_up_actions) > 0
    );
    
    IF NOT v_has_follow_up_action THEN
      v_error_message := 'Cannot close lead: At least ONE follow-up action must be recorded before marking as "' || p_new_status || '"';
      RETURN QUERY SELECT FALSE, v_error_message, v_current_status, NULL::TEXT;
      RETURN;
    END IF;
    
    -- All checks passed for terminal states
    RETURN QUERY SELECT TRUE, NULL::TEXT, v_current_status, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if trying to skip stages (must be exactly +1 forward)
  IF v_new_index != v_current_index + 1 THEN
    -- Determine what the next required status should be
    IF v_current_index < array_length(v_pipeline_order, 1) THEN
      v_required_status := v_pipeline_order[v_current_index + 1];
    END IF;
    
    v_error_message := 'Cannot skip pipeline stages. Current: "' || v_current_status || '". Next required: "' || COALESCE(v_required_status, 'N/A') || '"';
    RETURN QUERY SELECT FALSE, v_error_message, v_current_status, v_required_status;
    RETURN;
  END IF;
  
  -- Special validation for moving to "quoted"
  IF p_new_status = 'quoted' THEN
    -- Check if proposal exists (converted_to_project_id links to a project)
    v_has_proposal := v_project_id IS NOT NULL;
    
    IF NOT v_has_proposal THEN
      RETURN QUERY SELECT FALSE, 'Cannot move to "quoted": No proposal/project created for this lead'::TEXT, v_current_status, NULL::TEXT;
      RETURN;
    END IF;
    
    -- Check if margin exists for the project
    SELECT EXISTS(
      SELECT 1 FROM public.job_costs jc 
      WHERE jc.project_id = v_project_id 
      AND jc.margin_percent IS NOT NULL
      AND jc.margin_percent > 0
    ) INTO v_has_margin;
    
    IF NOT v_has_margin THEN
      RETURN QUERY SELECT FALSE, 'Cannot move to "quoted": No margin calculated for the project'::TEXT, v_current_status, NULL::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- All validations passed
  RETURN QUERY SELECT TRUE, NULL::TEXT, v_current_status, NULL::TEXT;
END;
$$;

-- Function to set follow-up required when moving to quoted
CREATE OR REPLACE FUNCTION public.set_follow_up_on_quoted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When status changes to 'quoted', set follow_up_required
  IF NEW.status = 'quoted' AND (OLD.status IS NULL OR OLD.status != 'quoted') THEN
    NEW.follow_up_required := TRUE;
    -- Set next_action_date to 2 business days from now if not already set
    IF NEW.next_action_date IS NULL THEN
      NEW.next_action_date := CURRENT_DATE + INTERVAL '2 days';
    END IF;
  END IF;
  
  -- When status changes to won/lost, clear follow_up_required
  IF NEW.status IN ('won', 'lost') THEN
    NEW.follow_up_required := FALSE;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-setting follow-up
DROP TRIGGER IF EXISTS trigger_set_follow_up_on_quoted ON public.leads;
CREATE TRIGGER trigger_set_follow_up_on_quoted
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_follow_up_on_quoted();