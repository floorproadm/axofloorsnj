ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT '50% deposit due upon signing. Balance due upon completion.';
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS tax_rate numeric DEFAULT 0;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS terms_text text;

ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS default_payment_terms text DEFAULT '50% deposit due upon signing. Balance due upon completion.';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS default_tax_rate numeric DEFAULT 0;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS default_terms_text text;