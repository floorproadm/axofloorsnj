// Shared auth helper for edge functions.
// Authorizes a request via EITHER:
//   - x-edge-webhook-secret header matching the value in DB vault (set by trigger calls), OR
//   - a valid user JWT (optionally restricted to admin/manager/owner/platform_admin roles).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_ROLES = new Set(["admin", "manager", "owner", "platform_admin"]);

let cachedWebhookSecret: string | null = null;

async function getWebhookSecret(): Promise<string | null> {
  if (cachedWebhookSecret) return cachedWebhookSecret;
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await sb.rpc("_get_edge_webhook_secret" as any);
    if (error || !data) return null;
    cachedWebhookSecret = data as string;
    return cachedWebhookSecret;
  } catch {
    return null;
  }
}

export type AuthOptions = {
  /** Require admin/manager/owner/platform_admin role on user JWT. Webhook secret bypasses this. */
  requireAdmin?: boolean;
  /** Accept the x-edge-webhook-secret header (default true). */
  allowWebhookSecret?: boolean;
  /** Accept any valid user JWT (default true). */
  allowUserJwt?: boolean;
};

export async function authorize(
  req: Request,
  opts: AuthOptions = {},
): Promise<{ ok: true; userId?: string } | { ok: false; status: number; reason: string }> {
  const { requireAdmin = false, allowWebhookSecret = true, allowUserJwt = true } = opts;

  // 1) Webhook secret path (trusted server-to-server / DB trigger).
  if (allowWebhookSecret) {
    const supplied = req.headers.get("x-edge-webhook-secret");
    if (supplied) {
      const expected = await getWebhookSecret();
      if (expected && supplied === expected) return { ok: true };
    }
  }

  // 2) JWT path.
  if (allowUserJwt) {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data, error } = await sb.auth.getUser(token);
      if (!error && data?.user) {
        if (!requireAdmin) return { ok: true, userId: data.user.id };
        const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: roleRows } = await svc
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);
        const isAdmin = (roleRows ?? []).some((r: any) => ADMIN_ROLES.has(r.role));
        if (isAdmin) return { ok: true, userId: data.user.id };
        return { ok: false, status: 403, reason: "forbidden" };
      }
    }
  }

  return { ok: false, status: 401, reason: "unauthorized" };
}

export function unauthorized(reason: string, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: reason }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
