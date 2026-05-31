-- Soft delete para leads com janela de recuperação de 30 dias
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_deleted_at
  ON public.leads (deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_active
  ON public.leads (organization_id, status)
  WHERE deleted_at IS NULL;

-- Função para limpar permanentemente leads soft-deleted há mais de 30 dias
CREATE OR REPLACE FUNCTION public.purge_expired_deleted_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.leads
  WHERE deleted_at IS NOT NULL
    AND deleted_at < (now() - INTERVAL '30 days');
END;
$$;

-- Agenda diária às 03:00 UTC para purga (usa pg_cron já habilitado)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('purge-expired-deleted-leads')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-expired-deleted-leads');
    PERFORM cron.schedule(
      'purge-expired-deleted-leads',
      '0 3 * * *',
      $cron$ SELECT public.purge_expired_deleted_leads(); $cron$
    );
  END IF;
END $$;