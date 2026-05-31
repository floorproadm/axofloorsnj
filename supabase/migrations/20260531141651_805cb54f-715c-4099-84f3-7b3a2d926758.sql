
-- 1) direct_messages: admin <-> team DMs
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  sender_name text NOT NULL DEFAULT '',
  receiver_id uuid NOT NULL,
  receiver_name text NOT NULL DEFAULT '',
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dm_pair ON public.direct_messages(organization_id, sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_dm_receiver_unread ON public.direct_messages(receiver_id, read) WHERE read = false;

GRANT SELECT, INSERT, UPDATE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY dm_select_own ON public.direct_messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY dm_insert_own ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY dm_update_receiver ON public.direct_messages FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id OR public.has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

-- 2) Portal RPCs (SECURITY DEFINER, anon-callable)

CREATE OR REPLACE FUNCTION public.get_portal_messages(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.send_portal_message(p_token text, p_content text, p_sender_name text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_project_id uuid;
  v_msg public.chat_messages%ROWTYPE;
  v_name text;
BEGIN
  IF p_content IS NULL OR length(trim(p_content)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_content');
  END IF;

  SELECT * INTO v_customer FROM public.customers WHERE portal_token = p_token LIMIT 1;
  IF v_customer.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  -- Pick most-recently-updated active project for this customer
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

  INSERT INTO public.chat_messages (project_id, sender_id, sender_name, content)
  VALUES (v_project_id, v_customer.id, v_name, trim(p_content))
  RETURNING * INTO v_msg;

  RETURN jsonb_build_object('ok', true, 'message', to_jsonb(v_msg));
END;
$$;

REVOKE ALL ON FUNCTION public.get_portal_messages(text) FROM public;
REVOKE ALL ON FUNCTION public.send_portal_message(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_portal_messages(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_portal_message(text, text, text) TO anon, authenticated;
