ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS trust_builders jsonb NOT NULL DEFAULT '[
    {"icon":"ShieldCheck","title":"Licensed & Insured","description":"Fully licensed contractor with comprehensive liability coverage."},
    {"icon":"Award","title":"Craftsmanship Guarantee","description":"Every install and refinish backed by Woody''s Guarantee."},
    {"icon":"Clock","title":"On-Time Delivery","description":"Clear timelines, daily updates, and zero ghosting."}
  ]'::jsonb,
  ADD COLUMN IF NOT EXISTS projects_completed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS years_in_business integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS google_rating numeric(2,1) NOT NULL DEFAULT 5.0;