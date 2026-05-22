ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS content_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hidden_sections text[] NOT NULL DEFAULT '{}'::text[];