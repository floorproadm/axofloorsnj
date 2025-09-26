import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Security-Policy": "default-src 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};

// Utility to sanitize sensitive data for logging
const sanitizeForLogging = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };
  
  // Remove or mask sensitive fields
  const sensitiveFields = ['password', 'token', 'api_key', 'secret', 'auth'];
  
  for (const key in sanitized) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      delete sanitized[key];
      continue;
    }
    
    // Mask email addresses
    if (key.toLowerCase() === 'email' && typeof sanitized[key] === 'string') {
      const email = sanitized[key];
      const [localPart, domain] = email.split('@');
      if (localPart && domain && localPart.length > 3) {
        sanitized[key] = `${localPart.substring(0, 3)}***@${domain}`;
      }
    }
    
    // Mask phone numbers
    if (key.toLowerCase().includes('phone') && typeof sanitized[key] === 'string') {
      const phone = sanitized[key].replace(/\D/g, '');
      if (phone.length >= 4) {
        sanitized[key] = `***-***-${phone.slice(-4)}`;
      }
    }
    
    // Recursively sanitize nested objects
    if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }
  
  return sanitized;
};

// Validate request size
const validateRequestSize = (req: Request, maxSizeBytes: number = 1024 * 1024): boolean => {
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    return false;
  }
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
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[NOTIFICATIONS] Function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate request size first
  if (!validateRequestSize(req)) {
    console.warn('[NOTIFICATIONS] Request size exceeded limit');
    return new Response(
      JSON.stringify({ error: 'Request too large' }),
      { 
        status: 413, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }

  try {
    const requestData: NotificationRequest = await req.json();
    const { leadData, adminEmail, adminPhone } = requestData;
    
    // Log sanitized request data
    console.log("[NOTIFICATIONS] Processing notification for lead:", sanitizeForLogging({ 
      name: leadData.name,
      source: leadData.source,
      adminEmail: adminEmail.substring(0, 3) + '***@' + adminEmail.split('@')[1]
    }));

    const results = {
      email: { success: false, error: null },
      sms: { success: false, error: null }
    };

    // Send email notification
    try {
      const emailSubject = `🚨 Novo Lead Recebido - ${leadData.name}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Novo Lead Recebido!
          </h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Informações do Lead:</h3>
            
            <div style="display: grid; gap: 10px;">
              <div><strong>Nome:</strong> ${leadData.name}</div>
              <div><strong>Email:</strong> ${leadData.email}</div>
              <div><strong>Telefone:</strong> ${leadData.phone}</div>
              ${leadData.city ? `<div><strong>Cidade:</strong> ${leadData.city}</div>` : ''}
              ${leadData.room_size ? `<div><strong>Tamanho do Ambiente:</strong> ${leadData.room_size}</div>` : ''}
              ${leadData.services && leadData.services.length > 0 ? 
                `<div><strong>Serviços:</strong> ${leadData.services.join(', ')}</div>` : ''}
              ${leadData.budget ? `<div><strong>Orçamento:</strong> $${leadData.budget.toLocaleString()}</div>` : ''}
              <div><strong>Origem:</strong> ${leadData.source === 'quiz' ? 'Quiz do Site' : leadData.source}</div>
            </div>
          </div>
          
          <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; border-left: 4px solid #16a34a;">
            <p style="margin: 0; color: #15803d;">
              <strong>💡 Ação Recomendada:</strong> Entre em contato com o lead o mais rápido possível. 
              Leads que recebem resposta em até 5 minutos têm 9x mais chances de conversão!
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px;">
              Notificação automática do sistema AXO Floors
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
          from: "AXO Floors <notifications@resend.dev>",
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
      // Secure error logging
      const sanitizedError = {
        message: (error as Error).message?.substring(0, 100) || 'Unknown error',
        type: (error as Error).name || 'Error'
      };
      console.error("[NOTIFICATIONS] Email error:", sanitizedError);
      results.email.error = 'Email service temporarily unavailable' as any;
    }

    // Send SMS notification (if phone number provided)
    if (adminPhone && twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      try {
        const smsMessage = `🚨 NOVO LEAD AXO FLOORS 🚨\n\nNome: ${leadData.name}\nTelefone: ${leadData.phone}\nEmail: ${leadData.email}\nOrigem: ${leadData.source === 'quiz' ? 'Quiz do Site' : leadData.source}\n\nEntre em contato AGORA para aumentar as chances de conversão!`;

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
        // Secure error logging
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
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    // Secure error logging - don't expose sensitive details
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
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);