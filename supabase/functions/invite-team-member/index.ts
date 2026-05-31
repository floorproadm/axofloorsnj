import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Valid app_role values (must match the public.app_role enum)
const VALID_ROLES = ["admin", "manager", "salesperson", "installer", "sander", "sander_installer", "accountant", "moderator"] as const;
type AppRole = (typeof VALID_ROLES)[number];

// Map app_role -> org_member_role
function mapToOrgMemberRole(role: AppRole | null): "owner" | "admin" | "collaborator" {
  if (role === "admin" || role === "manager") return "admin";
  return "collaborator";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: authError,
    } = await anonClient.auth.getUser();

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await anonClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Acesso restrito a administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, full_name, role } = await req.json();

    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: "Email e nome são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate role (null is allowed — collaborator with no special role)
    let validatedRole: AppRole | null = null;
    if (role) {
      if (!VALID_ROLES.includes(role)) {
        return new Response(
          JSON.stringify({ error: `Role inválido. Valores aceitos: ${VALID_ROLES.join(", ")}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      validatedRole = role as AppRole;
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Discover caller's organization to also enroll the new user there
    const { data: callerOrg } = await adminClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", caller.id)
      .maybeSingle();

    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { full_name },
      });

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = inviteData.user.id;
    const warnings: string[] = [];

    // Insert app role
    if (validatedRole) {
      const { error: roleError } = await adminClient
        .from("user_roles")
        .insert({ user_id: newUserId, role: validatedRole });
      if (roleError) {
        console.error("Role insert error:", roleError);
        warnings.push(`Role não atribuída: ${roleError.message}`);
      }
    }

    // Insert organization membership
    if (callerOrg?.organization_id) {
      const orgRole = mapToOrgMemberRole(validatedRole);
      const { error: orgError } = await adminClient
        .from("organization_members")
        .insert({
          user_id: newUserId,
          organization_id: callerOrg.organization_id,
          role: orgRole,
        });
      if (orgError) {
        console.error("Org membership insert error:", orgError);
        warnings.push(`Membership da organização não criada: ${orgError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        ...(warnings.length ? { warning: warnings.join(" | ") } : {}),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("invite-team-member error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
