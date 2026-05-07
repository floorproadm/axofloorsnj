import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const ORG_ID = "00000000-0000-0000-0000-000000000001";

    // Get messages from last 15 minutes that are unread replies
    const after = Math.floor((Date.now() - 15 * 60 * 1000) / 1000);
    const query = `is:unread after:${after} -from:me`;

    const listRes = await fetch(
      `${GATEWAY_URL}/users/me/messages?maxResults=20&q=${encodeURIComponent(query)}`,
      {
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
        },
      }
    );

    const listData = await listRes.json();
    if (!listRes.ok) {
      throw new Error(`Gmail list error [${listRes.status}]: ${JSON.stringify(listData)}`);
    }

    const messages = listData.messages || [];
    const tasksCreated: string[] = [];

    for (const msg of messages.slice(0, 10)) {
      // Get message details
      const detailRes = await fetch(
        `${GATEWAY_URL}/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
        {
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
          },
        }
      );
      const detail = await detailRes.json();
      if (!detailRes.ok) continue;

      const headers = detail.payload?.headers || [];
      const fromHeader = headers.find((h: any) => h.name === "From")?.value || "";
      const subjectHeader = headers.find((h: any) => h.name === "Subject")?.value || "No subject";

      // Extract email from "Name <email>" format
      const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
      const senderEmail = (emailMatch[1] || fromHeader).trim().toLowerCase();
      const senderName = fromHeader.replace(/<[^>]+>/, "").replace(/"/g, "").trim() || senderEmail;

      if (!senderEmail) continue;

      // Check if sender is a known lead or customer
      const { data: leads } = await supabase
        .from("leads")
        .select("id, name")
        .ilike("email", senderEmail)
        .limit(1);

      const { data: customers } = await supabase
        .from("customers")
        .select("id, full_name")
        .ilike("email", senderEmail)
        .limit(1);

      const knownName = leads?.[0]?.name || customers?.[0]?.full_name || null;
      const relatedId = leads?.[0]?.id || customers?.[0]?.id || null;
      const relatedType = leads?.[0] ? "lead" : customers?.[0] ? "customer" : null;

      if (!knownName) continue; // Skip unknown senders

      // Check if we already created a task for this message
      const { data: existingTasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("description", `gmail_msg_id:${msg.id}`)
        .limit(1);

      if (existingTasks && existingTasks.length > 0) continue;

      // Create task
      await supabase.from("tasks").insert({
        title: `📩 Reply from ${knownName}`,
        description: `gmail_msg_id:${msg.id}`,
        status: "pending",
        priority: "high",
        organization_id: ORG_ID,
        related_lead_id: leads?.[0]?.id || null,
      });

      // Log it
      await supabase.from("email_logs").insert({
        organization_id: ORG_ID,
        type: "reply_detected",
        recipient: senderEmail,
        subject: subjectHeader,
        body_preview: `Reply from ${knownName}: ${subjectHeader}`,
        status: "sent",
        sent_at: new Date().toISOString(),
        related_id: relatedId,
        related_type: relatedType,
      });

      tasksCreated.push(knownName);
    }

    return new Response(JSON.stringify({
      success: true,
      messagesChecked: messages.length,
      tasksCreated: tasksCreated.length,
      names: tasksCreated,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("gmail-monitor error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
