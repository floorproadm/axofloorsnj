
-- 1. Structured admin-only fields on leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS next_step TEXT,
  ADD COLUMN IF NOT EXISTS expected_close_date DATE,
  ADD COLUMN IF NOT EXISTS internal_note_for_partner TEXT;

-- 2. Shared messages thread
CREATE TABLE IF NOT EXISTS public.referral_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('admin', 'partner')),
  author_user_id UUID,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_messages_lead_id ON public.referral_messages(lead_id, created_at DESC);

ALTER TABLE public.referral_messages ENABLE ROW LEVEL SECURITY;

-- Partner: read own referral messages
CREATE POLICY "Partner reads messages on own referrals"
ON public.referral_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = referral_messages.lead_id
      AND l.referred_by_partner_id = public.get_partner_id_for_user()
  )
);

-- Partner: insert messages on own referrals (must self-identify as partner)
CREATE POLICY "Partner writes messages on own referrals"
ON public.referral_messages FOR INSERT
WITH CHECK (
  author_role = 'partner'
  AND author_user_id = auth.uid()
  AND organization_id = public.get_partner_org_for_user()
  AND EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = referral_messages.lead_id
      AND l.referred_by_partner_id = public.get_partner_id_for_user()
  )
);

-- Admin: read all in org
CREATE POLICY "Admin reads org referral messages"
ON public.referral_messages FOR SELECT
USING (organization_id = public.get_user_org_id());

-- Admin: write in org as admin
CREATE POLICY "Admin writes org referral messages"
ON public.referral_messages FOR INSERT
WITH CHECK (
  author_role = 'admin'
  AND author_user_id = auth.uid()
  AND organization_id = public.get_user_org_id()
);

-- Notify the other side when a message is posted
CREATE OR REPLACE FUNCTION public.notify_on_referral_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_recipient RECORD;
BEGIN
  SELECT * INTO v_lead FROM public.leads WHERE id = NEW.lead_id;

  IF NEW.author_role = 'partner' THEN
    -- notify admins/owners
    FOR v_recipient IN
      SELECT om.user_id FROM public.organization_members om
      WHERE om.organization_id = NEW.organization_id
        AND om.role IN ('owner', 'admin')
    LOOP
      INSERT INTO public.notifications (user_id, organization_id, type, title, body, link)
      VALUES (
        v_recipient.user_id,
        NEW.organization_id,
        'referral_message',
        '🤝 Message from ' || NEW.author_name,
        'Re: ' || COALESCE(v_lead.name, 'referral') || ' — ' || LEFT(NEW.content, 100),
        '/admin/leads/' || NEW.lead_id
      );
    END LOOP;
  ELSIF NEW.author_role = 'admin' THEN
    -- notify partner user(s)
    FOR v_recipient IN
      SELECT pu.user_id FROM public.partner_users pu
      WHERE pu.partner_id = v_lead.referred_by_partner_id
    LOOP
      INSERT INTO public.notifications (user_id, organization_id, type, title, body, link)
      VALUES (
        v_recipient.user_id,
        NEW.organization_id,
        'referral_message',
        'Update on ' || COALESCE(v_lead.name, 'your referral'),
        LEFT(NEW.content, 120),
        '/partner/dashboard'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_referral_message ON public.referral_messages;
CREATE TRIGGER trg_notify_on_referral_message
AFTER INSERT ON public.referral_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_referral_message();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_messages;
ALTER TABLE public.referral_messages REPLICA IDENTITY FULL;
