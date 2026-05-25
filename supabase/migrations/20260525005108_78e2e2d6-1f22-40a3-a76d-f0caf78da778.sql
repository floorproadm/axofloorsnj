-- RPC: partner sends a nudge for one of their referred leads.
-- Inserts a notification for every admin/owner in the partner's organization.
CREATE OR REPLACE FUNCTION public.partner_nudge_admin(p_lead_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id uuid;
  v_org_id uuid;
  v_lead public.leads%ROWTYPE;
  v_partner public.partners%ROWTYPE;
  v_recipient RECORD;
  v_count int := 0;
BEGIN
  v_partner_id := public.get_partner_id_for_user();
  v_org_id := public.get_partner_org_for_user();

  IF v_partner_id IS NULL OR v_org_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized: partner context required';
  END IF;

  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
  IF v_lead.id IS NULL THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  -- Ownership check: the lead must have been referred by this partner
  IF v_lead.referred_by_partner_id IS DISTINCT FROM v_partner_id THEN
    RAISE EXCEPTION 'Not authorized: lead does not belong to this partner';
  END IF;

  SELECT * INTO v_partner FROM public.partners WHERE id = v_partner_id;

  FOR v_recipient IN
    SELECT om.user_id FROM public.organization_members om
    WHERE om.organization_id = v_org_id
      AND om.role IN ('owner', 'admin')
  LOOP
    INSERT INTO public.notifications (user_id, organization_id, type, title, body, link)
    VALUES (
      v_recipient.user_id,
      v_org_id,
      'partner_nudge',
      '🤝 Nudge from ' || COALESCE(v_partner.contact_name, v_partner.company_name, 'partner'),
      'Asking for update on referral: ' || v_lead.name,
      '/admin/leads/' || p_lead_id
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'notified', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.partner_nudge_admin(uuid) TO authenticated;