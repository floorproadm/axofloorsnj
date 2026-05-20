ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS partner_program text NOT NULL DEFAULT 'referral';
ALTER TABLE public.partners ADD CONSTRAINT partners_program_check CHECK (partner_program IN ('referral','trade'));
CREATE INDEX IF NOT EXISTS idx_partners_program ON public.partners(partner_program);