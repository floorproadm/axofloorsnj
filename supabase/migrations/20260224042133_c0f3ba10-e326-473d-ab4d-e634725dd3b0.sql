-- Allow public read access to branding assets in media bucket
CREATE POLICY "Public read access to branding assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = 'branding');
