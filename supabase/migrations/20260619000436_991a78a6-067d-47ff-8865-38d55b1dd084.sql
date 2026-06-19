
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS portfolio_photo_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

ALTER TABLE public.gallery_projects
  ADD COLUMN IF NOT EXISTS tag text,
  ADD COLUMN IF NOT EXISTS service_category text,
  ADD COLUMN IF NOT EXISTS paired_before_id uuid REFERENCES public.gallery_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS gallery_projects_paired_before_id_idx
  ON public.gallery_projects(paired_before_id);
