import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Função para validar força da senha
function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Função para sanitizar dados sensíveis
function sanitizeData(data: any): any {
  const sanitized = { ...data }
  
  // Remove ou mascara campos sensíveis para logs
  if (sanitized.password) delete sanitized.password
  if (sanitized.email) sanitized.email = sanitized.email.replace(/(.{2}).*(@.*)/, '$1***$2')
  if (sanitized.phone) sanitized.phone = sanitized.phone.replace(/(\d{3}).*(\d{4})/, '$1***$2')
  
  return sanitized
}

// Função para detectar padrões suspeitos
function detectSuspiciousPatterns(data: any): string[] {
  const suspicious: string[] = []
  
  // Verifica injeção SQL
  const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi
  if (JSON.stringify(data).match(sqlPatterns)) {
    suspicious.push('Potential SQL injection attempt detected')
  }
  
  // Verifica XSS
  const xssPatterns = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
  if (JSON.stringify(data).match(xssPatterns)) {
    suspicious.push('Potential XSS attempt detected')
  }
  
  // Verifica email e nome idênticos (possível spam)
  if (data.email && data.name && data.email.includes(data.name.toLowerCase())) {
    suspicious.push('Email and name similarity detected')
  }
  
  return suspicious
}

// Função para validar entrada com sanitização
function validateAndSanitizeInput(data: any): { isValid: boolean; errors: string[]; sanitized: any } {
  const errors: string[] = []
  const sanitized = { ...data }
  
  // Validações obrigatórias
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required')
  } else if (data.name.length > 100) {
    errors.push('Name must be less than 100 characters')
  }
  
  if (!data.phone || data.phone.trim().length === 0) {
    errors.push('Phone is required')
  } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(data.phone)) {
    errors.push('Invalid phone format')
  }
  
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format')
  }
  
  // Sanitiza strings
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key].trim()
      // Remove caracteres HTML perigosos
      sanitized[key] = sanitized[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      sanitized[key] = sanitized[key].replace(/<[^>]*>/g, '')
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validar tamanho da requisição
    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
      console.log('Request too large detected:', contentLength)
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { formData, formType, password } = await req.json()
    
    console.log('Secure form handler called:', { 
      formType, 
      sanitizedData: sanitizeData(formData),
      timestamp: new Date().toISOString()
    })

    // Validar senha se fornecida (para autenticação)
    if (password) {
      const passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.isValid) {
        return new Response(
          JSON.stringify({ error: 'Password validation failed', details: passwordValidation.errors }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Detectar padrões suspeitos
    const suspiciousPatterns = detectSuspiciousPatterns(formData)
    if (suspiciousPatterns.length > 0) {
      console.warn('Suspicious activity detected:', {
        patterns: suspiciousPatterns,
        sanitizedData: sanitizeData(formData),
        timestamp: new Date().toISOString(),
        userAgent: req.headers.get('user-agent')
      })
      
      return new Response(
        JSON.stringify({ error: 'Security validation failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar e sanitizar dados de entrada
    const validation = validateAndSanitizeInput(formData)
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Processar baseado no tipo de formulário
    let result
    switch (formType) {
      case 'quiz':
        result = await supabase
          .from('quiz_responses')
          .insert({
            ...validation.sanitized,
            source: 'quiz'
          })
        break
        
      case 'contact':
      case 'builders':
      case 'realtors':
        result = await supabase
          .from('leads')
          .insert({
            ...validation.sanitized,
            lead_source: formType === 'contact' ? 'contact_form' : `${formType}_page`
          })
        break
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid form type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    if (result.error) {
      console.error('Database error:', result.error)
      
      // Sanitizar erro antes de retornar
      const sanitizedError = result.error.message
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]')
        .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]')
      
      return new Response(
        JSON.stringify({ error: 'Submission failed', details: sanitizedError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Form submission successful:', {
      formType,
      recordId: result.data?.[0]?.id,
      timestamp: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Form submitted successfully',
        id: result.data?.[0]?.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in secure form handler:', {
      error: error.message,
      timestamp: new Date().toISOString()
    })
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})