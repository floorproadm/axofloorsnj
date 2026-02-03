-- Create job_costs table for margin tracking per project
CREATE TABLE public.job_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  labor_cost NUMERIC NOT NULL DEFAULT 0,
  material_cost NUMERIC NOT NULL DEFAULT 0,
  additional_costs NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC GENERATED ALWAYS AS (labor_cost + material_cost + additional_costs) STORED,
  estimated_revenue NUMERIC NOT NULL DEFAULT 0,
  margin_percent NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN estimated_revenue > 0 THEN ROUND(((estimated_revenue - (labor_cost + material_cost + additional_costs)) / estimated_revenue) * 100, 2)
      ELSE 0 
    END
  ) STORED,
  profit_amount NUMERIC GENERATED ALWAYS AS (estimated_revenue - (labor_cost + material_cost + additional_costs)) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_project_cost UNIQUE (project_id)
);

-- Enable RLS
ALTER TABLE public.job_costs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view job costs"
ON public.job_costs FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create job costs"
ON public.job_costs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update job costs"
ON public.job_costs FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete job costs"
ON public.job_costs FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_job_costs_updated_at
  BEFORE UPDATE ON public.job_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate and validate job margin
CREATE OR REPLACE FUNCTION public.calculate_job_margin(p_project_id UUID)
RETURNS TABLE (
  project_id UUID,
  labor_cost NUMERIC,
  material_cost NUMERIC,
  additional_costs NUMERIC,
  total_cost NUMERIC,
  estimated_revenue NUMERIC,
  margin_percent NUMERIC,
  profit_amount NUMERIC,
  margin_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_min_margin NUMERIC;
BEGIN
  -- Get company minimum margin requirement
  SELECT default_margin_min_percent INTO v_company_min_margin
  FROM public.company_settings
  LIMIT 1;

  -- If no company settings, default to 30%
  v_company_min_margin := COALESCE(v_company_min_margin, 30);

  RETURN QUERY
  SELECT 
    jc.project_id,
    jc.labor_cost,
    jc.material_cost,
    jc.additional_costs,
    jc.total_cost,
    jc.estimated_revenue,
    jc.margin_percent,
    jc.profit_amount,
    CASE
      WHEN jc.estimated_revenue = 0 THEN 'ERROR: No revenue set'
      WHEN jc.margin_percent < v_company_min_margin THEN 'WARNING: Below minimum margin (' || v_company_min_margin || '%)'
      ELSE 'OK: Margin acceptable'
    END AS margin_status
  FROM public.job_costs jc
  WHERE jc.project_id = p_project_id;

  -- If no record found, raise error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERROR: No margin data found for project %', p_project_id;
  END IF;
END;
$$;