ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS proposal_logo_light_url TEXT,
ADD COLUMN IF NOT EXISTS proposal_logo_dark_url TEXT;