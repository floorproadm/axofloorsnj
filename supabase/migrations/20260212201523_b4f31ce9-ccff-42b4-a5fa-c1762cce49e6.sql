-- FASE 1: Padronizar default de leads.status para 'new_lead'
-- Migrar quaisquer registros legacy (se existirem)
UPDATE public.leads SET status = 'new_lead' WHERE status = 'new';
UPDATE public.leads SET status = 'appt_scheduled' WHERE status = 'contacted';
UPDATE public.leads SET status = 'proposal' WHERE status = 'quoted';
UPDATE public.leads SET status = 'completed' WHERE status = 'won';

-- Alterar o default da coluna
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'new_lead';

-- FASE 4a: Singleton constraint para company_settings (máximo 1 linha)
-- Usa um campo constante com UNIQUE para garantir apenas 1 registro
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS singleton_key boolean NOT NULL DEFAULT true;
ALTER TABLE public.company_settings ADD CONSTRAINT company_settings_singleton UNIQUE (singleton_key);
ALTER TABLE public.company_settings ADD CONSTRAINT company_settings_singleton_check CHECK (singleton_key = true);