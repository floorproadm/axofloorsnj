import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// RFC 2047 encoded-word for non-ASCII header values (Subject, From name, etc.)
function encodeHeader(value: string): string {
  if (/^[\x00-\x7F]*$/.test(value)) return value; // ASCII-only → no encoding needed
  const b64 = btoa(unescape(encodeURIComponent(value)));
  return `=?UTF-8?B?${b64}?=`;
}

function createRawEmail(to: string, subject: string, htmlBody: string, from?: string, replyTo?: string): string {
  const fromAddr = from || "AXO Floors <axofloorsnj@gmail.com>";
  // Encode the display-name portion of From if non-ASCII (keep the <email> intact)
  const fromEncoded = fromAddr.replace(/^(.+?)\s*<(.+)>$/, (_m, name, addr) => `${encodeHeader(name.trim())} <${addr}>`);
  const messageId = `<${crypto.randomUUID()}@axofloorsnj.com>`;
  const date = new Date().toUTCString().replace(/GMT$/, '+0000');

  const lines = [
    `From: ${fromEncoded}`,
    `To: ${to}`,
    `Reply-To: ${replyTo || 'axofloorsnj@gmail.com'}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${date}`,
    `Message-ID: ${messageId}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    htmlBody,
  ];
  const raw = lines.join('\r\n');
  return btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const DEFAULT_EMAIL_LOGO = "https://dcfmrqrbsfxvqhihpamd.supabase.co/storage/v1/object/public/feed-media/brand/axo-logo-email.png?v=2";

function wrapHtml(content: string, logoUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;line-height:1.6;margin:0;padding:0}
.container{max-width:600px;margin:0 auto;padding:32px 24px}
.header{text-align:center;padding:24px 0;border-bottom:2px solid #8B6914}
.header img{max-height:56px;width:auto;display:inline-block}
.content{padding:24px 0}
.btn{display:inline-block;background:#8B6914;color:#fff!important;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;margin:16px 0}
.footer{border-top:1px solid #eee;padding-top:16px;text-align:center;font-size:12px;color:#999}
</style></head><body><div class="container">
<div class="header"><img src="${logoUrl}" alt="AXO Floors" /></div>
<div class="content">${content}</div>
<div class="footer">AXO Floors · New Jersey · (732) 351-8653<br>axofloorsnj@gmail.com</div>
</div></body></html>`;
}

// Interpolate {{variable}} placeholders in a template string
function interpolate(tpl: string, data: Record<string, any>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = data[key];
    return val !== undefined && val !== null ? String(val) : '';
  });
}

// Hardcoded fallback templates (used if DB has no entry)
const FALLBACK_TEMPLATES: Record<string, { subject: string; body: string }> = {
  lead_followup: {
    subject: "Thanks for reaching out – AXO Floors",
    body: '<h2>Hi {{name}},</h2><p>Thank you for reaching out to AXO Floors! We received your inquiry about <strong>{{services}}</strong> and we\'re excited to help.</p><p>Our team will review your request and get back to you within 24 hours.</p><p style="text-align:center"><a class="btn" href="{{cta_link}}">Schedule a Free Consultation</a></p><p>Best regards,<br><strong>AXO Floors Team</strong></p>',
  },
  proposal_sent: {
    subject: "Your AXO Floors Proposal is Ready – #{{proposal_number}}",
    body: '<h2>Hi {{customer_name}},</h2><p>Your proposal is ready.</p><p><strong>Proposal #{{proposal_number}}</strong> — Total: <strong>${{total}}</strong></p><p style="text-align:center"><a class="btn" href="{{proposal_link}}">View Your Proposal</a></p><p>Best,<br><strong>AXO Floors Team</strong></p>',
  },
  appointment_confirmed: {
    subject: "Your appointment is confirmed – AXO Floors",
    body: '<h2>Hi {{name}},</h2><p>Your appointment is <strong style="color:#16a34a">confirmed</strong>!</p><p>📅 {{date}} at {{time}}</p><p>📍 {{address}}</p><p>See you soon!<br><strong>AXO Floors Team</strong></p>',
  },
  project_started: {
    subject: "Your project has started – AXO Floors",
    body: '<h2>Hi {{customer_name}},</h2><p>Your flooring project has officially <strong>started</strong>! 🎉</p><p>📍 {{address}}</p><p>Best,<br><strong>AXO Floors Team</strong></p>',
  },
  project_completed: {
    subject: "Your project is complete! – AXO Floors",
    body: '<h2>Hi {{customer_name}},</h2><p>Your project is <strong style="color:#16a34a">complete</strong>! ✨</p><p style="text-align:center"><a class="btn" href="{{review_link}}">Leave a Review</a></p><p>Thank you!<br><strong>The AXO Floors Team</strong></p>',
  },
  invoice_sent: {
    subject: "Invoice #{{invoice_number}} from AXO Floors – ${{amount}} due",
    body: '<h2>Hi {{customer_name}},</h2><p>Invoice #{{invoice_number}} — Amount Due: <strong>${{amount}}</strong></p><p style="text-align:center"><a class="btn" href="{{invoice_link}}">View & Pay Invoice</a></p><p>Thank you,<br><strong>AXO Floors Team</strong></p>',
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
    const orgId = organization_id || "a0000000-0000-0000-0000-000000000001";

    if (!template) {
      return new Response(JSON.stringify({ error: "template required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!data?.recipient_email) {
      return new Response(JSON.stringify({ error: "recipient_email required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Resolve template (raw passthrough or DB/fallback)
    let subjectTpl: string;
    let bodyTpl: string;

    if (template === "__raw__") {
      // Direct subject/body from automation engine
      subjectTpl = data.raw_subject || "Message from AXO Floors";
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

    // 2. Resolve email logo (from company_settings, with fallback)
    const { data: settingsRow } = await supabase
      .from("company_settings")
      .select("email_logo_url")
      .eq("organization_id", orgId)
      .maybeSingle();
    const logoUrl = (settingsRow as any)?.email_logo_url || DEFAULT_EMAIL_LOGO;

    // 3. Interpolate + wrap
    const subject = interpolate(subjectTpl, data);
    const html = wrapHtml(interpolate(bodyTpl, data), logoUrl);
    const raw = createRawEmail(data.recipient_email, subject, html);

    // 3. Send via Gmail
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
