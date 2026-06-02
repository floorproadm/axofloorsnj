ALTER TABLE public.service_catalog
  ADD COLUMN IF NOT EXISTS unit_cost numeric,
  ADD COLUMN IF NOT EXISTS markup_percent numeric;

ALTER TABLE public.proposal_line_items
  ADD COLUMN IF NOT EXISTS unit_cost_snapshot numeric;