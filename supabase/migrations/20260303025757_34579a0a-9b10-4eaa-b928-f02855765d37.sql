
-- Add image_url column to service_catalog
ALTER TABLE public.service_catalog ADD COLUMN IF NOT EXISTS image_url text;

-- Storage policy: allow admins to upload to catalog/ path in media bucket
CREATE POLICY "catalog_admin_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'catalog'
  AND public.has_role(auth.uid(), 'admin')
);

-- Storage policy: allow admins to update catalog files
CREATE POLICY "catalog_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'catalog'
  AND public.has_role(auth.uid(), 'admin')
);

-- Storage policy: allow admins to delete catalog files
CREATE POLICY "catalog_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'catalog'
  AND public.has_role(auth.uid(), 'admin')
);

-- Storage policy: allow authenticated users to read catalog files (for signed URLs)
CREATE POLICY "catalog_authenticated_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'catalog'
);
