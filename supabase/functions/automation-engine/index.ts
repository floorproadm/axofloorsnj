import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all pending drip logs that are due
    const { data: pendingDrips, error: fetchErr } = await supabase
      .from("automation_drip_logs")
      .select(`
        id, enrollment_id, drip_id, organization_id, scheduled_at,
        automation_enrollments!inner(id, lead_id, sequence_id, status),
        automation_drips!inner(id, channel, subject, message_template, delay_days, delay_hours)
      `)
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .limit(50);

    if (fetchErr) throw fetchErr;
    if (!pendingDrips || pendingDrips.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;

    for (const log of pendingDrips) {
      const enrollment = log.automation_enrollments as any;
      const drip = log.automation_drips as any;

      // Skip if enrollment was cancelled
      if (enrollment.status !== "active") {
        await supabase
          .from("automation_drip_logs")
          .update({ status: "skipped", error_message: "Enrollment cancelled" })
          .eq("id", log.id);
        continue;
      }

      if (drip.channel === "sms" || drip.channel === "whatsapp") {
        await supabase
          .from("automation_drip_logs")
          .update({ status: "skipped", error_message: `${drip.channel} not implemented yet` })
          .eq("id", log.id);
        continue;
      }

      // Get lead data for variable interpolation
      const { data: lead } = await supabase
        .from("leads")
        .select("*")
        .eq("id", enrollment.lead_id)
        .single();

      if (!lead || !lead.email) {
        await supabase
          .from("automation_drip_logs")
          .update({ status: "failed", error_message: "Lead not found or no email" })
          .eq("id", log.id);
        failed++;
        continue;
      }

      // Get company name
      const { data: settings } = await supabase
        .from("company_settings")
        .select("company_name")
        .eq("organization_id", log.organization_id)
        .maybeSingle();

      const companyName = settings?.company_name || "AXO Floors";
      const nameParts = (lead.name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Interpolate variables
      const vars: Record<string, string> = {
        first_name: firstName,
        last_name: lastName,
        name: lead.name || "",
        company_name: companyName,
        salesperson_name: "AXO Floors Team",
        email: lead.email,
        phone: lead.phone || "",
        services: lead.service_interest || lead.notes || "",
      };

      const interpolate = (tpl: string) =>
        tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");

      const subject = interpolate(drip.subject || "Message from " + companyName);
      const body = interpolate(drip.message_template || "");

      // Call gmail-send edge function internally
      try {
        const gmailRes = await fetch(`${supabaseUrl}/functions/v1/gmail-send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            template: "__raw__",
            data: {
              recipient_email: lead.email,
              raw_subject: subject,
              raw_body: body,
              related_id: lead.id,
              related_type: "automation_drip",
            },
          }),
        });

        const gmailResult = await gmailRes.json();

        if (gmailRes.ok && gmailResult.success) {
          await supabase
            .from("automation_drip_logs")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", log.id);
          sent++;
        } else {
          await supabase
            .from("automation_drip_logs")
            .update({ status: "failed", error_message: gmailResult.error || "Unknown error" })
            .eq("id", log.id);
          failed++;
        }
      } catch (e) {
        await supabase
          .from("automation_drip_logs")
          .update({ status: "failed", error_message: e.message })
          .eq("id", log.id);
        failed++;
      }
    }

    // Mark enrollments as completed if all drips are done
    const enrollmentIds = [...new Set(pendingDrips.map((d) => d.enrollment_id))];
    for (const eid of enrollmentIds) {
      const { data: remaining } = await supabase
        .from("automation_drip_logs")
        .select("id")
        .eq("enrollment_id", eid)
        .eq("status", "pending")
        .limit(1);

      if (!remaining || remaining.length === 0) {
        await supabase
          .from("automation_enrollments")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", eid);
      }
    }

    return new Response(JSON.stringify({ processed: pendingDrips.length, sent, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("automation-engine error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
