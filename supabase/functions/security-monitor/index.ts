import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// Utility to sanitize sensitive data for logging
const sanitizeForLogging = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };
  
  // Remove sensitive fields completely
  const sensitiveFields = ['password', 'token', 'api_key', 'secret', 'auth', 'authorization'];
  
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

// Log security events to Supabase
const logSecurityEvent = async (supabase: any, eventType: string, details: any, clientInfo: any) => {
  try {
    const sanitizedDetails = sanitizeForLogging(details);
    
    // Don't log to database in this function to avoid recursion, 
    // but you could extend this to log to a separate security_events table
    console.log(`[SECURITY-MONITOR] ${eventType}:`, {
      timestamp: new Date().toISOString(),
      type: eventType,
      details: sanitizedDetails,
      clientInfo: {
        userAgent: clientInfo.userAgent?.substring(0, 100) + '...',
        ip: clientInfo.ip?.replace(/\d+$/, 'XXX'), // Mask last IP octet
        timestamp: clientInfo.timestamp
      }
    });
    
  } catch (error) {
    console.error('[SECURITY-MONITOR] Error logging security event:', (error as Error).message);
  }
};

// Validate request size
const validateRequestSize = (request: Request, maxSizeBytes: number = 1024 * 1024): boolean => {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    return false;
  }
  return true;
};

// Detect suspicious patterns
const detectSuspiciousPatterns = (data: any): string[] => {
  const suspiciousPatterns: string[] = [];
  
  if (typeof data === 'object' && data !== null) {
    // Check for SQL injection patterns
    const sqlPatterns = /('|(\\x27)|(\\x2D)|(-)|(%27)|(%2D)|(\\x23)|(#)|(%23)|(\\x3B)|(;)|(%3B)|(\\x2A)|(\*)|(%2A)|(\\x28)|(\()|(%28)|(\\x29)|(\))|(%29)|(\\x20)|(\s)|(%20)|(union)|(select)|(insert)|(update)|(delete)|(drop)|(create)|(alter)|(exec)|(execute)|(script))/i;
    
    const jsonString = JSON.stringify(data);
    if (sqlPatterns.test(jsonString)) {
      suspiciousPatterns.push('potential_sql_injection');
    }
    
    // Check for XSS patterns
    const xssPatterns = /<script|javascript:|on\w+\s*=|<iframe|<object|<embed/i;
    if (xssPatterns.test(jsonString)) {
      suspiciousPatterns.push('potential_xss');
    }
    
    // Check for unusual data patterns
    if (data.email && data.name) {
      const emailLocal = data.email.split('@')[0]?.toLowerCase() || '';
      const nameNormalized = data.name.toLowerCase().replace(/\s+/g, '');
      
      if (emailLocal === nameNormalized) {
        suspiciousPatterns.push('email_name_exact_match');
      }
    }
  }
  
  return suspiciousPatterns;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate request size first
  if (!validateRequestSize(req)) {
    console.warn('[SECURITY-MONITOR] Request size exceeded limit');
    return new Response(
      JSON.stringify({ error: 'Request too large' }),
      { 
        status: 413, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get client information
    const clientInfo = {
      userAgent: req.headers.get('user-agent') || 'unknown',
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      timestamp: new Date().toISOString()
    };

    const requestData = await req.json();
    
    // Detect suspicious patterns
    const suspiciousPatterns = detectSuspiciousPatterns(requestData);
    
    if (suspiciousPatterns.length > 0) {
      await logSecurityEvent(supabase, 'suspicious_activity_detected', {
        patterns: suspiciousPatterns,
        dataTypes: Object.keys(requestData).map(key => ({ key, type: typeof requestData[key] }))
      }, clientInfo);
      
      return new Response(
        JSON.stringify({ 
          warning: 'Suspicious patterns detected',
          patterns: suspiciousPatterns 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Log successful monitoring check
    await logSecurityEvent(supabase, 'security_check_passed', {
      dataSize: JSON.stringify(requestData).length,
      fields: Object.keys(requestData)
    }, clientInfo);

    return new Response(
      JSON.stringify({ 
        status: 'secure',
        timestamp: new Date().toISOString(),
        checked: ['request_size', 'suspicious_patterns', 'data_sanitization']
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    // Secure error logging - don't expose sensitive details
    const sanitizedError = {
      message: error.message?.substring(0, 100) || 'Unknown error',
      type: error.name || 'Error',
      timestamp: new Date().toISOString()
    };
    
    console.error('[SECURITY-MONITOR] Error in security monitoring:', sanitizedError);
    
    return new Response(
      JSON.stringify({ 
        error: 'Security monitoring failed',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);