ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS admin_base_url text,
  ADD COLUMN IF NOT EXISTS facebook_pixel_id text,
  ADD COLUMN IF NOT EXISTS notion_database_id text,
  ADD COLUMN IF NOT EXISTS google_review_url text,
  ADD COLUMN IF NOT EXISTS email_from_name text;

UPDATE public.company_settings
SET
  admin_base_url    = COALESCE(admin_base_url, 'https://axofloorsnj.com/admin'),
  facebook_pixel_id = COALESCE(facebook_pixel_id, '403151700983838'),
  email_from_name   = COALESCE(email_from_name, 'AXO Floors'),
  google_review_url = COALESCE(google_review_url, 'https://g.page/r/CW2mOYkIlVC-EAE/review')
WHERE organization_id = 'a0000000-0000-0000-0000-000000000001';