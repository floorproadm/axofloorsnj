import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  console.log("[Notifications] Function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadData, adminEmail, adminPhone }: NotificationRequest = await req.json();
    console.log("[Notifications] Processing notification for lead:", leadData.name);

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

      const emailResponse = await resend.emails.send({
        from: "AXO Floors <notifications@resend.dev>",
        to: [adminEmail],
        subject: emailSubject,
        html: emailHtml,
      });

      if (emailResponse.error) {
        throw new Error(emailResponse.error.message);
      }

      results.email.success = true;
      console.log("[Notifications] Email sent successfully");
    } catch (error) {
      console.error("[Notifications] Email error:", error);
      results.email.error = error.message;
    }

    // Send SMS notification (if phone number provided)
    if (adminPhone && twilioAccountSid && twilioAuthToken) {
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
            From: '+1234567890', // Substitua pelo seu número Twilio
            To: adminPhone,
            Body: smsMessage,
          }),
        });

        if (!smsResponse.ok) {
          const errorData = await smsResponse.json();
          throw new Error(`Twilio error: ${errorData.message}`);
        }

        results.sms.success = true;
        console.log("[Notifications] SMS sent successfully");
      } catch (error) {
        console.error("[Notifications] SMS error:", error);
        results.sms.error = error.message;
      }
    } else {
      console.log("[Notifications] SMS skipped - missing phone or Twilio credentials");
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("[Notifications] Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);