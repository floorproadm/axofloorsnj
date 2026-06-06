CREATE OR REPLACE FUNCTION public.notify_on_chat_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_member RECORD;
  v_project_name text;
  v_org_id uuid;
BEGIN
  SELECT customer_name, organization_id INTO v_project_name, v_org_id
  FROM public.projects WHERE id = NEW.project_id;

  -- Notify only project members (assigned collaborators) EXCEPT the sender.
  -- Admins/managers who want chat updates should be added as project_members.
  FOR v_member IN
    SELECT pm.user_id FROM public.project_members pm
    WHERE pm.project_id = NEW.project_id
      AND pm.user_id != NEW.sender_id
  LOOP
    INSERT INTO public.notifications (user_id, title, body, type, link, organization_id)
    VALUES (
      v_member.user_id,
      'Nova mensagem de ' || NEW.sender_name,
      LEFT(NEW.content, 100),
      'chat',
      '/admin/projects/' || NEW.project_id,
      v_org_id
    );
  END LOOP;

  RETURN NEW;
END;
$function$;