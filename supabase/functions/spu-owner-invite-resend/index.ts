// Resend owner invite for an organization (platform admin only)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "invalid_auth" }, 401);
    const callerId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "platform_admin",
    });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const org_id = String(body?.org_id ?? "").trim();
    if (!org_id) return json({ error: "missing_org_id" }, 400);

    // 1. Get org
    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .select("id, name")
      .eq("id", org_id)
      .single();
    if (orgErr || !org) return json({ error: "org_not_found" }, 404);

    // 2. Get owner email
    let ownerEmail: string | null = null;
    let ownerUserId: string | null = null;

    const { data: ownerMember } = await admin
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", org_id)
      .eq("role", "owner")
      .maybeSingle();

    if (ownerMember?.user_id) {
      const { data: profile } = await admin
        .from("profiles")
        .select("email")
        .eq("id", ownerMember.user_id)
        .maybeSingle();
      ownerEmail = profile?.email ?? null;
      ownerUserId = ownerMember.user_id;
    }

    if (!ownerEmail) {
      return json({ error: "owner_email_not_found" }, 404);
    }

    const redirectTo = body?.origin ? `${body.origin}/admin/auth` : undefined;

    // 3. Check if user exists
    const { data: userList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = userList?.users?.find(
      (u) => (u.email ?? "").toLowerCase() === ownerEmail.toLowerCase()
    );

    let action_link: string | undefined;

    if (found) {
      ownerUserId = found.id;
      const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: ownerEmail,
        options: redirectTo ? { redirectTo } : undefined,
      });
      if (linkErr) throw linkErr;
      action_link = link?.properties?.action_link;
    } else {
      const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(ownerEmail, {
        data: { organization_id: org_id, role: "owner", full_name: org.name + " Owner" },
        redirectTo,
      });
      if (invErr) throw invErr;
      ownerUserId = invited?.user?.id ?? null;
    }

    // 4. Ensure membership + profile
    if (ownerUserId) {
      await admin.from("organization_members").upsert(
        { user_id: ownerUserId, organization_id: org_id, role: "owner" },
        { onConflict: "user_id,organization_id" }
      );
      await admin.from("profiles").upsert(
        { id: ownerUserId, email: ownerEmail, organization_id: org_id },
        { onConflict: "id" }
      );
    }

    return json({ ok: true, action_link, owner_email: ownerEmail }, 200);
  } catch (e) {
    console.error("spu-owner-invite-resend error:", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(b: unknown, status: number) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
