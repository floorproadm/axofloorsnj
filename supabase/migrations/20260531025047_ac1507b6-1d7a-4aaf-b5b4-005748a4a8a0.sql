
-- Add pay_mode + sqft fields to labor_entries
ALTER TABLE public.labor_entries
  ADD COLUMN pay_mode text NOT NULL DEFAULT 'daily',
  ADD COLUMN sqft_worked numeric,
  ADD COLUMN sqft_rate numeric;

ALTER TABLE public.labor_entries
  ADD CONSTRAINT labor_entries_pay_mode_check CHECK (pay_mode IN ('daily','sqft'));

ALTER TABLE public.labor_entries
  ADD CONSTRAINT labor_entries_pay_mode_fields_check CHECK (
    (pay_mode = 'daily' AND daily_rate IS NOT NULL AND days_worked IS NOT NULL)
    OR
    (pay_mode = 'sqft' AND sqft_rate IS NOT NULL AND sqft_worked IS NOT NULL)
  );

-- Replace total_cost generated column to handle both modes
ALTER TABLE public.labor_entries DROP COLUMN total_cost;
ALTER TABLE public.labor_entries
  ADD COLUMN total_cost numeric GENERATED ALWAYS AS (
    CASE
      WHEN pay_mode = 'sqft' THEN COALESCE(sqft_rate, 0) * COALESCE(sqft_worked, 0)
      ELSE COALESCE(daily_rate, 0) * COALESCE(days_worked, 0)
    END
  ) STORED;

-- Add labor_sqft_rate to projects (admin-defined per project)
ALTER TABLE public.projects
  ADD COLUMN labor_sqft_rate numeric;
