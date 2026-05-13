import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.json().catch(() => ({}));
    const { review_request_id, project_id, organization_id } = body ?? {};

    // Resolve target review_request row
    let targetId = review_request_id as string | undefined;

    if (!targetId && project_id) {
      // Auto-create from project (manual send path)
      const { data: project, error: pErr } = await supabase
        .from('projects')
        .select('id, organization_id, customer_id, customer_name, customer_email, customer_phone, address, city')
        .eq('id', project_id)
        .maybeSingle();
      if (pErr || !project) {
        return new Response(JSON.stringify({ error: 'Project not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Reuse existing pending row if present, otherwise insert
      const { data: existing } = await supabase
        .from('review_requests')
        .select('id')
        .eq('project_id', project.id)
        .maybeSingle();

      if (existing?.id) {
        targetId = existing.id;
      } else {
        const { data: inserted, error: iErr } = await supabase
          .from('review_requests')
          .insert({
            organization_id: organization_id ?? project.organization_id,
            project_id: project.id,
            customer_id: project.customer_id,
            customer_name: project.customer_name,
            customer_email: project.customer_email,
            customer_phone: project.customer_phone,
            project_address: [project.address, project.city].filter(Boolean).join(', '),
            channel: project.customer_email ? 'email' : 'sms',
            status: 'pending',
          })
          .select('id')
          .single();
        if (iErr) throw iErr;
        targetId = inserted.id;
      }
    }

    if (!targetId) {
      return new Response(JSON.stringify({ error: 'review_request_id or project_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark as sent (real message dispatch can be wired later)
    const { data: updated, error: uErr } = await supabase
      .from('review_requests')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', targetId)
      .select()
      .single();

    if (uErr) throw uErr;

    return new Response(JSON.stringify({ ok: true, review_request: updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('reputation-request error', e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
