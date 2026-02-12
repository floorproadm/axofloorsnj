
-- Add missing columns to project_documents
ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'misc',
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON public.project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_category ON public.project_documents(category);
