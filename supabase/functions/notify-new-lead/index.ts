import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { authorize, unauthorized } from "../_shared/auth.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const AXO_ORG_ID = "a0000000-0000-0000-0000-000000000001";

// Safe defaults preserve AXO behavior if company_settings is unreachable.
const DEFAULTS = {
  email: "axofloorsnj@gmail.com",
  phone: "(732) 351-8653",
  company_name: "AXO Floors",
  admin_base_url: "https://axofloorsnj.com/admin",
};

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function b64url(s: string): string {
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

  const auth = await authorize(req, { allowUserJwt: false });
  if (!auth.ok) return unauthorized(auth.reason, auth.status, corsHeaders);


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

    // Multi-tenant: resolve tenant branding from company_settings.
    const orgId = lead.organization_id || body?.organization_id || AXO_ORG_ID;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settingsRow } = await supabase
      .from("company_settings")
      .select("email, phone, company_name, admin_base_url, email_logo_url, email_from_name")
      .eq("organization_id", orgId)
      .maybeSingle();

    const settings = {
      email: settingsRow?.email || DEFAULTS.email,
      phone: settingsRow?.phone || DEFAULTS.phone,
      company_name: settingsRow?.company_name || DEFAULTS.company_name,
      admin_base_url: settingsRow?.admin_base_url || DEFAULTS.admin_base_url,
    };

    const followUp = lead.follow_up_actions ?? {};
    const serviceNeeded =
      followUp?.service_needed ??
      followUp?.serviceInterest ??
      lead.service_type ??
      null;
    const urgency = followUp?.urgency ?? null;
    const sourceLabel = formatSourceLabel(lead.lead_source);

    const subject = `🔔 New Lead: ${lead.name ?? "Unnamed"} (${sourceLabel})`;
    const adminLink = `${settings.admin_base_url}/leads?focus=${lead.id}`;

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
      <a href="${escapeHtml(adminLink)}" style="display:inline-block;padding:12px 28px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Open Lead in ${escapeHtml(settings.company_name)} OS →</a>
    </div>
    <div style="padding:16px 24px;text-align:center;color:#94a3b8;font-size:11px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      ${escapeHtml(settings.company_name)} · Automated lead notification
    </div>
  </div>
</body>
</html>`;

    const rfc2822 = [
      `To: ${settings.email}`,
      `From: ${settings.email}`,
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
