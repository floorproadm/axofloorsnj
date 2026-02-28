
-- Create job_cost_items table for itemized cost tracking
CREATE TABLE public.job_cost_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_cost_id uuid NOT NULL REFERENCES public.job_costs(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'other',
  description text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.job_cost_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_cost_items_admin_all ON public.job_cost_items
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY job_cost_items_authenticated_read ON public.job_cost_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Trigger function to auto-sum items back into job_costs aggregates
CREATE OR REPLACE FUNCTION public.recalc_job_cost_aggregates()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_job_cost_id uuid;
BEGIN
  v_job_cost_id := COALESCE(NEW.job_cost_id, OLD.job_cost_id);

  UPDATE public.job_costs
  SET
    material_cost = COALESCE((SELECT SUM(amount) FROM public.job_cost_items WHERE job_cost_id = v_job_cost_id AND category = 'materials'), 0),
    labor_cost = COALESCE((SELECT SUM(amount) FROM public.job_cost_items WHERE job_cost_id = v_job_cost_id AND category = 'labor'), 0),
    additional_costs = COALESCE((SELECT SUM(amount) FROM public.job_cost_items WHERE job_cost_id = v_job_cost_id AND category IN ('overhead', 'other')), 0),
    updated_at = now()
  WHERE id = v_job_cost_id;

  RETURN NULL;
END;
$function$;

CREATE TRIGGER trg_recalc_job_cost_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON public.job_cost_items
  FOR EACH ROW EXECUTE FUNCTION public.recalc_job_cost_aggregates();
