// Platform Admin user actions (reset password, disable/enable, impersonate)
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

    // Verify caller and platform_admin role
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

    const body = await req.json();
    const { user_id, action } = body as { user_id: string; action: string };
    if (!user_id || !action) return json({ error: "bad_request" }, 400);

    // Look up target user email
    const { data: target } = await admin.auth.admin.getUserById(user_id);
    if (!target?.user) return json({ error: "user_not_found" }, 404);
    const email = target.user.email;

    let result: Record<string, unknown> = { ok: true };

    if (action === "reset_password") {
      if (!email) return json({ error: "user_has_no_email" }, 400);
      const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
      });
      if (error) throw error;
      result.action_link = data?.properties?.action_link;
    } else if (action === "disable") {
      const { error } = await admin.auth.admin.updateUserById(user_id, {
        ban_duration: "876000h", // ~100 years
      });
      if (error) throw error;
    } else if (action === "enable") {
      const { error } = await admin.auth.admin.updateUserById(user_id, {
        ban_duration: "none",
      });
      if (error) throw error;
    } else if (action === "impersonate") {
      if (!email) return json({ error: "user_has_no_email" }, 400);
      if (user_id === callerId) return json({ error: "cannot_impersonate_self" }, 400);
      const { data, error } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      if (error) throw error;
      result.action_link = data?.properties?.action_link;
    } else {
      return json({ error: "unknown_action" }, 400);
    }

    // Best-effort audit log
    try {
      await admin.from("audit_log").insert({
        user_id: callerId,
        user_role: "platform_admin",
        operation_type: `SPU_USER_${action.toUpperCase()}`,
        table_accessed: "auth.users",
        data_classification: JSON.stringify({ target_user_id: user_id, email }),
      });
    } catch (_) { /* ignore */ }

    return json(result, 200);
  } catch (e) {
    console.error("spu-user-action error:", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(b: unknown, status: number) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
