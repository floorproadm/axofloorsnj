
CREATE OR REPLACE FUNCTION public.get_leads_nra_batch(p_lead_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
  v_nra jsonb;
  v_results jsonb := '[]'::jsonb;
BEGIN
  FOREACH v_id IN ARRAY p_lead_ids LOOP
    v_nra := public.get_lead_nra(v_id);
    v_results := v_results || jsonb_build_array(
      jsonb_build_object('lead_id', v_id) || v_nra
    );
  END LOOP;
  RETURN v_results;
END;
$$;
