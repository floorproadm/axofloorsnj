CREATE OR REPLACE FUNCTION public.enforce_partner_lead_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_partner_id uuid;
  v_org_id uuid;
BEGIN
  v_partner_id := public.get_partner_id_for_user();
  IF v_partner_id IS NOT NULL THEN
    v_org_id := public.get_partner_org_for_user();
    NEW.referred_by_partner_id := v_partner_id;
    NEW.organization_id := v_org_id;
    NEW.lead_source := 'partner_referral';
    -- Only force default status if caller didn't set one explicitly.
    -- This allows submit_partner_referral RPC to insert as 'warm_lead'.
    IF NEW.status IS NULL OR NEW.status = 'cold_lead' THEN
      NEW.status := 'cold_lead';
    END IF;
    IF NEW.priority IS NULL THEN
      NEW.priority := 'medium';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;