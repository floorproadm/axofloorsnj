import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_FOLDERS = ["before_after", "job_progress"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    // --- Auth: validate JWT via getClaims ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = claimsData.claims.sub as string;

    // --- Parse multipart form data ---
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return jsonResponse({ error: "Request must be multipart/form-data" }, 400);
    }
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;
    const folderType = (formData.get("folderType") as string) || "job_progress";
    const metadataRaw = formData.get("metadata") as string | null;

    // --- Validate inputs ---
    if (!file) {
      return jsonResponse({ error: "File is required" }, 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      return jsonResponse({ error: "File too large. Maximum 10MB" }, 400);
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return jsonResponse(
        { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}` },
        400
      );
    }
    if (!projectId || !UUID_REGEX.test(projectId)) {
      return jsonResponse({ error: "Valid projectId (UUID) is required" }, 400);
    }
    if (!ALLOWED_FOLDERS.includes(folderType)) {
      return jsonResponse(
        { error: `Invalid folderType. Allowed: ${ALLOWED_FOLDERS.join(", ")}` },
        400
      );
    }

    let metadata: Record<string, unknown> = {};
    if (metadataRaw) {
      try {
        metadata = JSON.parse(metadataRaw);
      } catch {
        return jsonResponse({ error: "Invalid metadata JSON" }, 400);
      }
    }

    // --- Service role client ---
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // --- Check project membership ---
    const { data: membership, error: memberError } = await serviceClient
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (memberError) {
      console.error("Membership check error:", memberError);
      return jsonResponse({ error: "Internal server error" }, 500);
    }
    if (!membership) {
      return jsonResponse({ error: "Forbidden: not a member of this project" }, 403);
    }

    // --- Build storage path ---
    const ext = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const storagePath = `projects/${projectId}/${folderType}/${timestamp}-${random}.${ext}`;

    // --- Upload via service role ---
    const { error: uploadError } = await serviceClient.storage
      .from("media")
      .upload(storagePath, file, { contentType: file.type });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return jsonResponse({ error: "Failed to upload file" }, 500);
    }

    // --- Insert media_files record ---
    const { data: record, error: dbError } = await serviceClient
      .from("media_files")
      .insert({
        project_id: projectId,
        uploaded_by: userId,
        uploaded_by_role: "collaborator",
        source_type: "collaborator",
        visibility: "internal",
        folder_type: folderType,
        file_type: "image",
        storage_path: storagePath,
        metadata,
      })
      .select("id, storage_path, created_at")
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      // Cleanup: remove uploaded file
      await serviceClient.storage.from("media").remove([storagePath]);
      return jsonResponse({ error: "Failed to save file record" }, 500);
    }

    return jsonResponse(record as Record<string, unknown>, 201);
  } catch (err) {
    console.error("Unexpected error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
