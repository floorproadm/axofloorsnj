import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { authorize } from "../_shared/auth.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const AXO_ORG_ID = "a0000000-0000-0000-0000-000000000001";

const DEFAULTS = {
  company_name: "AXO Floors",
  email_from_name: "AXO Floors",
  email: "axofloorsnj@gmail.com",
  phone: "(732) 351-8653",
  email_logo_url: "https://dcfmrqrbsfxvqhihpamd.supabase.co/storage/v1/object/public/feed-media/brand/axo-logo-email.png?v=2",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// RFC 2047 encoded-word for non-ASCII header values.
function encodeHeader(value: string): string {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  const b64 = btoa(unescape(encodeURIComponent(value)));
  return `=?UTF-8?B?${b64}?=`;
}

function domainFromEmail(email: string, fallback = "axofloorsnj.com"): string {
  const at = email.indexOf("@");
  if (at === -1 || at === email.length - 1) return fallback;
  return email.slice(at + 1);
}

interface TenantBrand {
  company_name: string;
  email_from_name: string;
  email: string;
  phone: string;
  email_logo_url: string;
}

function createRawEmail(
  to: string,
  subject: string,
  htmlBody: string,
  brand: TenantBrand,
  from?: string,
  replyTo?: string,
): string {
  const fromAddr = from || `${brand.email_from_name} <${brand.email}>`;
  const fromEncoded = fromAddr.replace(/^(.+?)\s*<(.+)>$/, (_m, name, addr) => `${encodeHeader(name.trim())} <${addr}>`);
  const messageId = `<${crypto.randomUUID()}@${domainFromEmail(brand.email)}>`;
  const date = new Date().toUTCString().replace(/GMT$/, '+0000');

  // Build plain-text alternative from HTML — improves deliverability (spam filters
  // strongly penalize HTML-only emails). Strip tags, decode common entities, collapse whitespace.
  const textBody = htmlBody
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/(p|div|h\d|li|tr)>/gi, '\n')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const boundary = `bnd_${crypto.randomUUID().replace(/-/g, '')}`;
  // List-Unsubscribe headers reduce spam scoring on Gmail/iCloud/Outlook.
  const unsubMail = `mailto:${brand.email}?subject=Unsubscribe`;
  const lines = [
    `From: ${fromEncoded}`,
    `To: ${to}`,
    `Reply-To: ${replyTo || brand.email}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${date}`,
    `Message-ID: ${messageId}`,
    `List-Unsubscribe: <${unsubMail}>`,
    'List-Unsubscribe-Post: List-Unsubscribe=One-Click',
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    textBody,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`,
    '',
  ];
  const raw = lines.join('\r\n');
  return btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function wrapHtml(content: string, brand: TenantBrand): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;line-height:1.6;margin:0;padding:0}
.container{max-width:600px;margin:0 auto;padding:32px 24px}
.header{text-align:center;padding:24px 0;border-bottom:2px solid #8B6914}
.header img{max-height:56px;width:auto;display:inline-block}
.content{padding:24px 0}
.btn{display:inline-block;background:#8B6914;color:#fff!important;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;margin:16px 0}
.footer{border-top:1px solid #eee;padding-top:16px;text-align:center;font-size:12px;color:#999}
</style></head><body><div class="container">
<div class="header"><img src="${brand.email_logo_url}" alt="${brand.company_name}" /></div>
<div class="content">${content}</div>
<div class="footer">${brand.company_name} · ${brand.phone} · ${brand.email}</div>
</div></body></html>`;
}

function interpolate(tpl: string, data: Record<string, any>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = data[key];
    return val !== undefined && val !== null ? String(val) : '';
  });
}

