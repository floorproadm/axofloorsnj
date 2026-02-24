
-- ============================================
-- FASE 1: Criar tabela media_files
-- ============================================
CREATE TABLE public.media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  feed_post_id uuid REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  uploaded_by uuid,
  uploaded_by_role text NOT NULL DEFAULT 'admin'
    CHECK (uploaded_by_role IN ('admin', 'collaborator', 'client', 'system')),
  source_type text NOT NULL DEFAULT 'admin_upload'
    CHECK (source_type IN ('feed', 'collaborator', 'admin_upload', 'marketing', 'system')),
  visibility text NOT NULL DEFAULT 'internal'
    CHECK (visibility IN ('internal', 'client', 'public')),
  folder_type text NOT NULL DEFAULT 'job_progress'
    CHECK (folder_type IN ('job_progress', 'before_after', 'marketing', 'document_attachment')),
  file_type text NOT NULL DEFAULT 'image'
    CHECK (file_type IN ('image', 'video', 'pdf')),
  storage_path text NOT NULL,
  thumbnail_path text,
  display_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}',
  quality_checked boolean NOT NULL DEFAULT false,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_media_files_project ON public.media_files(project_id);
CREATE INDEX idx_media_files_feed_post ON public.media_files(feed_post_id);
CREATE INDEX idx_media_files_visibility ON public.media_files(visibility);
CREATE INDEX idx_media_files_source ON public.media_files(source_type);
CREATE INDEX idx_media_files_folder ON public.media_files(folder_type);

-- updated_at trigger
CREATE TRIGGER trg_media_files_updated_at
  BEFORE UPDATE ON public.media_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY media_files_admin_all ON public.media_files
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public: read only visibility='public'
CREATE POLICY media_files_public_read ON public.media_files
  FOR SELECT TO anon
  USING (visibility = 'public');

-- Authenticated: read internal + client + public
CREATE POLICY media_files_authenticated_read ON public.media_files
  FOR SELECT TO authenticated
  USING (visibility IN ('internal', 'client', 'public'));

-- ============================================
-- FASE 2: Criar bucket media (privado)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false);

-- Storage policies para bucket media
CREATE POLICY media_admin_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY media_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY media_authenticated_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'media');

CREATE POLICY media_anon_read ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'media');

CREATE POLICY media_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
