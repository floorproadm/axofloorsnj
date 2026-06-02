-- Add receipt photo support to payments (expenses)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS receipt_photo_url text;

-- Create private receipts bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for receipts bucket
CREATE POLICY "receipts_authenticated_read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'receipts');

CREATE POLICY "receipts_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "receipts_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'receipts');

CREATE POLICY "receipts_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'receipts');