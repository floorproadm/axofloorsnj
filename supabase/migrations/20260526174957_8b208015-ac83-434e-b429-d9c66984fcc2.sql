ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS default_job_start_time TEXT NOT NULL DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS custom_send_time TEXT NOT NULL DEFAULT '09:00';

GRANT SELECT, UPDATE ON public.company_settings TO authenticated;
GRANT ALL ON public.company_settings TO service_role;