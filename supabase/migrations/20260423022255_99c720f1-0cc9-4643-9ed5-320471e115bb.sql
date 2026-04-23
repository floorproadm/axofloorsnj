-- Table for client-submitted change requests on proposals
CREATE TABLE public.proposal_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

CREATE INDEX idx_proposal_change_requests_proposal ON public.proposal_change_requests(proposal_id);
CREATE INDEX idx_proposal_change_requests_org ON public.proposal_change_requests(organization_id);

ALTER TABLE public.proposal_change_requests ENABLE ROW LEVEL SECURITY;

-- Public insert: only if the customer_id matches a customer with a portal_token (anonymous request from portal)
CREATE POLICY "Anonymous can submit change requests via portal token"
ON public.proposal_change_requests
FOR INSERT
TO anon
WITH CHECK (
  customer_id IN (
    SELECT id FROM public.customers WHERE portal_token IS NOT NULL
  )
  AND proposal_id IN (
    SELECT id FROM public.proposals WHERE customer_id = proposal_change_requests.customer_id
  )
);

-- Public select: only own change requests via portal_token customer
CREATE POLICY "Anonymous can view change requests for portal customers"
ON public.proposal_change_requests
FOR SELECT
TO anon
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE portal_token IS NOT NULL
  )
);

-- Org members can do everything for their org
CREATE POLICY "Org members can view change requests"
ON public.proposal_change_requests
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org members can update change requests"
ON public.proposal_change_requests
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org members can delete change requests"
ON public.proposal_change_requests
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

-- Notify org admins when a new change request is submitted
CREATE OR REPLACE FUNCTION public.notify_proposal_change_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_name text;
  v_member RECORD;
BEGIN
  SELECT full_name INTO v_customer_name FROM public.customers WHERE id = NEW.customer_id;

  FOR v_member IN
    SELECT user_id FROM public.organization_members
    WHERE organization_id = NEW.organization_id
      AND role IN ('owner', 'admin')
  LOOP
    INSERT INTO public.notifications (user_id, organization_id, type, title, body, link)
    VALUES (
      v_member.user_id,
      NEW.organization_id,
      'proposal_change_request',
      'Change request from ' || COALESCE(v_customer_name, 'a client'),
      LEFT(NEW.message, 200),
      '/admin/proposals'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_proposal_change_request
AFTER INSERT ON public.proposal_change_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_proposal_change_request();