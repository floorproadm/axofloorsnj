
CREATE TABLE public.crew_unavailability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_member_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crew_unavailability TO authenticated;
GRANT ALL ON public.crew_unavailability TO service_role;

ALTER TABLE public.crew_unavailability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crew_unavailability_tenant_all"
ON public.crew_unavailability
FOR ALL
TO authenticated
USING (organization_id = get_user_org_id())
WITH CHECK (organization_id = get_user_org_id());

CREATE INDEX idx_crew_unavail_crew_dates ON public.crew_unavailability(crew_member_id, start_date, end_date);
CREATE INDEX idx_crew_unavail_org ON public.crew_unavailability(organization_id);
