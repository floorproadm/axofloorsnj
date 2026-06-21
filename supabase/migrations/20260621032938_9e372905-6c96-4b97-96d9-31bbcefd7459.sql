-- Clean any existing orphan references first so the FK can be created
UPDATE public.proposal_line_items pli
SET service_catalog_id = NULL
WHERE service_catalog_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.service_catalog sc WHERE sc.id = pli.service_catalog_id);

-- Add FK with ON DELETE SET NULL so deleting a catalog item preserves history
ALTER TABLE public.proposal_line_items
  ADD CONSTRAINT proposal_line_items_service_catalog_id_fkey
  FOREIGN KEY (service_catalog_id)
  REFERENCES public.service_catalog(id)
  ON DELETE SET NULL;
