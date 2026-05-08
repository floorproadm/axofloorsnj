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

    // Get all pending drip logs that are due (no joins - FKs not present)
    const { data: pendingDrips, error: fetchErr } = await supabase
      .from("automation_drip_logs")
      .select("id, enrollment_id, drip_id, organization_id, scheduled_at")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .limit(50);

    if (fetchErr) throw fetchErr;
    if (!pendingDrips || pendingDrips.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${pendingDrips.length} pending drips to process`);

    // Batch-load enrollments and drips
    const enrollmentIds = [...new Set(pendingDrips.map((d) => d.enrollment_id))];
    const dripIds = [...new Set(pendingDrips.map((d) => d.drip_id))];

    const [{ data: enrollments }, { data: drips }] = await Promise.all([
      supabase
        .from("automation_enrollments")
        .select("id, lead_id, sequence_id, status")
        .in("id", enrollmentIds),
      supabase
        .from("automation_drips")
        .select("id, channel, subject, message_template, delay_days, delay_hours")
        .in("id", dripIds),
    ]);

    const enrollmentMap = new Map((enrollments || []).map((e: any) => [e.id, e]));
    const dripMap = new Map((drips || []).map((d: any) => [d.id, d]));

    let sent = 0;
    let failed = 0;

    for (const log of pendingDrips) {
      const enrollment = enrollmentMap.get(log.enrollment_id);
      const drip = dripMap.get(log.drip_id);

      if (!enrollment || !drip) {
        await supabase
          .from("automation_drip_logs")
          .update({ status: "failed", error_message: "Enrollment or drip not found" })
          .eq("id", log.id);
        failed++;
        continue;
      }

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

      // Get company settings (name, phone, email, website)
      const { data: settings } = await supabase
        .from("company_settings")
        .select("company_name, phone, email, website")
        .eq("organization_id", log.organization_id)
        .maybeSingle();

      const companyName = settings?.company_name || "AXO Floors";
      const companyPhone = settings?.phone || "(732) 351-8653";
      const companyEmail = settings?.email || "axofloorsnj@gmail.com";
      const companyWebsite = settings?.website || "https://axofloorsnj.com";
      const nameParts = (lead.name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Build scheduler link and proposal link
      const schedulerLink = `${companyWebsite}/project-wizard`;
      const proposalLink = lead.converted_to_project_id
        ? `${companyWebsite}/proposal/${lead.converted_to_project_id}`
        : schedulerLink;

      // Build HTML buttons
      const viewRequestButton = `<a href="${schedulerLink}" style="display:inline-block;background:#8B6914;color:#fff!important;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;margin:16px 0">Schedule Your Estimate</a>`;
      const viewQuoteButton = `<a href="${proposalLink}" style="display:inline-block;background:#8B6914;color:#fff!important;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;margin:16px 0">View Your Proposal</a>`;

      // Interpolate variables
      const vars: Record<string, string> = {
        first_name: firstName,
        last_name: lastName,
        name: lead.name || "",
        company_name: companyName,
        company_phone: companyPhone,
        company_email: companyEmail,
        salesperson_name: "Eduardo",
        Eduardo: "Eduardo",
        email: lead.email,
        phone: lead.phone || "",
        services: lead.service_interest || lead.notes || "",
        view_request_button: viewRequestButton,
        view_quote_button: viewQuoteButton,
        appointment_date: "",
        appointment_time: "",
        appointment_location: lead.address || "",
      };

      const interpolate = (tpl: string) =>
        tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");

      const subject = interpolate(drip.subject || "Message from " + companyName);
      let body = interpolate(drip.message_template || "");

      // Convert \n to <br> for HTML rendering (literal \n in DB text)
      body = body.replace(/\\n/g, "<br>").replace(/\n/g, "<br>");

      console.log(`Sending drip to ${lead.email}: "${subject}"`);

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
          console.log(`✅ Sent to ${lead.email}`);
        } else {
          const errMsg = gmailResult.error || "Unknown error";
          await supabase
            .from("automation_drip_logs")
            .update({ status: "failed", error_message: errMsg })
            .eq("id", log.id);
          failed++;
          console.log(`❌ Failed for ${lead.email}: ${errMsg}`);
        }
      } catch (e) {
        await supabase
          .from("automation_drip_logs")
          .update({ status: "failed", error_message: e.message })
          .eq("id", log.id);
        failed++;
        console.log(`❌ Exception for ${lead.email}: ${e.message}`);
      }
    }

    // Mark enrollments as completed if all drips are done
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

    console.log(`Done: processed=${pendingDrips.length}, sent=${sent}, failed=${failed}`);

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
