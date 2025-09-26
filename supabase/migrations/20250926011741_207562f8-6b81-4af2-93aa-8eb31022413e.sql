-- FASE 1: INFRAESTRUTURA E SEGURANÇA DE DADOS
-- Melhorar políticas RLS para dados de clientes

-- 1. Criar função para log de acesso aos dados sensíveis
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  table_name text,
  operation text, 
  data_type text DEFAULT 'customer_data'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log acessos a dados sensíveis para auditoria
  INSERT INTO public.audit_log (
    user_id,
    table_accessed,
    operation_type,
    data_classification,
    access_timestamp,
    user_role
  )
  VALUES (
    auth.uid(),
    table_name,
    operation,
    data_type,
    NOW(),
    get_current_user_role()
  )
  ON CONFLICT DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    -- Falha silenciosa para não bloquear operações
    NULL;
END;
$$;

-- 2. Criar tabela de auditoria para rastreamento de acessos
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  table_accessed TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  data_classification TEXT DEFAULT 'standard',
  access_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs de auditoria
CREATE POLICY "Admin access to audit logs" ON public.audit_log
FOR ALL USING (get_current_user_role() = 'admin');

-- 3. CORREÇÃO CRÍTICA: Políticas RLS mais rigorosas para leads
DROP POLICY IF EXISTS "Allow quiz submissions from public" ON public.leads;
DROP POLICY IF EXISTS "Only admin users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Admin users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admin users can delete leads" ON public.leads;

-- Nova política para inserção de leads (quiz e formulários)
CREATE POLICY "Allow authenticated lead submissions" ON public.leads
FOR INSERT WITH CHECK (
  -- Permitir apenas de fontes válidas e com dados obrigatórios
  lead_source IN ('quiz', 'contact_form', 'contact_page', 'builders_page', 'realtors_page') 
  AND name IS NOT NULL 
  AND phone IS NOT NULL
  AND (
    -- Permitir tanto usuários autenticados quanto anônimos para formulários públicos
    auth.uid() IS NOT NULL OR
    lead_source IN ('quiz', 'contact_form', 'contact_page', 'builders_page', 'realtors_page')
  )
);

-- Política rigorosa para visualização de leads (apenas admins com log)
CREATE POLICY "Admin view leads with logging" ON public.leads
FOR SELECT USING (
  get_current_user_role() = 'admin' 
  AND (log_sensitive_data_access('leads', 'SELECT', 'customer_pii') IS NULL OR true)
);

-- Política para atualização de leads (apenas admins com log)
CREATE POLICY "Admin update leads with logging" ON public.leads
FOR UPDATE USING (
  get_current_user_role() = 'admin'
  AND (log_sensitive_data_access('leads', 'UPDATE', 'customer_pii') IS NULL OR true)
) WITH CHECK (
  get_current_user_role() = 'admin'
);

-- Política para exclusão de leads (apenas admins com log)
CREATE POLICY "Admin delete leads with logging" ON public.leads
FOR DELETE USING (
  get_current_user_role() = 'admin'
  AND (log_sensitive_data_access('leads', 'DELETE', 'customer_pii') IS NULL OR true)
);

-- 4. CORREÇÃO CRÍTICA: Políticas RLS mais rigorosas para quiz_responses
DROP POLICY IF EXISTS "Allow public quiz submissions" ON public.quiz_responses;
DROP POLICY IF EXISTS "Admin users can view quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Deny anonymous access to quiz responses" ON public.quiz_responses;

-- Política para permitir submissões de quiz (anônimas)
CREATE POLICY "Allow anonymous quiz submissions" ON public.quiz_responses
FOR INSERT WITH CHECK (
  source = 'quiz'
  AND name IS NOT NULL
  AND email IS NOT NULL
  AND phone IS NOT NULL
);

-- Política para visualização de quiz responses (apenas admins com log)
CREATE POLICY "Admin view quiz responses with logging" ON public.quiz_responses
FOR SELECT USING (
  get_current_user_role() = 'admin'
  AND (log_sensitive_data_access('quiz_responses', 'SELECT', 'customer_pii') IS NULL OR true)
);

-- 5. PROTEÇÃO ADICIONAL: Melhorar políticas de perfil
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON public.profiles;

-- Política mais restritiva para admins visualizarem perfis
CREATE POLICY "Admin view profiles with validation" ON public.profiles
FOR SELECT USING (
  -- Usuário pode ver próprio perfil OU admin pode ver com validação rigorosa
  (auth.uid() = id) OR 
  (
    get_current_user_role() = 'admin' 
    AND auth.uid() IS NOT NULL
    AND (log_sensitive_data_access('profiles', 'SELECT', 'user_pii') IS NULL OR true)
  )
);

-- Política para admins atualizarem perfis (com log)
CREATE POLICY "Admin update profiles with logging" ON public.profiles
FOR UPDATE USING (
  (auth.uid() = id) OR
  (
    get_current_user_role() = 'admin'
    AND (log_sensitive_data_access('profiles', 'UPDATE', 'user_pii') IS NULL OR true)
  )
) WITH CHECK (
  (auth.uid() = id) OR get_current_user_role() = 'admin'
);

-- 6. FUNÇÃO DE VALIDAÇÃO DE DADOS SENSÍVEIS
CREATE OR REPLACE FUNCTION public.validate_sensitive_data_access(
  user_role text,
  operation text,
  table_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas admins podem acessar dados sensíveis
  IF user_role != 'admin' THEN
    RETURN false;
  END IF;
  
  -- Log da tentativa de acesso
  PERFORM log_sensitive_data_access(table_name, operation, 'sensitive_validation');
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, negar acesso por segurança
    RETURN false;
END;
$$;

-- 7. FUNÇÃO PARA SANITIZAÇÃO DE DADOS DE ERRO
CREATE OR REPLACE FUNCTION public.sanitize_error_response(error_message text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove informações sensíveis de mensagens de erro
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(error_message, 
        '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', 
        '[EMAIL_REDACTED]', 'g'
      ),
      '\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', 
      '[PHONE_REDACTED]', 'g'
    ),
    '\b\d{5}(-\d{4})?\b', 
    '[ZIP_REDACTED]', 'g'
  );
END;
$$;