ALTER TABLE public.company_settings
  DROP COLUMN IF EXISTS trust_builders,
  DROP COLUMN IF EXISTS projects_completed,
  DROP COLUMN IF EXISTS years_in_business,
  DROP COLUMN IF EXISTS google_rating;