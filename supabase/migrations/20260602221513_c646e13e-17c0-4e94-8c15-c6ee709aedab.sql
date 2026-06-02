CREATE OR REPLACE FUNCTION public.enforce_proposal_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'accepted' THEN
    -- Only require selected_tier for tiered proposals (no flat_price)
    IF NEW.selected_tier IS NULL AND NEW.flat_price IS NULL THEN
      RAISE EXCEPTION 'Proposal acceptance invalid: selected_tier is required when status is accepted.';
    END IF;
    IF NEW.accepted_at IS NULL THEN
      NEW.accepted_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_proposal_acceptance(p_proposal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_proposal public.proposals%ROWTYPE;
BEGIN
  SELECT * INTO v_proposal FROM public.proposals WHERE id = p_proposal_id;

  IF v_proposal.id IS NULL THEN
    RAISE EXCEPTION 'Proposal not found: %', p_proposal_id;
  END IF;

  IF v_proposal.status = 'accepted' THEN
    IF v_proposal.selected_tier IS NULL AND v_proposal.flat_price IS NULL THEN
      RAISE EXCEPTION 'Proposal acceptance invalid: selected_tier is required when status is accepted.';
    END IF;
    IF v_proposal.accepted_at IS NULL THEN
      RAISE EXCEPTION 'Proposal acceptance invalid: accepted_at is required when status is accepted.';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'proposal_id', v_proposal.id,
    'status', v_proposal.status,
    'selected_tier', v_proposal.selected_tier
  );
END;
$function$;