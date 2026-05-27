-- Remove o cron job legado 'automation-engine-drips' do pg_cron
-- Mantém apenas o 'automation-engine-cron' ativo
SELECT cron.unschedule('automation-engine-drips');