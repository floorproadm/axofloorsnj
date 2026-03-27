
-- Table to store node overrides (edits, new nodes, deletions) per organization per tab
CREATE TABLE public.system_node_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tab_id text NOT NULL,
  node_id text NOT NULL,
  -- Override fields (NULL = use default from code)
  title text,
  subtitle text,
  tag text,
  color text,
  x numeric,
  y numeric,
  w numeric,
  h numeric,
  -- For new nodes (not in static data)
  is_custom boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, tab_id, node_id)
);

-- RLS
ALTER TABLE public.system_node_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_node_overrides_tenant_all"
  ON public.system_node_overrides
  FOR ALL
  TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- Table for custom arrows between nodes
CREATE TABLE public.system_node_arrows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tab_id text NOT NULL,
  from_node_id text NOT NULL,
  to_node_id text NOT NULL,
  dashed boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, tab_id, from_node_id, to_node_id)
);

ALTER TABLE public.system_node_arrows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_node_arrows_tenant_all"
  ON public.system_node_arrows
  FOR ALL
  TO authenticated
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());
