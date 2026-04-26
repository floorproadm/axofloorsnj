// Nightly reminder: scans recently completed/in_progress projects missing AFTER photos.
// Creates in-app notifications for org admins/owners + sends an email summary via Resend.
// Designed to run once per day via pg_cron (e.g. 18:00 local).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProjectRow {
  id: string;
  customer_name: string | null;
  address: string | null;
  organization_id: string;
  project_status: string;
  start_date: string | null;
  completion_date?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    // Find projects in_progress OR completed that have NO AFTER photo.
    const { data: projects, error: pErr } = await supabase
      .from("projects")
      .select("id, customer_name, address, organization_id, project_status, start_date")
      .in("project_status", ["in_production", "in_progress", "completed"]);
    if (pErr) throw pErr;

    const projectIds = (projects ?? []).map((p) => p.id);
    if (projectIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, scanned: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: proofs } = await supabase
      .from("job_proof")
      .select("project_id, after_image_url")
      .in("project_id", projectIds);

    const hasAfter = new Set(
      (proofs ?? [])
        .filter((r: any) => r.after_image_url && r.after_image_url !== "")
        .map((r: any) => r.project_id),
    );

    const missing = (projects as ProjectRow[]).filter((p) => !hasAfter.has(p.id));

    // Group by organization
    const byOrg = new Map<string, ProjectRow[]>();
    for (const p of missing) {
      const arr = byOrg.get(p.organization_id) ?? [];
      arr.push(p);
      byOrg.set(p.organization_id, arr);
    }

    let notifCount = 0;
    let emailCount = 0;

    for (const [orgId, items] of byOrg) {
      // Find admins/owners of this org
      const { data: members } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", orgId)
        .in("role", ["owner", "admin"]);

      const userIds = (members ?? []).map((m: any) => m.user_id);
      if (userIds.length === 0) continue;

      const titleSummary =
        items.length === 1
          ? `Falta foto AFTER em ${items[0].customer_name ?? items[0].address ?? "1 projeto"}`
          : `${items.length} projetos sem foto AFTER`;

      const body = items
        .slice(0, 5)
        .map((p) => `• ${p.customer_name ?? "—"} (${p.address ?? "sem endereço"}) [${p.project_status}]`)
        .join("\n");

      // 1) In-app notifications
      const rows = userIds.map((uid) => ({
        user_id: uid,
        organization_id: orgId,
        type: "proof_missing",
        title: titleSummary,
        body: body.slice(0, 500),
        link: `/admin/projects/${items[0].id}`,
      }));
      const { error: nErr } = await supabase.from("notifications").insert(rows);
      if (!nErr) notifCount += rows.length;

      // 2) Email summary (Resend) — only if API key is configured
      if (RESEND_API_KEY) {
        // Fetch admin emails from profiles
        const { data: profs } = await supabase
          .from("profiles")
          .select("email, full_name")
          .in("user_id", userIds);
        const recipients = (profs ?? [])
          .map((p: any) => p.email)
          .filter((e: string | null) => !!e);

        if (recipients.length > 0) {
          const html = `
            <div style="font-family: -apple-system, sans-serif; max-width: 560px;">
              <h2 style="color:#111;margin:0 0 12px">${titleSummary}</h2>
              <p style="color:#555;margin:0 0 16px">Lembrete diário — esses projetos ainda precisam de foto AFTER:</p>
              <ul style="padding-left:18px;color:#222">
                ${items
                  .slice(0, 20)
                  .map(
                    (p) =>
                      `<li style="margin:4px 0">${p.customer_name ?? "—"} — ${p.address ?? "sem endereço"} <span style="color:#999">[${p.project_status}]</span></li>`,
                  )
                  .join("")}
              </ul>
              ${items.length > 20 ? `<p style="color:#888">+ ${items.length - 20} outros</p>` : ""}
              <p style="margin-top:24px;color:#666;font-size:13px">
                Sobe pelo painel /admin/projects para liberar conclusão e capturar prova do trabalho.
              </p>
            </div>`;

          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "AXO Floors <noreply@axofloorsnj.com>",
              to: recipients,
              subject: `[AXO] ${titleSummary}`,
              html,
            }),
          });
          if (emailRes.ok) emailCount += recipients.length;
          else console.warn("Resend failed:", await emailRes.text());
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        scanned: projects?.length ?? 0,
        missing_after: missing.length,
        notifications_created: notifCount,
        emails_sent: emailCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("nightly-proof-reminder error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
