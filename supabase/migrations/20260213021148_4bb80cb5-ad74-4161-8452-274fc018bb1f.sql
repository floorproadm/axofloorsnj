
-- Tabela principal: proposals
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  proposal_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  good_price numeric NOT NULL,
  better_price numeric NOT NULL,
  best_price numeric NOT NULL,
  margin_good numeric NOT NULL,
  margin_better numeric NOT NULL,
  margin_best numeric NOT NULL,
  selected_tier text NULL,
  valid_until date NOT NULL,
  sent_at timestamptz NULL,
  accepted_at timestamptz NULL,
  pdf_document_id uuid NULL REFERENCES public.project_documents(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT proposals_status_check CHECK (status IN ('draft','sent','viewed','accepted','rejected','expired')),
  CONSTRAINT proposals_selected_tier_check CHECK (selected_tier IN ('good','better','best') OR selected_tier IS NULL)
);

-- Índices
CREATE INDEX idx_proposals_project_id ON public.proposals(project_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);

-- RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposals_authenticated_read"
  ON public.proposals FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "proposals_admin_insert"
  ON public.proposals FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "proposals_admin_update"
  ON public.proposals FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "proposals_admin_delete"
  ON public.proposals FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