// Tenant-agnostic fallback templates. {{company_name}} is interpolated from settings.
const FALLBACK_TEMPLATES: Record<string, { subject: string; body: string }> = {
  lead_followup: {
    subject: "Thanks for reaching out – {{company_name}}",
    body: '<h2>Hi {{name}},</h2><p>Thank you for reaching out to {{company_name}}! We received your inquiry about <strong>{{services}}</strong> and we\'re excited to help.</p><p>Our team will review your request and get back to you within 24 hours.</p><p style="text-align:center"><a class="btn" href="{{cta_link}}">Schedule a Free Consultation</a></p><p>Best regards,<br><strong>{{company_name}} Team</strong></p>',
  },
  proposal_sent: {
    subject: "Your {{company_name}} Proposal is Ready – #{{proposal_number}}",
    body: '<h2>Hi {{customer_name}},</h2><p>Your proposal is ready.</p><p><strong>Proposal #{{proposal_number}}</strong> — Total: <strong>${{total}}</strong></p><p style="text-align:center"><a class="btn" href="{{proposal_link}}">View Your Proposal</a></p><p>Best,<br><strong>{{company_name}} Team</strong></p>',
  },
  appointment_confirmed: {
    subject: "Your appointment is confirmed – {{company_name}}",
    body: '<h2>Hi {{name}},</h2><p>Your appointment is <strong style="color:#16a34a">confirmed</strong>!</p><p>📅 {{date}} at {{time}}</p><p>📍 {{address}}</p><p>See you soon!<br><strong>{{company_name}} Team</strong></p>',
  },
  project_started: {
    subject: "Your project has started – {{company_name}}",
    body: '<h2>Hi {{customer_name}},</h2><p>Your flooring project has officially <strong>started</strong>! 🎉</p><p>📍 {{address}}</p><p>Best,<br><strong>{{company_name}} Team</strong></p>',
  },
  project_completed: {
    subject: "Your project is complete! – {{company_name}}",
    body: '<h2>Hi {{customer_name}},</h2><p>Your project is <strong style="color:#16a34a">complete</strong>! ✨</p><p style="text-align:center"><a class="btn" href="{{review_link}}">Leave a Review</a></p><p>Thank you!<br><strong>The {{company_name}} Team</strong></p>',
  },
  invoice_sent: {
    // Less spam-prone subject: no "$", no "due", no exclamation. iCloud/Gmail filters are sensitive to these.
    subject: "Your invoice {{invoice_number}} from {{company_name}}",
    body: '<h2>Hi {{customer_name}},</h2><p>Thanks for choosing {{company_name}}. Your invoice <strong>{{invoice_number}}</strong> is ready to review.</p><p>Amount: <strong>${{amount}}</strong></p><p style="text-align:center"><a class="btn" href="{{invoice_link}}">View invoice</a></p><p>Reply to this email if you have any questions.</p><p>Best,<br><strong>{{company_name}} Team</strong></p>',
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Require trusted server-to-server webhook secret or authenticated admin/manager/owner JWT.
  // Public lead flows must route through trusted server triggers, never call gmail-send directly.
  const auth = await authorize(req, { requireAdmin: true });
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.reason }), {
      status: auth.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    if (!GOOGLE_MAIL_API_KEY) throw new Error("GOOGLE_MAIL_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { template, data, organization_id } = await req.json();
    const orgId = organization_id || AXO_ORG_ID;

    if (!template) {
      return new Response(JSON.stringify({ error: "template required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Raw HTML email template is dangerous — restrict to webhook callers (DB triggers),
    // never user JWTs even with admin role.
    if (template === "__raw__" && !req.headers.get("x-edge-webhook-secret")) {
      return new Response(JSON.stringify({ error: "forbidden_template" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!data?.recipient_email) {
      return new Response(JSON.stringify({ error: "recipient_email required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve tenant brand (safe defaults if row missing).
    const { data: settingsRow } = await supabase
      .from("company_settings")
      .select("company_name, email, phone, email_logo_url, email_from_name")
      .eq("organization_id", orgId)
      .maybeSingle();

    const brand: TenantBrand = {
      company_name: settingsRow?.company_name || DEFAULTS.company_name,
      email_from_name:
        settingsRow?.email_from_name || settingsRow?.company_name || DEFAULTS.email_from_name,
      email: settingsRow?.email || DEFAULTS.email,
      phone: settingsRow?.phone || DEFAULTS.phone,
      email_logo_url: settingsRow?.email_logo_url || DEFAULTS.email_logo_url,
    };

    // Resolve template (raw passthrough or DB/fallback).
    let subjectTpl: string;
    let bodyTpl: string;

    if (template === "__raw__") {
      subjectTpl = data.raw_subject || `Message from ${brand.company_name}`;
      bodyTpl = data.raw_body || "";
    } else {
      const { data: dbTemplate } = await supabase
        .from("email_templates")
        .select("subject_template, body_template")
        .eq("organization_id", orgId)
        .eq("template_key", template)
        .maybeSingle();

      if (dbTemplate) {
        subjectTpl = dbTemplate.subject_template;
        bodyTpl = dbTemplate.body_template;
      } else if (FALLBACK_TEMPLATES[template]) {
        subjectTpl = FALLBACK_TEMPLATES[template].subject;
        bodyTpl = FALLBACK_TEMPLATES[template].body;
      } else {
        return new Response(JSON.stringify({ error: `Unknown template: ${template}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Interpolate with tenant context merged in.
    const interpolationData = { company_name: brand.company_name, ...data };
    const subject = interpolate(subjectTpl, interpolationData);
    const html = wrapHtml(interpolate(bodyTpl, interpolationData), brand);
    const raw = createRawEmail(data.recipient_email, subject, html, brand);

    const gmailRes = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    const gmailData = await gmailRes.json();

    const logEntry = {
      organization_id: orgId,
      type: template,
      recipient: data.recipient_email,
      subject,
      body_preview: subject,
      status: gmailRes.ok ? "sent" : "failed",
      sent_at: gmailRes.ok ? new Date().toISOString() : null,
      error_message: gmailRes.ok ? null : JSON.stringify(gmailData),
      related_id: data.related_id || null,
      related_type: data.related_type || null,
    };
    await supabase.from("email_logs").insert(logEntry);

    if (!gmailRes.ok) {
      throw new Error(`Gmail API error [${gmailRes.status}]: ${JSON.stringify(gmailData)}`);
    }

    return new Response(JSON.stringify({ success: true, messageId: gmailData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("gmail-send error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
