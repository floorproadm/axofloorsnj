ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS tagline TEXT;

-- Seed current AXO defaults so existing proposals keep their look until admin updates
UPDATE public.company_settings
SET
  phone = COALESCE(phone, '(732) 351-8653'),
  email = COALESCE(email, 'info@axofloors.com'),
  website = COALESCE(website, 'www.axofloors.com'),
  tagline = COALESCE(tagline, 'Professional Flooring Services')
WHERE singleton_key = true;