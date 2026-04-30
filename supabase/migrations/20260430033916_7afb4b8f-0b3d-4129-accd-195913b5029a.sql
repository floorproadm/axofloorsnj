create or replace function public.submit_partner_referral(
  p_client_name text,
  p_phone text,
  p_email text default null,
  p_address text default null,
  p_city text default null,
  p_zip_code text default null,
  p_service_needed text default null,
  p_urgency text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner_id uuid;
  v_org_id uuid;
  v_referral_id uuid;
  v_lead_id uuid;
begin
  select partner_id, organization_id
  into v_partner_id, v_org_id
  from partner_users
  where user_id = auth.uid();

  if v_partner_id is null then
    raise exception 'Partner account not found';
  end if;

  insert into referrals (
    referrer_id, referred_name, referred_email, referred_phone, status, organization_id
  )
  values (
    v_partner_id, p_client_name, p_email, p_phone, 'pending', v_org_id
  )
  returning id into v_referral_id;

  insert into leads (
    name, phone, email, address, city, zip_code,
    lead_source, status, priority, services, message,
    referred_by_partner_id, organization_id
  )
  values (
    p_client_name, p_phone, p_email, p_address, p_city, p_zip_code,
    'partner_referral', 'warm_lead', 'high',
    jsonb_build_object(
      'source_type', 'partner_referral',
      'service_needed', p_service_needed,
      'urgency', p_urgency
    ),
    p_notes,
    v_partner_id, v_org_id
  )
  returning id into v_lead_id;

  update referrals set lead_id = v_lead_id where id = v_referral_id;

  insert into tasks (
    title, description, status, priority,
    related_lead_id, related_partner_id, organization_id
  )
  values (
    'New partner referral: ' || p_client_name,
    coalesce(p_notes, 'Partner submitted a new referral.'),
    'pending', 'high',
    v_lead_id, v_partner_id, v_org_id
  );

  return v_referral_id;
end;
$$;

revoke all on function public.submit_partner_referral(text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.submit_partner_referral(text, text, text, text, text, text, text, text, text) to authenticated;