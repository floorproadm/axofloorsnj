ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_drip_logs;
ALTER TABLE public.automation_drip_logs REPLICA IDENTITY FULL;