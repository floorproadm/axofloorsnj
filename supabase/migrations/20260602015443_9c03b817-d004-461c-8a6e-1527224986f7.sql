ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS default_arrival_window integer;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS arrival_window_minutes integer;

COMMENT ON COLUMN public.company_settings.default_arrival_window IS 'Default arrival window in minutes (e.g. 15, 30, 60, 120, 180, 240). NULL = no window shown.';
COMMENT ON COLUMN public.appointments.arrival_window_minutes IS 'Per-appointment arrival window in minutes. NULL = inherit company_settings.default_arrival_window.';