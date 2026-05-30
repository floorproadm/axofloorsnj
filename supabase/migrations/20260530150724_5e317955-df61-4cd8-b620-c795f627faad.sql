
create or replace function public.get_portal_timeline(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_result jsonb;
begin
  select id into v_customer_id from public.customers where portal_token = p_token;
  if v_customer_id is null then
    return jsonb_build_object('projects', '[]'::jsonb);
  end if;

  select jsonb_build_object('projects', coalesce(jsonb_agg(proj order by proj_created desc), '[]'::jsonb))
  into v_result
  from (
    select
      p.created_at as proj_created,
      jsonb_build_object(
        'id', p.id,
        'project_type', p.project_type,
        'address', p.address,
        'photos', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', ph.id,
            'photo_url', ph.photo_url,
            'annotated_url', ph.annotated_url,
            'taken_at', ph.taken_at,
            'location_label', ph.location_label
          ) order by ph.taken_at desc)
          from public.project_photos ph where ph.project_id = p.id
        ), '[]'::jsonb),
        'checklist', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', c.id,
            'title', c.title,
            'completed', c.completed,
            'sort_order', c.sort_order
          ) order by c.sort_order)
          from public.project_checklists c where c.project_id = p.id
        ), '[]'::jsonb),
        'before_after', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', ba.id,
            'title', ba.title,
            'before_url', ba.before_url,
            'after_url', ba.after_url,
            'completed_date', ba.completed_date
          ) order by ba.created_at desc)
          from public.before_after_pairs ba where ba.project_id = p.id
        ), '[]'::jsonb)
      ) as proj
    from public.projects p
    where p.customer_id = v_customer_id
  ) sub;

  return coalesce(v_result, jsonb_build_object('projects', '[]'::jsonb));
end;
$$;

grant execute on function public.get_portal_timeline(text) to anon, authenticated;
