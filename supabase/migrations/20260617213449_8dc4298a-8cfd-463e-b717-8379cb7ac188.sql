CREATE OR REPLACE FUNCTION public.public_get_invoice_bundle(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_inv public.invoices%ROWTYPE;
  v_items jsonb;
  v_schedule jsonb;
  v_property jsonb;
  v_company jsonb;
  v_customer jsonb;
  v_project jsonb;
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN RETURN NULL; END IF;
  SELECT * INTO v_inv FROM public.invoices WHERE share_token = p_token LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(i) ORDER BY i.created_at), '[]'::jsonb)
    INTO v_items FROM public.invoice_items i WHERE i.invoice_id = v_inv.id;
  SELECT COALESCE(jsonb_agg(to_jsonb(s) ORDER BY s.phase_order), '[]'::jsonb)
    INTO v_schedule FROM public.invoice_payment_schedule s WHERE s.invoice_id = v_inv.id;
  IF v_inv.property_id IS NOT NULL THEN
    SELECT to_jsonb(cp) INTO v_property FROM public.customer_properties cp WHERE cp.id = v_inv.property_id;
  END IF;
  IF v_inv.customer_id IS NOT NULL THEN
    SELECT jsonb_build_object('id', c.id, 'name', c.name, 'email', c.email, 'phone', c.phone, 'address', c.address)
      INTO v_customer FROM public.customers c WHERE c.id = v_inv.customer_id;
  END IF;
  SELECT jsonb_build_object('id', p.id, 'customer_name', p.customer_name, 'address', p.address, 'status', p.project_status, 'project_type', p.project_type)
    INTO v_project FROM public.projects p WHERE p.id = v_inv.project_id;
  SELECT jsonb_build_object('company_name', cs.company_name, 'phone', cs.phone, 'email', cs.email, 'website', cs.website, 'logo_url', cs.logo_url, 'tagline', cs.tagline)
    INTO v_company FROM public.company_settings cs WHERE cs.organization_id = v_inv.organization_id LIMIT 1;

  RETURN jsonb_build_object(
    'invoice', to_jsonb(v_inv),
    'items', v_items,
    'schedule', v_schedule,
    'property', v_property,
    'customer', v_customer,
    'project', v_project,
    'company', v_company
  );
END;
$function$;

-- Backfill share tokens for any invoice missing one
UPDATE public.invoices SET share_token = encode(gen_random_bytes(20), 'hex') WHERE share_token IS NULL;