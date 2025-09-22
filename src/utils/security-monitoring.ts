// Security monitoring utilities for client-side use

interface SecurityEvent {
  type: 'failed_validation' | 'rate_limit_exceeded' | 'suspicious_activity' | 'form_submission';
  timestamp: number;
  details: Record<string, any>;
  clientId: string;
}

// Store security events in memory (could be extended to send to backend)
const securityEvents: SecurityEvent[] = [];
const MAX_EVENTS = 1000; // Keep last 1000 events

// Sanitize sensitive data for logging
export const sanitizeForLogging = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };
  
  // Remove or mask sensitive fields
  const sensitiveFields = ['password', 'token', 'api_key', 'secret', 'auth'];
  
  for (const key in sanitized) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      delete sanitized[key];
    }
    
    // Mask email addresses (show first 3 chars + @domain)
    if (key.toLowerCase() === 'email' && typeof sanitized[key] === 'string') {
      const email = sanitized[key];
      const [localPart, domain] = email.split('@');
      if (localPart && domain) {
        sanitized[key] = `${localPart.substring(0, 3)}***@${domain}`;
      }
    }
    
    // Mask phone numbers (show last 4 digits)
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

// Log security events
export const logSecurityEvent = (type: SecurityEvent['type'], details: Record<string, any>) => {
  const clientId = `${navigator.userAgent.slice(0, 20)}-${Date.now()}`;
  
  const event: SecurityEvent = {
    type,
    timestamp: Date.now(),
    details: sanitizeForLogging(details),
    clientId
  };
  
  securityEvents.push(event);
  
  // Keep only the most recent events
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.shift();
  }
  
  // Log to console in development (but sanitized)
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[SECURITY] ${type}:`, event.details);
  }
};

// Detect suspicious patterns
export const detectSuspiciousActivity = (formData: Record<string, any>): boolean => {
  const now = Date.now();
  const recentEvents = securityEvents.filter(e => now - e.timestamp < 60000); // Last minute
  
  // Check for rapid form submissions
  const formSubmissions = recentEvents.filter(e => e.type === 'form_submission');
  if (formSubmissions.length > 3) {
    logSecurityEvent('suspicious_activity', {
      reason: 'rapid_form_submissions',
      count: formSubmissions.length,
      timeframe: '1_minute'
    });
    return true;
  }
  
  // Check for unusual patterns in form data
  if (formData.email && formData.name) {
    // Check if email and name are suspiciously similar (possible bot)
    const emailLocal = formData.email.split('@')[0].toLowerCase();
    const nameNormalized = formData.name.toLowerCase().replace(/\s+/g, '');
    
    if (emailLocal === nameNormalized) {
      logSecurityEvent('suspicious_activity', {
        reason: 'email_name_match',
        field_similarity: 'exact_match'
      });
      return true;
    }
  }
  
  // Check for repeated identical submissions
  const identicalSubmissions = recentEvents.filter(e => 
    e.type === 'form_submission' && 
    JSON.stringify(e.details.sanitizedData) === JSON.stringify(sanitizeForLogging(formData))
  );
  
  if (identicalSubmissions.length > 1) {
    logSecurityEvent('suspicious_activity', {
      reason: 'identical_submissions',
      count: identicalSubmissions.length
    });
    return true;
  }
  
  return false;
};

// Monitor failed validations
export const monitorFailedValidation = (field: string, value: any, error: string) => {
  logSecurityEvent('failed_validation', {
    field,
    error,
    value_type: typeof value,
    value_length: typeof value === 'string' ? value.length : undefined
  });
};

// Monitor rate limit hits
export const monitorRateLimit = (identifier: string, remainingTime: number) => {
  logSecurityEvent('rate_limit_exceeded', {
    identifier: identifier.slice(0, 10) + '***', // Partial identifier
    remainingTime,
    timestamp: Date.now()
  });
};

// Monitor successful form submissions
export const monitorFormSubmission = (formType: string, formData: Record<string, any>) => {
  // Check for suspicious activity before logging
  const isSuspicious = detectSuspiciousActivity(formData);
  
  logSecurityEvent('form_submission', {
    formType,
    sanitizedData: sanitizeForLogging(formData),
    suspicious: isSuspicious,
    userAgent: navigator.userAgent.slice(0, 50) + '...'
  });
  
  return !isSuspicious;
};

// Get security event summary (for debugging/monitoring)
export const getSecuritySummary = () => {
  const now = Date.now();
  const last24h = securityEvents.filter(e => now - e.timestamp < 24 * 60 * 60 * 1000);
  
  return {
    totalEvents: securityEvents.length,
    last24Hours: last24h.length,
    eventTypes: last24h.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    suspiciousActivity: last24h.filter(e => e.type === 'suspicious_activity').length
  };
};

// Headers security utility
export const getSecurityHeaders = () => ({
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
});

// Request size validation
export const validateRequestSize = (data: any, maxSizeKB: number = 1024): boolean => {
  const size = new Blob([JSON.stringify(data)]).size;
  const sizeKB = size / 1024;
  
  if (sizeKB > maxSizeKB) {
    logSecurityEvent('suspicious_activity', {
      reason: 'oversized_request',
      sizeKB: Math.round(sizeKB),
      maxSizeKB
    });
    return false;
  }
  
  return true;
};
