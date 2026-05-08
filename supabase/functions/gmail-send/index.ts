import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function createRawEmail(to: string, subject: string, htmlBody: string, from?: string): string {
  const lines = [
    `From: ${from || "AXO Floors <axofloorsnj@gmail.com>"}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    htmlBody,
  ];
  const raw = lines.join('\r\n');
  return btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function wrapHtml(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;line-height:1.6;margin:0;padding:0}
.container{max-width:600px;margin:0 auto;padding:32px 24px}
.header{text-align:center;padding:24px 0;border-bottom:2px solid #8B6914}
.header h1{color:#8B6914;font-size:24px;margin:0}
.content{padding:24px 0}
.btn{display:inline-block;background:#8B6914;color:#fff!important;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;margin:16px 0}
.footer{border-top:1px solid #eee;padding-top:16px;text-align:center;font-size:12px;color:#999}
</style></head><body><div class="container">
<div class="header"><h1>AXO Floors</h1></div>
<div class="content">${content}</div>
<div class="footer">AXO Floors · New Jersey · (732) 351-8653<br>axofloorsnj@gmail.com</div>
</div></body></html>`;
}

// Email templates
const TEMPLATES: Record<string, (data: any) => { subject: string; html: string }> = {
  lead_followup: (d) => ({
    subject: "Thanks for reaching out – AXO Floors",
    html: wrapHtml(`
      <h2>Hi ${d.name},</h2>
      <p>Thank you for reaching out to AXO Floors! We received your inquiry${d.services ? ` about <strong>${d.services}</strong>` : ''} and we're excited to help.</p>
      <p>Our team will review your request and get back to you within 24 hours. In the meantime, you can schedule a consultation at your convenience:</p>
      <p style="text-align:center"><a class="btn" href="https://axofloorsnj.com/floor-diagnostic">Schedule a Free Consultation</a></p>
      <p>We look forward to transforming your floors!</p>
      <p>Best regards,<br><strong>AXO Floors Team</strong></p>
    `),
  }),

  proposal_sent: (d) => ({
    subject: `Your AXO Floors Proposal is Ready – #${d.proposal_number}`,
    html: wrapHtml(`
      <h2>Hi ${d.customer_name},</h2>
      <p>Great news! Your personalized proposal from AXO Floors is ready for review.</p>
      <p><strong>Proposal #${d.proposal_number}</strong></p>
      ${d.total ? `<p>Total: <strong>$${Number(d.total).toLocaleString()}</strong></p>` : ''}
      ${d.valid_until ? `<p>Valid until: ${d.valid_until}</p>` : ''}
      <p style="text-align:center"><a class="btn" href="${d.proposal_link}">View Your Proposal</a></p>
      <p>You can review the details, select your preferred option, and sign digitally — all online.</p>
      <p>Questions? Call us at (732) 351-8653.</p>
      <p>Best,<br><strong>AXO Floors Team</strong></p>
    `),
  }),

  appointment_confirmed: (d) => ({
    subject: "Your appointment is confirmed – AXO Floors",
    html: wrapHtml(`
      <h2>Hi ${d.name},</h2>
      <p>Your appointment with AXO Floors has been <strong style="color:#16a34a">confirmed</strong>!</p>
      <p><strong>📅 Date:</strong> ${d.date}<br>
      <strong>🕐 Time:</strong> ${d.time}</p>
      ${d.address ? `<p><strong>📍 Location:</strong> ${d.address}</p>` : ''}
      <h3>How to Prepare:</h3>
      <ul>
        <li>Clear furniture from the area if possible</li>
        <li>Note any specific concerns or areas of focus</li>
        <li>Have photos of inspiration styles ready (optional)</li>
      </ul>
      <p>Need to reschedule? Call us at <strong>(732) 351-8653</strong>.</p>
      <p>See you soon!<br><strong>AXO Floors Team</strong></p>
    `),
  }),

  project_started: (d) => ({
    subject: "Your project has started – AXO Floors",
    html: wrapHtml(`
      <h2>Hi ${d.customer_name},</h2>
      <p>We're excited to let you know that your flooring project has officially <strong>started</strong>! 🎉</p>
      ${d.address ? `<p><strong>📍 Project location:</strong> ${d.address}</p>` : ''}
      <p><strong>What's next:</strong></p>
      <ul>
        <li>Our crew is on-site working on your floors</li>
        <li>We'll keep you updated on progress</li>
        <li>Estimated timeline will be shared by your project manager</li>
      </ul>
      <p>Questions? Call us at (732) 351-8653.</p>
      <p>Best,<br><strong>AXO Floors Team</strong></p>
    `),
  }),

  project_completed: (d) => ({
    subject: "Your project is complete! – AXO Floors",
    html: wrapHtml(`
      <h2>Hi ${d.customer_name},</h2>
      <p>Your flooring project is now <strong style="color:#16a34a">complete</strong>! ✨</p>
      ${d.address ? `<p><strong>📍 Location:</strong> ${d.address}</p>` : ''}
      <p>We hope you love your new floors! Here's what comes next:</p>
      <ul>
        <li>Final walkthrough and any touch-ups if needed</li>
        <li>Care instructions for your new floors</li>
        <li>We'd love your feedback — a review helps us a lot!</li>
      </ul>
      <p style="text-align:center"><a class="btn" href="https://axofloorsnj.com/review-request">Leave a Review</a></p>
      <p>Thank you for choosing AXO Floors!<br><strong>The AXO Floors Team</strong></p>
    `),
  }),

  invoice_sent: (d) => ({
    subject: `Invoice #${d.invoice_number} from AXO Floors – $${Number(d.amount).toLocaleString()} due`,
    html: wrapHtml(`
      <h2>Hi ${d.customer_name},</h2>
      <p>Here is your invoice from AXO Floors:</p>
      <p><strong>Invoice #${d.invoice_number}</strong><br>
      Amount Due: <strong>$${Number(d.amount).toLocaleString()}</strong>
      ${d.due_date ? `<br>Due: ${d.due_date}` : ''}</p>
      <p style="text-align:center"><a class="btn" href="${d.invoice_link}">View & Pay Invoice</a></p>
      <p><strong>Payment Methods:</strong></p>
      <ul>
        <li>Online payment via the link above</li>
        <li>Check payable to AXO Floors</li>
        <li>Zelle to axofloorsnj@gmail.com</li>
      </ul>
      <p>Questions about this invoice? Call us at (732) 351-8653.</p>
      <p>Thank you,<br><strong>AXO Floors Team</strong></p>
    `),
  }),
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

    if (!template || !TEMPLATES[template]) {
      return new Response(JSON.stringify({ error: `Invalid template: ${template}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!data?.recipient_email) {
      return new Response(JSON.stringify({ error: "recipient_email required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = TEMPLATES[template](data);
    const raw = createRawEmail(data.recipient_email, subject, html);

    // Send via Gmail API gateway
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

    if (!gmailRes.ok) {
      // Log failure
      await supabase.from("email_logs").insert({
        organization_id: organization_id || "00000000-0000-0000-0000-000000000001",
        type: template,
        recipient: data.recipient_email,
        subject,
        body_preview: subject,
        status: "failed",
        error_message: JSON.stringify(gmailData),
        related_id: data.related_id || null,
        related_type: data.related_type || null,
      });

      throw new Error(`Gmail API error [${gmailRes.status}]: ${JSON.stringify(gmailData)}`);
    }

    // Log success
    await supabase.from("email_logs").insert({
      organization_id: organization_id || "00000000-0000-0000-0000-000000000001",
      type: template,
      recipient: data.recipient_email,
      subject,
      body_preview: subject,
      status: "sent",
      sent_at: new Date().toISOString(),
      related_id: data.related_id || null,
      related_type: data.related_type || null,
    });

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
