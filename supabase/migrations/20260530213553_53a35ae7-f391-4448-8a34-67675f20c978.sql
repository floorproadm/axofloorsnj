-- Add watermark configuration columns to company_settings
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS watermark_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS watermark_image_url text,
  ADD COLUMN IF NOT EXISTS watermark_position text NOT NULL DEFAULT 'bottom-right';

ALTER TABLE public.company_settings
  DROP CONSTRAINT IF EXISTS company_settings_watermark_position_check;
ALTER TABLE public.company_settings
  ADD CONSTRAINT company_settings_watermark_position_check
  CHECK (watermark_position IN ('bottom-right','bottom-left','bottom-center'));

-- Create public bucket for watermark images
INSERT INTO storage.buckets (id, name, public)
VALUES ('watermark-images', 'watermark-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (public read; authenticated write/update/delete)
DROP POLICY IF EXISTS "Watermark images public read" ON storage.objects;
CREATE POLICY "Watermark images public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'watermark-images');

DROP POLICY IF EXISTS "Watermark images authenticated upload" ON storage.objects;
CREATE POLICY "Watermark images authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'watermark-images');

DROP POLICY IF EXISTS "Watermark images authenticated update" ON storage.objects;
CREATE POLICY "Watermark images authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'watermark-images');

DROP POLICY IF EXISTS "Watermark images authenticated delete" ON storage.objects;
CREATE POLICY "Watermark images authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'watermark-images');