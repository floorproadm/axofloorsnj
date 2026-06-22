
CREATE TABLE public.visualizer_usage (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX visualizer_usage_ip_created_idx ON public.visualizer_usage (ip, created_at DESC);
GRANT ALL ON public.visualizer_usage TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.visualizer_usage_id_seq TO service_role;
ALTER TABLE public.visualizer_usage ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (edge function) touches this table.
