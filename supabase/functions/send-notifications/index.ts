import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { authorize, unauthorized } from "../_shared/auth.ts";

const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

const AXO_ORG_ID = "a0000000-0000-0000-0000-000000000001";
const DEFAULT_COMPANY_NAME = "AXO Floors";
const DEFAULT_EMAIL_FROM_NAME = "AXO Floors";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Security-Policy": "default-src 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};

const sanitizeForLogging = (data: any): any => {
  if (typeof data !== 'object' || data === null) return data;
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'api_key', 'secret', 'auth'];
  for (const key in sanitized) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      delete sanitized[key];
      continue;
    }
    if (key.toLowerCase() === 'email' && typeof sanitized[key] === 'string') {
      const email = sanitized[key];
      const [localPart, domain] = email.split('@');
      if (localPart && domain && localPart.length > 3) {
        sanitized[key] = `${localPart.substring(0, 3)}***@${domain}`;
      }
    }
    if (key.toLowerCase().includes('phone') && typeof sanitized[key] === 'string') {
      const phone = sanitized[key].replace(/\D/g, '');
      if (phone.length >= 4) {
        sanitized[key] = `***-***-${phone.slice(-4)}`;
      }
    }
    if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }
  return sanitized;
};

const validateRequestSize = (req: Request, maxSizeBytes: number = 1024 * 1024): boolean => {
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > maxSizeBytes) return false;
  return true;
};

interface NotificationRequest {
  leadData: {
    name: string;
    email: string;
    phone: string;
    city?: string;
    room_size?: string;
    services?: string[];
    budget?: number;
    source: string;
  };
  adminEmail: string;
  adminPhone?: string;
  organization_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[NOTIFICATIONS] Function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!validateRequestSize(req)) {
    console.warn('[NOTIFICATIONS] Request size exceeded limit');
    return new Response(
      JSON.stringify({ error: 'Request too large' }),
      { status: 413, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const requestData: NotificationRequest = await req.json();
    const { leadData, adminEmail, adminPhone, organization_id } = requestData;
    const orgId = organization_id || AXO_ORG_ID;

    // Resolve tenant settings (graceful fallback to defaults if missing).
    let companyName = DEFAULT_COMPANY_NAME;
    let emailFromName = DEFAULT_EMAIL_FROM_NAME;
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: settings } = await supabase
          .from("company_settings")
          .select("company_name, email_from_name")
          .eq("organization_id", orgId)
          .maybeSingle();
        if (settings?.company_name) companyName = settings.company_name;
        if (settings?.email_from_name) emailFromName = settings.email_from_name;
        else if (settings?.company_name) emailFromName = settings.company_name;
      }
    } catch (e) {
      console.warn("[NOTIFICATIONS] Settings lookup failed, using defaults:", (e as Error).message);
    }

    console.log("[NOTIFICATIONS] Processing notification for lead:", sanitizeForLogging({
      name: leadData.name,
      source: leadData.source,
      adminEmail: adminEmail.substring(0, 3) + '***@' + adminEmail.split('@')[1]
    }));

    const results = {
      email: { success: false, error: null },
      sms: { success: false, error: null }
    };

    try {
      const emailSubject = `🚨 New Lead — ${leadData.name}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            New Lead Received!
          </h2>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Lead Information:</h3>
            <div style="display: grid; gap: 10px;">
              <div><strong>Name:</strong> ${leadData.name}</div>
              <div><strong>Email:</strong> ${leadData.email}</div>
              <div><strong>Phone:</strong> ${leadData.phone}</div>
              ${leadData.city ? `<div><strong>City:</strong> ${leadData.city}</div>` : ''}
              ${leadData.room_size ? `<div><strong>Room Size:</strong> ${leadData.room_size}</div>` : ''}
              ${leadData.services && leadData.services.length > 0 ?
                `<div><strong>Services:</strong> ${leadData.services.join(', ')}</div>` : ''}
              ${leadData.budget ? `<div><strong>Budget:</strong> $${leadData.budget.toLocaleString()}</div>` : ''}
              <div><strong>Source:</strong> ${leadData.source === 'quiz' ? 'Website Quiz' : leadData.source}</div>
            </div>
          </div>
          <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; border-left: 4px solid #16a34a;">
            <p style="margin: 0; color: #15803d;">
              <strong>💡 Recommended Action:</strong> Contact this lead as quickly as possible.
              Leads responded to within 5 minutes have 9x higher conversion rates.
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px;">
              ${companyName} notification
            </p>
          </div>
        </div>
      `;

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${emailFromName} <notifications@resend.dev>`,
          to: [adminEmail],
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error(`Email service returned ${emailResponse.status}`);
      }

      results.email.success = true;
      console.log("[NOTIFICATIONS] Email sent successfully to admin");
    } catch (error) {
      const sanitizedError = {
        message: (error as Error).message?.substring(0, 100) || 'Unknown error',
        type: (error as Error).name || 'Error'
      };
      console.error("[NOTIFICATIONS] Email error:", sanitizedError);
      results.email.error = 'Email service temporarily unavailable' as any;
    }

    if (adminPhone && twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      try {
        const smsMessage = `🚨 NEW LEAD — ${companyName} 🚨\n\nName: ${leadData.name}\nPhone: ${leadData.phone}\nEmail: ${leadData.email}\nSource: ${leadData.source === 'quiz' ? 'Website Quiz' : leadData.source}\n\nContact NOW to maximize conversion.`;

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        const smsResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: twilioPhoneNumber,
            To: adminPhone,
            Body: smsMessage,
          }),
        });

        if (!smsResponse.ok) {
          const errorData = await smsResponse.json();
          throw new Error(`Twilio error: ${errorData.message}`);
        }

        results.sms.success = true;
        console.log("[NOTIFICATIONS] SMS sent successfully");
      } catch (error) {
        const sanitizedError = {
          message: (error as Error).message?.substring(0, 100) || 'Unknown error',
          type: (error as Error).name || 'Error'
        };
        console.error("[NOTIFICATIONS] SMS error:", sanitizedError);
        results.sms.error = 'SMS service temporarily unavailable' as any;
      }
    } else {
      console.log("[NOTIFICATIONS] SMS skipped - missing configuration");
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    const sanitizedError = {
      message: error.message?.substring(0, 100) || 'Unknown error',
      type: error.name || 'Error',
      timestamp: new Date().toISOString()
    };
    console.error("[NOTIFICATIONS] Function error:", sanitizedError);
    return new Response(
      JSON.stringify({
        error: 'Notification service temporarily unavailable',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
