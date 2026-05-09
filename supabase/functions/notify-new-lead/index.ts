import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const NOTIFY_TO = "axofloorsnj@gmail.com";
const ADMIN_BASE_URL = "https://axofloorsnj.com/admin";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function b64url(s: string): string {
  // UTF-8 safe base64url
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function formatSourceLabel(source: string | null): string {
  if (!source) return "Unknown";
  const map: Record<string, string> = {
    floor_diagnostic: "Floor Diagnostic",
    project_wizard: "Project Wizard",
    quick_quote: "Quick Quote",
    partner_referral: "Partner Referral",
    contact_form: "Contact Form",
    manual: "Manual (Admin)",
    website: "Website",
  };
  return map[source] ?? source;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const lead = body?.record ?? body?.lead ?? body;

    if (!lead?.id) {
      return new Response(JSON.stringify({ error: "missing lead payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    if (!LOVABLE_API_KEY || !GOOGLE_MAIL_API_KEY) {
      throw new Error("Email gateway credentials not configured");
    }

    const followUp = lead.follow_up_actions ?? {};
    const serviceNeeded =
      followUp?.service_needed ??
      followUp?.serviceInterest ??
      lead.service_type ??
      null;
    const urgency = followUp?.urgency ?? null;
    const sourceLabel = formatSourceLabel(lead.lead_source);

    const subject = `🔔 New Lead: ${lead.name ?? "Unnamed"} (${sourceLabel})`;

    const adminLink = `${ADMIN_BASE_URL}/leads?focus=${lead.id}`;

    const rows: Array<[string, string | null | undefined]> = [
      ["Name", lead.name],
      ["Phone", lead.phone],
      ["Email", lead.email],
      ["Address", [lead.address, lead.city, lead.zip_code].filter(Boolean).join(", ") || null],
      ["Source", sourceLabel],
      ["Service", serviceNeeded],
      ["Urgency", urgency],
      ["Budget", lead.budget ? `$${Number(lead.budget).toLocaleString()}` : null],
      ["Notes", lead.notes ?? lead.message],
    ];

    const rowsHtml = rows
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(
        ([k, v]) => `
          <tr>
            <td style="padding:8px 12px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;width:130px;vertical-align:top;">${escapeHtml(k)}</td>
            <td style="padding:8px 12px;color:#0f172a;font-size:14px;border-bottom:1px solid #e2e8f0;font-weight:500;">${escapeHtml(String(v))}</td>
          </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="padding:24px;border-bottom:1px solid #e2e8f0;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);">
      <div style="color:#94a3b8;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">New Lead · ${escapeHtml(sourceLabel)}</div>
      <div style="color:#ffffff;font-size:22px;font-weight:600;">${escapeHtml(lead.name ?? "Unnamed Lead")}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      ${rowsHtml}
    </table>
    <div style="padding:24px;text-align:center;background:#f8fafc;">
      <a href="${escapeHtml(adminLink)}" style="display:inline-block;padding:12px 28px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Open Lead in AXO OS →</a>
    </div>
    <div style="padding:16px 24px;text-align:center;color:#94a3b8;font-size:11px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      AXO Floors · Automated lead notification
    </div>
  </div>
</body>
</html>`;

    const rfc2822 = [
      `To: ${NOTIFY_TO}`,
      `From: ${NOTIFY_TO}`,
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
      return new Response(
        JSON.stringify({ error: "gmail_send_failed", status: gmailRes.status, detail: errBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await gmailRes.json();
    return new Response(JSON.stringify({ ok: true, message_id: result?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-new-lead error", err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
