-- Add materials qualification fields to leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS materials_status text,
  ADD COLUMN IF NOT EXISTS material_delivered text;

-- Constrain to expected values (nullable allowed for non-install leads)
ALTER TABLE public.leads
  ADD CONSTRAINT leads_materials_status_check
  CHECK (materials_status IS NULL OR materials_status IN ('customer_has', 'axo_supply', 'needs_help'));

ALTER TABLE public.leads
  ADD CONSTRAINT leads_material_delivered_check
  CHECK (material_delivered IS NULL OR material_delivered IN ('yes', 'no', 'not_sure'));

CREATE INDEX IF NOT EXISTS idx_leads_materials_status ON public.leads(materials_status) WHERE materials_status IS NOT NULL;