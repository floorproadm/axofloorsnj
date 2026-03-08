ALTER TABLE public.proposals
ADD COLUMN use_tiers boolean NOT NULL DEFAULT true,
ADD COLUMN flat_price numeric NULL;