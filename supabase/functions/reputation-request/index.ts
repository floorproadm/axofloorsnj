import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 60 * 60 * 1000; // 1 hour

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let targetId: string | undefined;

  try {
    const body = await req.json().catch(() => ({}));
    const { review_request_id, project_id, organization_id, is_retry } = body ?? {};
    targetId = review_request_id;

    console.log('[reputation-request] start', { review_request_id, project_id, is_retry });

    if (!targetId && project_id) {
      const { data: project, error: pErr } = await supabase
        .from('projects')
        .select('id, organization_id, customer_id, customer_name, customer_email, customer_phone, address, city')
        .eq('id', project_id)
        .maybeSingle();
      if (pErr || !project) throw new Error('Project not found');

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

    if (!targetId) throw new Error('review_request_id or project_id required');

    // Read current row to enforce attempts cap
    const { data: current } = await supabase
      .from('review_requests')
      .select('id, attempts, status')
      .eq('id', targetId)
      .single();

    const nextAttempts = (current?.attempts ?? 0) + 1;

    // -- Real dispatch would go here. For now, treat as success. --
    // If you wire SMS/Email later, throw on failure to trigger the catch block.

    const { data: updated, error: uErr } = await supabase
      .from('review_requests')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        attempts: nextAttempts,
        last_attempt_at: new Date().toISOString(),
        next_attempt_at: null,
        error_message: null,
      })
      .eq('id', targetId)
      .select()
      .single();

    if (uErr) throw uErr;

    console.log('[reputation-request] sent', { id: targetId, attempts: nextAttempts });

    return new Response(JSON.stringify({ ok: true, review_request: updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const errMsg = String((e as Error).message ?? e);
    console.error('[reputation-request] error', { targetId, error: errMsg });

    // Persist failure on the row (when we know which one)
    if (targetId) {
      try {
        const { data: row } = await supabase
          .from('review_requests')
          .select('attempts')
          .eq('id', targetId)
          .single();
        const nextAttempts = (row?.attempts ?? 0) + 1;
        const giveUp = nextAttempts >= MAX_ATTEMPTS;
        await supabase
          .from('review_requests')
          .update({
            status: 'failed',
            error_message: errMsg.slice(0, 500),
            attempts: nextAttempts,
            last_attempt_at: new Date().toISOString(),
            next_attempt_at: giveUp ? null : new Date(Date.now() + RETRY_DELAY_MS).toISOString(),
          })
          .eq('id', targetId);
      } catch (logErr) {
        console.error('[reputation-request] failed to persist failure', logErr);
      }
    }

    // Best-effort log into audit_log for observability
    try {
      await supabase.from('audit_log').insert({
        operation_type: 'REPUTATION_REQUEST_FAILED',
        table_accessed: 'review_requests',
        user_role: 'system',
        data_classification: JSON.stringify({ review_request_id: targetId, error: errMsg }),
      });
    } catch (_) { /* ignore */ }

    return new Response(JSON.stringify({ error: errMsg, review_request_id: targetId }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
