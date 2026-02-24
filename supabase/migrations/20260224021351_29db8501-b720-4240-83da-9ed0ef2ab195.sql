
ALTER TABLE public.media_files
  ADD COLUMN is_marketing_asset boolean NOT NULL DEFAULT false;

CREATE INDEX idx_media_files_marketing
  ON public.media_files(is_marketing_asset)
  WHERE is_marketing_asset = true;

ALTER TABLE public.projects
  ADD COLUMN requires_progress_photos boolean NOT NULL DEFAULT true;
