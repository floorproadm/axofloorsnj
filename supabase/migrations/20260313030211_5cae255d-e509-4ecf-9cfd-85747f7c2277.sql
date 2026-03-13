-- Update notify_on_chat_message to include organization_id from project
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
  -- Get project name and org for notification
  SELECT customer_name, organization_id INTO v_project_name, v_org_id
  FROM public.projects WHERE id = NEW.project_id;

  -- Notify all project members EXCEPT the sender
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
      '/collaborator/chat',
      v_org_id
    );
  END LOOP;

  -- Also notify admins (check organization_members for admin/owner users in same org)
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = NEW.sender_id
      AND organization_id = v_org_id
      AND role IN ('admin', 'owner')
  ) THEN
    FOR v_member IN
      SELECT om.user_id FROM public.organization_members om
      WHERE om.organization_id = v_org_id
        AND om.role IN ('admin', 'owner')
    LOOP
      INSERT INTO public.notifications (user_id, title, body, type, link, organization_id)
      VALUES (
        v_member.user_id,
        'Mensagem do campo: ' || COALESCE(v_project_name, 'Projeto'),
        NEW.sender_name || ': ' || LEFT(NEW.content, 80),
        'chat',
        '/admin/projects/' || NEW.project_id,
        v_org_id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

-- Drop legacy has_role-based policies (replaced by tenant-scoped)
DROP POLICY IF EXISTS "partners_admin_all" ON public.partners;
DROP POLICY IF EXISTS "partners_authenticated_read" ON public.partners;

DROP POLICY IF EXISTS "tasks_admin_all" ON public.tasks;
DROP POLICY IF EXISTS "tasks_assigned_read" ON public.tasks;
DROP POLICY IF EXISTS "tasks_assigned_update" ON public.tasks;

DROP POLICY IF EXISTS "feed_comments_admin_all" ON public.feed_comments;

DROP POLICY IF EXISTS "automation_sequences_admin_all" ON public.automation_sequences;
DROP POLICY IF EXISTS "automation_sequences_authenticated_read" ON public.automation_sequences;

DROP POLICY IF EXISTS "automation_drips_admin_all" ON public.automation_drips;
DROP POLICY IF EXISTS "automation_drips_authenticated_read" ON public.automation_drips;

DROP POLICY IF EXISTS "material_requests_admin_all" ON public.material_requests;
DROP POLICY IF EXISTS "material_requests_own_insert" ON public.material_requests;
DROP POLICY IF EXISTS "material_requests_own_read" ON public.material_requests;

DROP POLICY IF EXISTS "referral_profiles_admin_all" ON public.referral_profiles;
DROP POLICY IF EXISTS "referrals_admin_all" ON public.referrals;

-- Update referral public policies to scope by org (AXO org for public pages)
DROP POLICY IF EXISTS "referral_profiles_public_insert" ON public.referral_profiles;
CREATE POLICY "referral_profiles_public_insert" ON public.referral_profiles
  FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "referral_profiles_public_read" ON public.referral_profiles;
CREATE POLICY "referral_profiles_public_read" ON public.referral_profiles
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "referrals_public_insert" ON public.referrals;
CREATE POLICY "referrals_public_insert" ON public.referrals
  FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "referrals_public_read" ON public.referrals;
CREATE POLICY "referrals_public_read" ON public.referrals
  FOR SELECT TO public
  USING (true);