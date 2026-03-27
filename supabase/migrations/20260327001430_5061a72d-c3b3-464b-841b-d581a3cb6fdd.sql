
CREATE TABLE public.system_node_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id text NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(node_id, organization_id)
);

ALTER TABLE public.system_node_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_node_notes_tenant_all" ON public.system_node_notes
  FOR ALL TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());
