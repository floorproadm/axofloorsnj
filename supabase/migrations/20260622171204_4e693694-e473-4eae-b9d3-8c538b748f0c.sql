
ALTER TABLE public.visualizer_usage
  ADD COLUMN IF NOT EXISTS event TEXT NOT NULL DEFAULT 'miss',
  ADD COLUMN IF NOT EXISTS latency_ms INTEGER,
  ADD COLUMN IF NOT EXISTS style_name TEXT,
  ADD COLUMN IF NOT EXISTS reason TEXT;

CREATE INDEX IF NOT EXISTS visualizer_usage_event_created_idx
  ON public.visualizer_usage (event, created_at DESC);

CREATE INDEX IF NOT EXISTS visualizer_usage_created_idx
  ON public.visualizer_usage (created_at DESC);
