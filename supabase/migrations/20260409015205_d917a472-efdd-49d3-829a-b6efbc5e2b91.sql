
-- Add deposit_amount to invoices
ALTER TABLE public.invoices ADD COLUMN deposit_amount numeric NOT NULL DEFAULT 0;

-- Add detail to invoice_items
ALTER TABLE public.invoice_items ADD COLUMN detail text;

-- Create invoice_payment_schedule table
CREATE TABLE public.invoice_payment_schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  phase_label text NOT NULL DEFAULT '',
  percentage numeric NOT NULL DEFAULT 0,
  timing text NOT NULL DEFAULT '',
  phase_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_payment_schedule ENABLE ROW LEVEL SECURITY;

-- RLS: org isolation via parent invoice
CREATE POLICY "invoice_payment_schedule_tenant_all"
ON public.invoice_payment_schedule
FOR ALL
TO authenticated
USING (invoice_id IN (SELECT id FROM invoices WHERE organization_id = get_user_org_id()))
WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE organization_id = get_user_org_id()));
