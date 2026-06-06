CREATE OR REPLACE FUNCTION public.notify_on_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_recipient uuid;
  v_project_name text;
  v_org_id uuid;
BEGIN
  SELECT customer_name, organization_id INTO v_project_name, v_org_id
  FROM public.projects WHERE id = NEW.project_id;

  -- Notify project members AND org admins/managers (deduplicated), excluding sender.
  FOR v_recipient IN
    SELECT pm.user_id
    FROM public.project_members pm
    WHERE pm.project_id = NEW.project_id
      AND pm.user_id != NEW.sender_id
    UNION
    SELECT ur.user_id
    FROM public.user_roles ur
    JOIN public.organization_members om ON om.user_id = ur.user_id
    WHERE ur.role IN ('admin'::app_role, 'manager'::app_role)
      AND om.organization_id = v_org_id
      AND ur.user_id != NEW.sender_id
  LOOP
    INSERT INTO public.notifications (user_id, title, body, type, link, organization_id)
    VALUES (
      v_recipient,
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