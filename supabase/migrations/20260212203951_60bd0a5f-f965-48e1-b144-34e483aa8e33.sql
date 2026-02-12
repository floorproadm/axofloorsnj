
-- 1) Tabela project_documents
CREATE TABLE public.project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  folder text NOT NULL DEFAULT 'other',
  file_name text NOT NULL,
  file_type text NOT NULL DEFAULT 'application/octet-stream',
  file_url text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'admin_upload',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_project_documents_project ON public.project_documents(project_id);
CREATE INDEX idx_project_documents_folder ON public.project_documents(project_id, folder);

-- Trigger updated_at
CREATE TRIGGER update_project_documents_updated_at
  BEFORE UPDATE ON public.project_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2) RLS
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_documents_authenticated_read"
  ON public.project_documents FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "project_documents_admin_insert"
  ON public.project_documents FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "project_documents_admin_update"
  ON public.project_documents FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "project_documents_admin_delete"
  ON public.project_documents FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Storage bucket (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: admin pode tudo, authenticated pode ler
CREATE POLICY "project_docs_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "project_docs_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'project-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "project_docs_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "project_docs_authenticated_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'project-documents' AND auth.uid() IS NOT NULL);
