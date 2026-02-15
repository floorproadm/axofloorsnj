
-- Create feed-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('feed-media', 'feed-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload to feed-media
CREATE POLICY "feed_media_admin_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'feed-media'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow admins to update feed-media objects
CREATE POLICY "feed_media_admin_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'feed-media'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow admins to delete feed-media objects
CREATE POLICY "feed_media_admin_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'feed-media'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow public read for feed-media
CREATE POLICY "feed_media_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'feed-media');
