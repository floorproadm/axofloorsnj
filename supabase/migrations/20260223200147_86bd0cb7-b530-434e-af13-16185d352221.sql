
-- Fix: Set views to SECURITY INVOKER so RLS policies of the querying user apply
ALTER VIEW public.view_pipeline_metrics SET (security_invoker = on);
ALTER VIEW public.view_financial_metrics SET (security_invoker = on);
ALTER VIEW public.view_stage_aging SET (security_invoker = on);
