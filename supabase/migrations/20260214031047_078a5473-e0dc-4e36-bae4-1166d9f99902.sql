
-- Measurements table linked to projects
CREATE TABLE public.project_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed')),
  measurement_date TIMESTAMPTZ,
  measured_by TEXT,
  total_sqft NUMERIC NOT NULL DEFAULT 0,
  total_linear_ft NUMERIC NOT NULL DEFAULT 0,
  service_type TEXT,
  material TEXT,
  finish_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual area/room measurements
CREATE TABLE public.measurement_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  measurement_id UUID NOT NULL REFERENCES public.project_measurements(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  area_sqft NUMERIC NOT NULL DEFAULT 0,
  linear_ft NUMERIC NOT NULL DEFAULT 0,
  dimensions TEXT, -- e.g. "20' x 20'"
  area_type TEXT NOT NULL DEFAULT 'floor' CHECK (area_type IN ('floor', 'staircase', 'baseboard', 'handrail', 'other')),
  notes TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_areas ENABLE ROW LEVEL SECURITY;

-- RLS: Admin full access
CREATE POLICY "measurements_admin_all" ON public.project_measurements
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "measurement_areas_admin_all" ON public.measurement_areas
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_project_measurements_updated_at
  BEFORE UPDATE ON public.project_measurements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-calculate total_sqft on area changes
CREATE OR REPLACE FUNCTION public.recalc_measurement_totals()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.project_measurements pm
  SET total_sqft = COALESCE((SELECT SUM(area_sqft) FROM public.measurement_areas WHERE measurement_id = pm.id AND area_type = 'floor'), 0),
      total_linear_ft = COALESCE((SELECT SUM(linear_ft) FROM public.measurement_areas WHERE measurement_id = pm.id AND area_type IN ('baseboard', 'handrail')), 0),
      updated_at = now()
  WHERE pm.id = COALESCE(NEW.measurement_id, OLD.measurement_id);
  RETURN NULL;
END;
$$;

CREATE TRIGGER recalc_measurement_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.measurement_areas
  FOR EACH ROW EXECUTE FUNCTION public.recalc_measurement_totals();
