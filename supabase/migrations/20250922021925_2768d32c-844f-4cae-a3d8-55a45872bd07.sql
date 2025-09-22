-- Create storage policies for gallery bucket uploads
-- Allow anyone to upload to gallery bucket (for admin uploads)
CREATE POLICY "Allow public uploads to gallery bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'gallery');

-- Allow anyone to view gallery images since bucket is public
CREATE POLICY "Allow public access to gallery images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'gallery');

-- Allow updates to gallery objects
CREATE POLICY "Allow public updates to gallery objects" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'gallery');

-- Allow deletes for gallery objects
CREATE POLICY "Allow public deletes from gallery objects" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'gallery');