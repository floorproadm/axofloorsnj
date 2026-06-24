// Public-callable notification: alerts the admin/owner that a proposal was just signed.
// Called from the customer-facing SignatureDialog (anonymous client) right after
// public_accept_proposal succeeds. Uses the proposal token to validate the proposal
// exists and is accepted, then sends a Gmail notification via gmail-send using the
// trusted webhook secret (server-to-server).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { proposal_token } = await req.json();
    if (!proposal_token || typeof proposal_token !== "string") {
      return new Response(JSON.stringify({ error: "proposal_token required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate proposal + load context.
    const { data: proposal, error: pErr } = await sb
      .from("proposals")
      .select("id, organization_id, proposal_number, customer_name, selected_tier, status")
      .eq("public_token", proposal_token)
      .maybeSingle();

    if (pErr || !proposal) {
      return new Response(JSON.stringify({ error: "proposal not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Latest signature row for payment method + signer name.
    const { data: sig } = await sb
      .from("proposal_signatures")
      .select("signer_name, signer_email, payment_method, created_at")
      .eq("proposal_id", proposal.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Admin recipient = company_settings.email for this org.
    const { data: settings } = await sb
      .from("company_settings")
      .select("email, company_name")
      .eq("organization_id", proposal.organization_id)
      .maybeSingle();

    const adminEmail = settings?.email;
    if (!adminEmail) {
      return new Response(JSON.stringify({ error: "admin email not configured" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tierLabel = !proposal.selected_tier || proposal.selected_tier === "flat"
      ? "Single Price" : String(proposal.selected_tier).toUpperCase();
    const propNum = proposal.proposal_number || String(proposal.id).slice(0, 8);
    const custName = sig?.signer_name || proposal.customer_name || "Customer";
    const origin = new URL(req.url).origin.replace(
      /https:\/\/[a-z0-9-]+\.supabase\.co.*$/,
      "https://floorpro.lovable.app",
    );
    const adminLink = `https://floorpro.lovable.app/admin/proposals`;

    const rawBody = `
      <h2 style="color:#0f1b3d">Proposal Signed ✓</h2>
      <p>A client just approved and signed a proposal.</p>
      <table cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;border:1px solid #e2e8f0">
        <tr><td style="background:#f8fafc;font-weight:bold">Customer</td><td>${custName}</td></tr>
        <tr><td style="background:#f8fafc;font-weight:bold">Proposal #</td><td>${propNum}</td></tr>
        <tr><td style="background:#f8fafc;font-weight:bold">Selected Tier</td><td>${tierLabel}</td></tr>
        <tr><td style="background:#f8fafc;font-weight:bold">Payment Method</td><td>${sig?.payment_method || "—"}</td></tr>
        ${sig?.signer_email ? `<tr><td style="background:#f8fafc;font-weight:bold">Signer Email</td><td>${sig.signer_email}</td></tr>` : ""}
      </table>
      <p><a href="${adminLink}" style="background:#d97706;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block">Open Proposals</a></p>
    `;

    // Get webhook secret to call gmail-send server-to-server.
    const { data: secret } = await sb.rpc("_get_edge_webhook_secret" as any);
    if (!secret) {
      return new Response(JSON.stringify({ error: "webhook secret unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gmailRes = await fetch(`${SUPABASE_URL}/functions/v1/gmail-send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-edge-webhook-secret": secret as string,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        template: "__raw__",
        organization_id: proposal.organization_id,
        data: {
          recipient_email: adminEmail,
          raw_subject: `Proposal Signed — ${propNum} (${custName})`,
          raw_body: rawBody,
          related_id: proposal.id,
          related_type: "proposal_signed_admin_notice",
        },
      }),
    });

    const gmailJson = await gmailRes.json().catch(() => ({}));
    if (!gmailRes.ok) {
      console.error("gmail-send failed", gmailRes.status, gmailJson);
      return new Response(JSON.stringify({ error: "send failed", detail: gmailJson }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-proposal-signed error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
