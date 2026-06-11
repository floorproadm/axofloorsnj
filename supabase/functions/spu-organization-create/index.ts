// Platform Admin: create organization + invite owner via magic link email
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
    const name = String(body?.name ?? "").trim();
    const owner_email = String(body?.owner_email ?? "").trim().toLowerCase();
    const plan = String(body?.plan ?? "starter");
    const origin = String(body?.origin ?? "").replace(/\/$/, "");

    if (name.length < 2) return json({ error: "invalid_name" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner_email)) return json({ error: "invalid_email" }, 400);
    if (!["starter", "pro", "enterprise"].includes(plan)) return json({ error: "invalid_plan" }, 400);

    // 1. Create org via RPC (platform_admin verified inside)
    const { data: orgData, error: orgErr } = await admin.rpc("spu_organization_create", {
      p_name: name,
      p_owner_email: owner_email,
      p_plan: plan,
      p_trial_days: 14,
    });
    if (orgErr) throw orgErr;
    const org_id = (orgData as any)?.org_id as string;
    if (!org_id) throw new Error("org_create_failed");

    // 2. Find or invite the owner user
    let ownerUserId: string | null = null;
    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = existing?.users?.find((u) => (u.email ?? "").toLowerCase() === owner_email);

    const redirectTo = origin ? `${origin}/admin/auth` : undefined;

    if (found) {
      ownerUserId = found.id;
      // already exists → send recovery link so they can set password and onboard
      const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: owner_email,
        options: redirectTo ? { redirectTo } : undefined,
      });
      if (linkErr) console.error("recovery link error", linkErr);
      var action_link = link?.properties?.action_link;
    } else {
      const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(owner_email, {
        data: { organization_id: org_id, role: "owner", full_name: name + " Owner" },
        redirectTo,
      });
      if (invErr) throw invErr;
      ownerUserId = invited?.user?.id ?? null;
      var action_link: string | undefined = undefined;
    }

    // 3. Link owner to org as 'owner' (idempotent)
    if (ownerUserId) {
      const { error: memErr } = await admin.from("organization_members").upsert(
        { user_id: ownerUserId, organization_id: org_id, role: "owner" },
        { onConflict: "user_id,organization_id" }
      );
      if (memErr) console.error("member upsert error", memErr);

      // Ensure profile row exists with the org_id set
      await admin.from("profiles").upsert(
        { id: ownerUserId, email: owner_email, organization_id: org_id },
        { onConflict: "id" }
      );
    }

    // Best-effort audit log
    try {
      await admin.from("audit_log").insert({
        user_id: callerId,
        user_role: "platform_admin",
        operation_type: "SPU_ORG_CREATE",
        table_accessed: "organizations",
        data_classification: JSON.stringify({ org_id, owner_email, plan }),
      });
    } catch (_) {}

    return json({ ok: true, org_id, owner_user_id: ownerUserId, action_link }, 200);
  } catch (e) {
    console.error("spu-organization-create error:", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(b: unknown, status: number) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
