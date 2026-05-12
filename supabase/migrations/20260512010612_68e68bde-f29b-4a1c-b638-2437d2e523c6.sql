
CREATE TABLE public.partner_invite_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  recipient_email text NOT NULL,
  invite_kind text NOT NULL DEFAULT 'invite',
  status text NOT NULL DEFAULT 'sent',
  link_id text,
  error_message text,
  sent_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_invite_logs_partner ON public.partner_invite_logs(partner_id, created_at DESC);
CREATE INDEX idx_partner_invite_logs_org ON public.partner_invite_logs(organization_id, created_at DESC);

ALTER TABLE public.partner_invite_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_invite_logs_tenant_read"
ON public.partner_invite_logs FOR SELECT
TO authenticated
USING (organization_id = get_user_org_id());

CREATE POLICY "partner_invite_logs_tenant_insert"
ON public.partner_invite_logs FOR INSERT
TO authenticated
WITH CHECK (organization_id = get_user_org_id());
