
-- Trigger: auto-create notification when a chat message is sent
CREATE OR REPLACE FUNCTION public.notify_on_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member RECORD;
  v_project_name text;
BEGIN
  -- Get project name for notification
  SELECT customer_name INTO v_project_name
  FROM public.projects WHERE id = NEW.project_id;

  -- Notify all project members EXCEPT the sender
  FOR v_member IN
    SELECT pm.user_id FROM public.project_members pm
    WHERE pm.project_id = NEW.project_id
      AND pm.user_id != NEW.sender_id
  LOOP
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      v_member.user_id,
      'Nova mensagem de ' || NEW.sender_name,
      LEFT(NEW.content, 100),
      'chat',
      '/collaborator/chat'
    );
  END LOOP;

  -- Also notify admins (check user_roles for admin users)
  -- Only if sender is NOT admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.sender_id AND role = 'admin') THEN
    FOR v_member IN
      SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin'
    LOOP
      INSERT INTO public.notifications (user_id, title, body, type, link)
      VALUES (
        v_member.user_id,
        'Mensagem do campo: ' || COALESCE(v_project_name, 'Projeto'),
        NEW.sender_name || ': ' || LEFT(NEW.content, 80),
        'chat',
        '/admin/projects/' || NEW.project_id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_chat_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_chat_message();
