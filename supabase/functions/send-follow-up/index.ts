import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
  
  // Remove sensitive fields completely
  const sensitiveFields = ['password', 'token', 'api_key', 'secret', 'auth', 'email'];
  
  for (const key in sanitized) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      if (key.toLowerCase() === 'email' && typeof sanitized[key] === 'string') {
        // Mask email instead of removing completely
        const email = sanitized[key];
        const [localPart, domain] = email.split('@');
        if (localPart && domain && localPart.length > 3) {
          sanitized[key] = `${localPart.substring(0, 3)}***@${domain}`;
        }
      } else {
        delete sanitized[key];
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

interface FollowUpEmailRequest {
  name: string;
  email: string;
  source: string;
  leadType?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate request size first
  if (!validateRequestSize(req)) {
    console.warn('[FOLLOW-UP] Request size exceeded limit');
    return new Response(
      JSON.stringify({ error: 'Request too large' }),
      { 
        status: 413, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }

  try {
    const requestData: FollowUpEmailRequest = await req.json();
    const { name, email, source, leadType = 'general' } = requestData;
    
    // Log sanitized request data (without exposing sensitive info)
    console.log('[FOLLOW-UP] Processing lead:', sanitizeForLogging(requestData));

    const baseUrl = "https://axo-floors-nj.lovable.app";
    
    // Customize email content based on lead source
    let subject = "Thank you for your interest in AXO Floors!";
    let emailContent = `
      <h1>Hello ${name}!</h1>
      <p>Thank you for your interest in AXO Floors. We're excited to help transform your space with beautiful flooring.</p>
      
      <h2>Here are some resources to help you get started:</h2>
      
      <p><strong><a href="${baseUrl}/gallery" style="color: #FFC62A; text-decoration: none;">📸 View Our Gallery</a></strong><br>
      See stunning before & after transformations from real New Jersey homes.</p>
      
      <p><strong><a href="${baseUrl}/stain-gallery" style="color: #FFC62A; text-decoration: none;">🎨 Browse Stain Colors</a></strong><br>
      Explore 20+ premium stain options to find your perfect match.</p>
      
      <p><strong><a href="${baseUrl}/funnel" style="color: #FFC62A; text-decoration: none;">⭐ Current Promotions</a></strong><br>
      Check out our seasonal offers and limited-time deals.</p>
      
      <hr style="margin: 30px 0; border: 1px solid #ddd;">
      
      <h3>Ready to get started?</h3>
      <p>We typically respond within 24 hours. In the meantime, feel free to:</p>
      <ul>
        <li>Call us directly at <a href="tel:(732) 351-8653" style="color: #0C1C2E;">(732) 351-8653</a></li>
        <li>Text us for faster response</li>
        <li>Browse our work and get inspired</li>
      </ul>
      
      <p>Thank you for choosing AXO Floors!</p>
      <p><strong>The AXO Floors Team</strong><br>
      New Jersey's Premier Flooring Specialists</p>
    `;

    // Customize content based on lead type
    if (leadType === 'quiz') {
      subject = "Your Personalized Floor Recommendations - AXO Floors";
      emailContent = `
        <h1>Hi ${name}!</h1>
        <p>Thank you for taking our floor assessment quiz! Based on your responses, we've prepared some personalized recommendations for you.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0C1C2E; margin-top: 0;">🎯 Your Next Steps:</h3>
          <ol>
            <li><strong><a href="${baseUrl}/gallery" style="color: #FFC62A;">View Our Gallery</a></strong> - See projects similar to your space</li>
            <li><strong><a href="${baseUrl}/stain-gallery" style="color: #FFC62A;">Choose Your Stain</a></strong> - Find the perfect color match</li>
            <li><strong>Schedule Your Free Consultation</strong> - We'll bring samples to your home</li>
          </ol>
        </div>
        
        <p><strong>Ready to see your transformation?</strong></p>
        <p>Call us at <a href="tel:(732) 351-8653" style="color: #0C1C2E;">(732) 351-8653</a> to schedule your free in-home consultation.</p>
        
        <p>Best regards,<br>
        <strong>The AXO Floors Team</strong></p>
      `;
    } else if (leadType === 'builder_partnership') {
      subject = "Your Contractor Partnership Inquiry - AXO Floors";
      emailContent = `
        <h1>Hello ${name}!</h1>
        <p>Thank you for your interest in partnering with AXO Floors. We're excited about the opportunity to support your construction projects with premium flooring services.</p>
        
        <h3>What happens next?</h3>
        <ul>
          <li>📞 We'll call you within 24 hours to discuss your project volume and needs</li>
          <li>📋 Provide custom contractor pricing based on your requirements</li>
          <li>🏠 Schedule a site visit to see our work quality firsthand</li>
          <li>🤝 Set up your priority scheduling and dedicated project management</li>
        </ul>
        
        <p><strong>In the meantime, feel free to:</strong></p>
        <p>• <a href="${baseUrl}/gallery" style="color: #FFC62A;">View Our Portfolio</a> to see our craftsmanship<br>
        • Call us directly at <a href="tel:(732) 351-8653" style="color: #0C1C2E;">(732) 351-8653</a> for immediate assistance</p>
        
        <p>We look forward to building a successful partnership with you!</p>
        <p><strong>The AXO Floors Partnership Team</strong></p>
      `;
    } else if (leadType === 'realtor_partnership') {
      subject = "Your Realtor Partnership Inquiry - AXO Floors";
      emailContent = `
        <h1>Hello ${name}!</h1>
        <p>Thank you for your interest in partnering with AXO Floors. We understand how important it is to have reliable flooring partners who can help your listings stand out.</p>
        
        <h3>What you'll receive within 24 hours:</h3>
        <ul>
          <li>📊 Custom realtor pricing sheet</li>
          <li>⏰ Priority scheduling for your listings</li>
          <li>📸 Before/after photos for your marketing materials</li>
          <li>📞 Direct contact with project managers</li>
        </ul>
        
        <p><strong>Resources for you:</strong></p>
        <p>• <a href="${baseUrl}/gallery" style="color: #FFC62A;">Before & After Gallery</a> for client presentations<br>
        • <a href="${baseUrl}/stain-gallery" style="color: #FFC62A;">Stain Color Guide</a> for staging recommendations</p>
        
        <p>Ready to transform your listings? Call us at <a href="tel:(732) 351-8653" style="color: #0C1C2E;">(732) 351-8653</a></p>
        
        <p>Best regards,<br>
        <strong>The AXO Floors Realtor Partnership Team</strong></p>
      `;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AXO Floors <noreply@axo-floors.com>",
        to: [email],
        subject: subject,
        html: emailContent,
      }),
    });

    // Log success without exposing sensitive data
    console.log("[FOLLOW-UP] Email sent successfully to:", sanitizeForLogging({ email, leadType }));

    return new Response(JSON.stringify({ 
      success: true, 
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
    
    console.error("[FOLLOW-UP] Error in send-follow-up function:", sanitizedError);
    
    return new Response(
      JSON.stringify({ 
        error: 'Email service temporarily unavailable',
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