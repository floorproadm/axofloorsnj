
-- 1) Add attachment columns
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_name text;

ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_name text;

-- Allow content to be empty when sending only an attachment
ALTER TABLE public.chat_messages ALTER COLUMN content DROP NOT NULL;
ALTER TABLE public.direct_messages ALTER COLUMN content DROP NOT NULL;

-- 2) Create public bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 3) Storage policies
DROP POLICY IF EXISTS "chat_attachments_public_read" ON storage.objects;
CREATE POLICY "chat_attachments_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "chat_attachments_auth_insert" ON storage.objects;
CREATE POLICY "chat_attachments_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "chat_attachments_anon_portal_insert" ON storage.objects;
CREATE POLICY "chat_attachments_anon_portal_insert" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = 'portal');

DROP POLICY IF EXISTS "chat_attachments_auth_delete_own" ON storage.objects;
CREATE POLICY "chat_attachments_auth_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chat-attachments' AND owner = auth.uid());

-- 4) Update portal RPCs to support attachments
CREATE OR REPLACE FUNCTION public.send_portal_message(
  p_token text,
  p_content text,
  p_sender_name text DEFAULT NULL,
  p_attachment_url text DEFAULT NULL,
  p_attachment_type text DEFAULT NULL,
  p_attachment_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_project_id uuid;
  v_msg public.chat_messages%ROWTYPE;
  v_name text;
  v_content text := COALESCE(trim(p_content), '');
BEGIN
  IF v_content = '' AND p_attachment_url IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_message');
  END IF;

  SELECT * INTO v_customer FROM public.customers WHERE portal_token = p_token LIMIT 1;
  IF v_customer.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  SELECT id INTO v_project_id
  FROM public.projects
  WHERE customer_id = v_customer.id
  ORDER BY
    CASE WHEN project_status NOT IN ('completed','cancelled') THEN 0 ELSE 1 END,
    updated_at DESC NULLS LAST,
    created_at DESC NULLS LAST
  LIMIT 1;

  IF v_project_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_project');
  END IF;

  v_name := COALESCE(NULLIF(trim(p_sender_name), ''), v_customer.full_name, 'Client');

  INSERT INTO public.chat_messages (project_id, sender_id, sender_name, content, attachment_url, attachment_type, attachment_name)
  VALUES (v_project_id, v_customer.id, v_name, v_content, p_attachment_url, p_attachment_type, p_attachment_name)
  RETURNING * INTO v_msg;

  RETURN jsonb_build_object('ok', true, 'message', to_jsonb(v_msg));
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_portal_messages(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_messages jsonb;
BEGIN
  SELECT * INTO v_customer FROM public.customers WHERE portal_token = p_token LIMIT 1;
  IF v_customer.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  SELECT COALESCE(jsonb_agg(row_obj ORDER BY (row_obj->>'created_at') ASC), '[]'::jsonb)
  INTO v_messages
  FROM (
    SELECT jsonb_build_object(
      'id', cm.id,
      'project_id', cm.project_id,
      'sender_id', cm.sender_id,
      'sender_name', cm.sender_name,
      'content', cm.content,
      'read', cm.read,
      'created_at', cm.created_at,
      'attachment_url', cm.attachment_url,
      'attachment_type', cm.attachment_type,
      'attachment_name', cm.attachment_name,
      'is_customer', (cm.sender_id = v_customer.id)
    ) AS row_obj
    FROM public.chat_messages cm
    JOIN public.projects p ON p.id = cm.project_id
    WHERE p.customer_id = v_customer.id
  ) sub;

  RETURN jsonb_build_object(
    'ok', true,
    'customer_id', v_customer.id,
    'customer_name', v_customer.full_name,
    'messages', v_messages
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.send_portal_message(text, text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_messages(text) TO anon, authenticated;
