CREATE OR REPLACE FUNCTION public.convert_lead_to_project(p_lead_id uuid, p_project_type text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_customer_id uuid;
  v_project_id uuid;
BEGIN
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;

  IF v_lead.id IS NULL THEN
    RAISE EXCEPTION 'Lead não encontrado: %', p_lead_id;
  END IF;

  IF v_lead.converted_to_project_id IS NOT NULL THEN
    RAISE EXCEPTION 'Lead já convertido para projeto: %', v_lead.converted_to_project_id;
  END IF;

  IF v_lead.organization_id IS NULL THEN
    RAISE EXCEPTION 'Lead sem organization_id: %', p_lead_id;
  END IF;

  -- Find or create customer (com organization_id)
  IF v_lead.customer_id IS NOT NULL THEN
    v_customer_id := v_lead.customer_id;
  ELSE
    INSERT INTO public.customers(organization_id, full_name, email, phone, address, city, zip_code, notes)
    VALUES (v_lead.organization_id, v_lead.name, v_lead.email, v_lead.phone, v_lead.address, v_lead.city, v_lead.zip_code, v_lead.notes)
    RETURNING id INTO v_customer_id;
  END IF;

  -- Create project (com organization_id)
  INSERT INTO public.projects(
    organization_id, customer_id, customer_name, customer_email, customer_phone,
    project_type, project_status, address, city, zip_code, notes
  )
  VALUES (
    v_lead.organization_id, v_customer_id, v_lead.name, COALESCE(v_lead.email, ''), v_lead.phone,
    p_project_type, 'pending', v_lead.address, v_lead.city, v_lead.zip_code, v_lead.notes
  )
  RETURNING id INTO v_project_id;

  -- Job costs zerado
  INSERT INTO public.job_costs(project_id, labor_cost, material_cost, additional_costs, estimated_revenue)
  VALUES (v_project_id, 0, 0, 0, 0);

  -- Link lead
  UPDATE public.leads
  SET customer_id = v_customer_id,
      converted_to_project_id = v_project_id
  WHERE id = p_lead_id;

  -- Audit
  INSERT INTO public.audit_log(operation_type, table_accessed, data_classification, user_id, user_role, organization_id)
  VALUES ('LEAD_CONVERTED', 'leads', 'lead_id=' || p_lead_id || ', project_id=' || v_project_id || ', customer_id=' || v_customer_id, auth.uid(), 'authenticated', v_lead.organization_id);

  RETURN v_project_id;
END;
$function$;