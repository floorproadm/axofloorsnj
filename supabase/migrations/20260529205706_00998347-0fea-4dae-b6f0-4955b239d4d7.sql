-- Check-in / Check-out de execução
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS finished_at timestamptz,
  ADD COLUMN IF NOT EXISTS actual_duration_minutes integer;

-- Trigger to auto-calculate actual_duration_minutes
CREATE OR REPLACE FUNCTION public.appointments_calc_actual_duration()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.started_at IS NOT NULL AND NEW.finished_at IS NOT NULL THEN
    NEW.actual_duration_minutes := GREATEST(0, EXTRACT(EPOCH FROM (NEW.finished_at - NEW.started_at))::int / 60);
  ELSE
    NEW.actual_duration_minutes := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointments_calc_actual_duration ON public.appointments;
CREATE TRIGGER trg_appointments_calc_actual_duration
BEFORE INSERT OR UPDATE OF started_at, finished_at ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.appointments_calc_actual_duration();