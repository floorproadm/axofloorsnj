
-- ============ PROJECT PHOTOS ============
CREATE TABLE public.project_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  photo_url text NOT NULL,
  thumbnail_url text,
  taken_at timestamptz NOT NULL DEFAULT now(),
  latitude numeric(10,6),
  longitude numeric(10,6),
  location_label text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_project_photos_project ON public.project_photos(project_id, taken_at DESC);
CREATE INDEX idx_project_photos_org ON public.project_photos(organization_id, taken_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_photos TO authenticated;
GRANT ALL ON public.project_photos TO service_role;

ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read project_photos"
  ON public.project_photos FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "org members insert project_photos"
  ON public.project_photos FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "org members update project_photos"
  ON public.project_photos FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "org members delete project_photos"
  ON public.project_photos FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id());

-- ============ BEFORE / AFTER ============
CREATE TABLE public.before_after_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  before_photo_id uuid REFERENCES public.project_photos(id) ON DELETE SET NULL,
  after_photo_id uuid REFERENCES public.project_photos(id) ON DELETE SET NULL,
  before_url text NOT NULL,
  after_url text NOT NULL,
  title text NOT NULL DEFAULT 'Before & After',
  completed_date date,
  share_token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ba_project ON public.before_after_pairs(project_id, created_at DESC);
CREATE INDEX idx_ba_org ON public.before_after_pairs(organization_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.before_after_pairs TO authenticated;
GRANT ALL ON public.before_after_pairs TO service_role;

ALTER TABLE public.before_after_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read ba" ON public.before_after_pairs
  FOR SELECT TO authenticated USING (organization_id = public.get_user_org_id());
CREATE POLICY "org members write ba" ON public.before_after_pairs
  FOR INSERT TO authenticated WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "org members update ba" ON public.before_after_pairs
  FOR UPDATE TO authenticated USING (organization_id = public.get_user_org_id());
CREATE POLICY "org members delete ba" ON public.before_after_pairs
  FOR DELETE TO authenticated USING (organization_id = public.get_user_org_id());

-- ============ PUBLIC SHARE RPC ============
CREATE OR REPLACE FUNCTION public.get_shared_before_after(p_token text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', id,
    'title', title,
    'before_url', before_url,
    'after_url', after_url,
    'completed_date', completed_date,
    'created_at', created_at
  )
  FROM public.before_after_pairs
  WHERE share_token = p_token
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_shared_before_after(text) TO anon, authenticated;

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-photos', 'project-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "project-photos public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'project-photos');

CREATE POLICY "project-photos auth upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-photos');

CREATE POLICY "project-photos auth update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-photos');

CREATE POLICY "project-photos auth delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-photos');
