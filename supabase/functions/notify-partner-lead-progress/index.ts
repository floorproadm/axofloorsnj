import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const FROM_ADDRESS = "axofloorsnj@gmail.com";
const PARTNER_PORTAL_URL = "https://axofloorsnj.com/partner/dashboard";

const STATUS_LABELS: Record<string, { label: string; emoji: string; tone: string }> = {
  cold_lead: { label: "New Lead Received", emoji: "📥", tone: "We've received your referral and will reach out shortly." },
  warm_lead: { label: "Initial Contact Made", emoji: "📞", tone: "We've made initial contact with your referral." },
  estimate_requested: { label: "Estimate Requested", emoji: "📋", tone: "Your referral has requested an estimate." },
  estimate_scheduled: { label: "Estimate Scheduled", emoji: "📅", tone: "An on-site estimate has been scheduled." },
  in_draft: { label: "Proposal in Progress", emoji: "✍️", tone: "We're preparing a proposal for your referral." },
  proposal_sent: { label: "Proposal Sent", emoji: "📤", tone: "The proposal has been sent to your referral." },
  proposal_rejected: { label: "Proposal Declined", emoji: "↩️", tone: "The client declined this proposal — we're reworking it." },
  in_production: { label: "Job Started 🎉", emoji: "🚀", tone: "Great news — your referral approved the job and work has started!" },
  completed: { label: "Job Completed ✓", emoji: "✅", tone: "Job completed successfully. Your commission is being processed." },
  lost: { label: "Lead Closed", emoji: "✖️", tone: "Unfortunately this referral didn't move forward." },
};

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function b64url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const lead = body?.record ?? body?.lead ?? body;
    const oldStatus: string | null = body?.old_status ?? null;

    if (!lead?.id || !lead?.referred_by_partner_id) {
      return new Response(JSON.stringify({ skipped: "not a partner referral" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newStatus: string = lead.status;
    const statusInfo = STATUS_LABELS[newStatus];
    if (!statusInfo) {
      return new Response(JSON.stringify({ skipped: "unknown status" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch partner
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: partner, error: partnerErr } = await supabase
      .from("partners")
      .select("id, contact_name, company_name, email")
      .eq("id", lead.referred_by_partner_id)
      .maybeSingle();

    if (partnerErr || !partner?.email) {
      console.warn("Partner not found or no email", lead.referred_by_partner_id, partnerErr);
      return new Response(JSON.stringify({ skipped: "partner has no email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    if (!LOVABLE_API_KEY || !GOOGLE_MAIL_API_KEY) {
      throw new Error("Email gateway credentials not configured");
    }

    const clientName = lead.name ?? "your referral";
    const subject = `${statusInfo.emoji} ${clientName} — ${statusInfo.label}`;

    const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="padding:24px;background:linear-gradient(135deg,#0f172a,#1e293b);">
      <div style="color:#94a3b8;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;">Referral Update</div>
      <div style="color:#fff;font-size:22px;font-weight:600;">${escapeHtml(statusInfo.emoji)} ${escapeHtml(statusInfo.label)}</div>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 12px;color:#0f172a;font-size:15px;">Hi ${escapeHtml(partner.contact_name ?? "there")},</p>
      <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6;">
        ${escapeHtml(statusInfo.tone)}
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;">
        <div style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Referral</div>
        <div style="color:#0f172a;font-size:16px;font-weight:600;">${escapeHtml(clientName)}</div>
        ${lead.city ? `<div style="color:#64748b;font-size:13px;margin-top:4px;">${escapeHtml(lead.city)}</div>` : ""}
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="${PARTNER_PORTAL_URL}" style="display:inline-block;padding:12px 28px;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">View in Partner Portal →</a>
      </div>
    </div>
    <div style="padding:16px 24px;text-align:center;color:#94a3b8;font-size:11px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      AXO Floors · Partner Notifications
    </div>
  </div>
</body></html>`;

    const rfc2822 = [
      `To: ${partner.email}`,
      `From: AXO Floors <${FROM_ADDRESS}>`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset="UTF-8"`,
      ``,
      html,
    ].join("\r\n");

    const raw = b64url(rfc2822);

    const gmailRes = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
      },
      body: JSON.stringify({ raw }),
    });

    if (!gmailRes.ok) {
      const errBody = await gmailRes.text();
      console.error("Gmail send failed", gmailRes.status, errBody);

      // Best-effort log
      await supabase.from("email_logs").insert({
        organization_id: lead.organization_id,
        recipient: partner.email,
        subject,
        type: "partner_lead_progress",
        status: "failed",
        error_message: `${gmailRes.status}: ${errBody}`,
        related_id: lead.id,
        related_type: "lead",
      }).then(() => {}, () => {});

      return new Response(
        JSON.stringify({ error: "gmail_send_failed", status: gmailRes.status, detail: errBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await gmailRes.json();

    await supabase.from("email_logs").insert({
      organization_id: lead.organization_id,
      recipient: partner.email,
      subject,
      body_preview: `${clientName} → ${statusInfo.label}`,
      type: "partner_lead_progress",
      status: "sent",
      sent_at: new Date().toISOString(),
      related_id: lead.id,
      related_type: "lead",
    }).then(() => {}, () => {});

    return new Response(JSON.stringify({ ok: true, message_id: result?.id, partner_email: partner.email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-partner-lead-progress error", err);
    return new Response(JSON.stringify({ error: String((err as Error)?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
