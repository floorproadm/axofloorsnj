
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS share_token text UNIQUE DEFAULT NULL;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS viewed_at timestamp with time zone DEFAULT NULL;

CREATE POLICY "invoices_public_read_by_token"
ON public.invoices
FOR SELECT
TO anon
USING (share_token IS NOT NULL);

CREATE POLICY "invoices_public_mark_viewed"
ON public.invoices
FOR UPDATE
TO anon
USING (share_token IS NOT NULL)
WITH CHECK (share_token IS NOT NULL);

CREATE POLICY "invoice_items_public_read_by_token"
ON public.invoice_items
FOR SELECT
TO anon
USING (invoice_id IN (SELECT id FROM public.invoices WHERE share_token IS NOT NULL));

CREATE POLICY "invoice_payment_schedule_public_read_by_token"
ON public.invoice_payment_schedule
FOR SELECT
TO anon
USING (invoice_id IN (SELECT id FROM public.invoices WHERE share_token IS NOT NULL));
