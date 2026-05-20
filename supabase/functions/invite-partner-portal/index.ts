import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate caller is an authenticated admin
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await userClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { partner_id, email, redirect_origin } = await req.json();
    if (!partner_id || !email) {
      return new Response(JSON.stringify({ error: "partner_id and email required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const callerId = userData.user.id;

    const logInvite = async (params: {
      organization_id: string;
      partner_id: string;
      recipient_email: string;
      invite_kind: string;
      status: "sent" | "error";
      link_id?: string | null;
      error_message?: string | null;
    }) => {
      try {
        await admin.from("partner_invite_logs").insert({
          organization_id: params.organization_id,
          partner_id: params.partner_id,
          recipient_email: params.recipient_email,
          invite_kind: params.invite_kind,
          status: params.status,
          link_id: params.link_id ?? null,
          error_message: params.error_message ?? null,
          sent_by: callerId,
        });
      } catch (logErr) {
        console.error("Failed to write partner_invite_logs:", logErr);
      }
    };

    // Get partner data
    const { data: partner } = await admin
      .from("partners")
      .select("contact_name, company_name, organization_id")
      .eq("id", partner_id)
      .maybeSingle();
    if (!partner) {
      return new Response(JSON.stringify({ error: "Partner not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if partner already has portal access
    const { data: existingLink } = await admin
      .from("partner_users")
      .select("user_id")
      .eq("partner_id", partner_id)
      .maybeSingle();

    // Always use the production custom domain — never the Lovable preview URL.
    // This guarantees the email link looks branded (axofloorsnj.com) regardless
    // of where the admin is calling from (preview, staging, etc.).
    const PROD_ORIGIN = "https://axofloorsnj.com";
    const origin = PROD_ORIGIN;
    const redirectTo = `${origin}/partner/welcome`;

    let actionLink: string;
    let isResend = false;

    if (existingLink) {
      // Resend → magic link (lets them in to reset password)
      isResend = true;
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });
      if (linkErr) throw linkErr;
      actionLink = linkData.properties!.action_link;
    } else {
      // New invite → creates the auth user and returns link
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: { redirectTo },
      });
      if (linkErr) throw linkErr;
      actionLink = linkData.properties!.action_link;

      // Link partner_user
      const userId = linkData.user!.id;
      const { error: linkPartnerErr } = await admin.rpc("link_partner_user", {
        p_partner_id: partner_id,
        p_user_id: userId,
      });
      if (linkPartnerErr) {
        console.error("link_partner_user failed:", linkPartnerErr);
        throw new Error(`Failed to link partner: ${linkPartnerErr.message}`);
      }
    }

    // Send branded email via gmail-send
    const firstName = (partner.contact_name || partner.company_name || "Partner").split(" ")[0];
    const subject = isResend
      ? "Your AXO Floors Partner Portal access link"
      : "You're invited to the AXO Floors Partner Portal";

    const ctaLabel = isResend ? "Open Partner Portal →" : "Activate My Account →";

    // Shared styles — body is wrapped by gmail-send (AXO brand header in #8B6914 gold)
    const heroCard = `background:linear-gradient(135deg,#8B6914 0%,#a07a1a 100%);color:#fff;border-radius:8px;padding:24px;margin:0 0 24px;text-align:center`;
    const bulletList = `list-style:none;padding:0;margin:0 0 24px`;
    const bulletItem = `padding:10px 0;border-bottom:1px solid #eee;font-size:14px`;
    const supportBox = `background:#faf6ed;border-left:3px solid #8B6914;padding:14px 18px;margin:24px 0 16px;border-radius:4px;font-size:13px;color:#555`;
    const expiryNote = `font-size:12px;color:#999;text-align:center;margin:8px 0 24px`;

    const heroBlock = isResend
      ? `<div style="${heroCard}">
           <div style="font-size:13px;letter-spacing:1px;text-transform:uppercase;opacity:.85">Partner Portal</div>
           <div style="font-size:20px;font-weight:600;margin-top:4px">Your secure access link</div>
         </div>`
      : `<div style="${heroCard}">
           <div style="font-size:13px;letter-spacing:1px;text-transform:uppercase;opacity:.85">You're invited</div>
           <div style="font-size:22px;font-weight:600;margin-top:6px">Welcome to the<br/>AXO Floors Partner Network</div>
         </div>`;

    const introCopy = isResend
      ? `<p style="font-size:15px">Here's a fresh, secure sign-in link for your Partner Portal. It will log you in instantly — no password required this time.</p>
         <p style="font-size:14px;color:#555">Once inside, you can <strong>update your password</strong> under your profile if you'd like.</p>`
      : `<p style="font-size:15px">You've been added to the <strong>AXO Floors Partner Network</strong>. Your personal portal is ready — it's where you'll send referrals, track every lead's progress, and watch your commissions grow in real time.</p>
         <p style="font-size:14px;color:#555">Click the button below to <strong>activate your account</strong> and choose your password. Takes 30 seconds.</p>`;

    const benefitsBlock = isResend
      ? ``
      : `<p style="font-weight:600;margin:24px 0 8px;color:#333">Inside your portal you can:</p>
         <ul style="${bulletList}">
           <li style="${bulletItem}"><span style="color:#8B6914;font-weight:700">✓</span> &nbsp; Submit a new referral in under a minute</li>
           <li style="${bulletItem}"><span style="color:#8B6914;font-weight:700">✓</span> &nbsp; See live status of every lead you sent us</li>
           <li style="${bulletItem}"><span style="color:#8B6914;font-weight:700">✓</span> &nbsp; Track commissions earned and paid</li>
           <li style="${bulletItem}"><span style="color:#8B6914;font-weight:700">✓</span> &nbsp; Update your contact info anytime</li>
         </ul>`;

    const body = `
      <h2 style="margin:0 0 16px">Hi ${firstName},</h2>
      ${heroBlock}
      ${introCopy}
      <p style="text-align:center;margin:28px 0 8px">
        <a class="btn" href="${actionLink}">${ctaLabel}</a>
      </p>
      <p style="${expiryNote}">🔒 Secure link — expires in 24 hours, single-use</p>
      ${benefitsBlock}
      <div style="${supportBox}">
        <strong style="color:#333">Need help?</strong><br/>
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${actionLink}" style="color:#8B6914;word-break:break-all;font-size:12px">${actionLink}</a>
        <br/><br/>
        Questions about the partnership? Reach us directly:<br/>
        📞 <a href="tel:+17323518653" style="color:#8B6914;text-decoration:none">(732) 351-8653</a> &nbsp;·&nbsp; ✉️ <a href="mailto:axofloorsnj@gmail.com" style="color:#8B6914;text-decoration:none">axofloorsnj@gmail.com</a>
      </div>
      <p style="font-size:14px;margin-top:24px">Welcome aboard,<br/><strong>The AXO Floors Team</strong></p>
      <p style="font-size:11px;color:#aaa;margin-top:20px">If you weren't expecting this invitation, you can safely ignore this email — no account will be activated until you click the button above.</p>
    `;


    const sendRes = await admin.functions.invoke("gmail-send", {
      body: {
        template: "__raw__",
        organization_id: partner.organization_id,
        data: {
          recipient_email: email,
          raw_subject: subject,
          raw_body: body,
          related_id: partner_id,
          related_type: "partner_invite",
        },
      },
    });

    // Short link ID for log (token fragment from action_link)
    const linkId = (() => {
      try {
        const u = new URL(actionLink);
        const tok = u.searchParams.get("token") || u.searchParams.get("token_hash") || "";
        return tok ? tok.slice(0, 12) : actionLink.slice(-12);
      } catch {
        return null;
      }
    })();

    if (sendRes.error) {
      console.error("gmail-send error:", sendRes.error);
      await logInvite({
        organization_id: partner.organization_id,
        partner_id,
        recipient_email: email,
        invite_kind: isResend ? "magiclink" : "invite",
        status: "error",
        link_id: linkId,
        error_message: sendRes.error.message || "gmail-send failed",
      });
      throw new Error(`Failed to send email: ${sendRes.error.message}`);
    }

    await logInvite({
      organization_id: partner.organization_id,
      partner_id,
      recipient_email: email,
      invite_kind: isResend ? "magiclink" : "invite",
      status: "sent",
      link_id: linkId,
    });

    return new Response(
      JSON.stringify({ success: true, resent: isResend, email, link_id: linkId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("invite-partner-portal error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
