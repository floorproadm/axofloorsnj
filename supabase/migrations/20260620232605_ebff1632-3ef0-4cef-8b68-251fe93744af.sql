
CREATE OR REPLACE FUNCTION public.send_portal_message(
  p_token text,
  p_content text,
  p_sender_name text DEFAULT NULL,
  p_attachment_url text DEFAULT NULL,
  p_attachment_type text DEFAULT NULL,
  p_attachment_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_project_id uuid;
  v_lead public.leads%ROWTYPE;
  v_msg public.chat_messages%ROWTYPE;
  v_name text;
  v_content text := COALESCE(trim(p_content), '');
BEGIN
  IF v_content = '' AND p_attachment_url IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_message');
  END IF;

  SELECT * INTO v_customer FROM public.customers WHERE portal_token = p_token LIMIT 1;
  IF v_customer.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  -- 1) Try existing project linked to customer
  SELECT id INTO v_project_id
  FROM public.projects
  WHERE customer_id = v_customer.id
  ORDER BY
    CASE WHEN project_status NOT IN ('completed','cancelled') THEN 0 ELSE 1 END,
    updated_at DESC NULLS LAST,
    created_at DESC NULLS LAST
  LIMIT 1;

  -- 2) Fallback: find lead by matching email/phone and reuse or create draft project
  IF v_project_id IS NULL THEN
    SELECT * INTO v_lead
    FROM public.leads
    WHERE deleted_at IS NULL
      AND organization_id = v_customer.organization_id
      AND (
        (NULLIF(trim(lower(email)), '') IS NOT NULL AND lower(email) = lower(COALESCE(v_customer.email, '')))
        OR (NULLIF(regexp_replace(COALESCE(phone,''), '\D', '', 'g'), '') IS NOT NULL
            AND regexp_replace(COALESCE(phone,''), '\D', '', 'g') = regexp_replace(COALESCE(v_customer.phone,''), '\D', '', 'g'))
      )
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_lead.id IS NOT NULL THEN
      -- Validate existing converted project
      IF v_lead.converted_to_project_id IS NOT NULL THEN
        SELECT id INTO v_project_id FROM public.projects WHERE id = v_lead.converted_to_project_id;
      END IF;

      -- Create a draft project if none exists
      IF v_project_id IS NULL THEN
        INSERT INTO public.projects (
          customer_name, customer_email, customer_phone,
          address, city, zip_code,
          project_type, project_status,
          customer_id, organization_id, notes
        ) VALUES (
          COALESCE(v_customer.full_name, v_lead.name, 'Client'),
          COALESCE(v_customer.email, v_lead.email, ''),
          COALESCE(v_customer.phone, v_lead.phone, ''),
          COALESCE(v_customer.address, v_lead.address),
          v_customer.city, v_customer.zip_code,
          COALESCE(v_lead.service_type, 'inquiry'),
          'pending',
          v_customer.id, v_customer.organization_id,
          'Auto-created from portal chat'
        )
        RETURNING id INTO v_project_id;

        UPDATE public.leads SET converted_to_project_id = v_project_id WHERE id = v_lead.id;
      ELSE
        -- Ensure project is linked to this customer
        UPDATE public.projects SET customer_id = v_customer.id WHERE id = v_project_id AND customer_id IS NULL;
      END IF;
    END IF;
  END IF;

  IF v_project_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_project');
  END IF;

  v_name := COALESCE(NULLIF(trim(p_sender_name), ''), v_customer.full_name, 'Client');

  INSERT INTO public.chat_messages (project_id, sender_id, sender_name, content, attachment_url, attachment_type, attachment_name)
  VALUES (v_project_id, v_customer.id, v_name, v_content, p_attachment_url, p_attachment_type, p_attachment_name)
  RETURNING * INTO v_msg;

  RETURN jsonb_build_object('ok', true, 'message', to_jsonb(v_msg));
END;
$function$;
