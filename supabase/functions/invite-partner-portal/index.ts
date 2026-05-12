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

    const origin = redirect_origin || "https://axofloorsnj.com";
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
      : "Welcome to the AXO Floors Partner Portal";

    const intro = isResend
      ? `<p>Here's a fresh secure link to access your Partner Portal. Click it to sign in — once you're in, you can set a new password under your profile.</p>`
      : `<p>You've been invited to the <strong>AXO Floors Partner Portal</strong>, where you can send referrals, track your pipeline, and see commissions earned in real time.</p><p>Click the button below to activate your account and set your password.</p>`;

    const body = `
      <h2>Hi ${firstName},</h2>
      ${intro}
      <p style="text-align:center"><a class="btn" href="${actionLink}">${isResend ? "Open Partner Portal" : "Activate My Account"}</a></p>
      <p style="font-size:12px;color:#777">This link expires in 24 hours and can only be used once. If you didn't expect this email, you can safely ignore it.</p>
      <p>Welcome aboard,<br><strong>AXO Floors Team</strong></p>
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

    if (sendRes.error) {
      console.error("gmail-send error:", sendRes.error);
      throw new Error(`Failed to send email: ${sendRes.error.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, resent: isResend, email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("invite-partner-portal error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
