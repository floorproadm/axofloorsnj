
-- 1) Photo annotations: add annotated_url to existing project_photos
ALTER TABLE public.project_photos
  ADD COLUMN IF NOT EXISTS annotated_url text;

-- 2) project_checklists
CREATE TABLE public.project_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completed_by text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_checklists_project ON public.project_checklists(project_id, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_checklists TO authenticated;
GRANT ALL ON public.project_checklists TO service_role;

ALTER TABLE public.project_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members manage checklists"
  ON public.project_checklists
  FOR ALL
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE TRIGGER trg_project_checklists_updated_at
  BEFORE UPDATE ON public.project_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) project_notes (technical sheet) — one row per project
CREATE TABLE public.project_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  wood_type text,
  stain text,
  finish_type text,
  coats int,
  client_notes text,
  tech_notes text,
  actual_start_date date,
  actual_end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_notes TO authenticated;
GRANT ALL ON public.project_notes TO service_role;

ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members manage project notes"
  ON public.project_notes
  FOR ALL
  TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE TRIGGER trg_project_notes_updated_at
  BEFORE UPDATE ON public.project_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
