
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;

-- Index to speed unread count query on chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread
  ON public.chat_messages (sender_id, read)
  WHERE read = false;
