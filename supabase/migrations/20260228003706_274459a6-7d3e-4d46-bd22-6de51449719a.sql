
ALTER TABLE public.projects
  ADD COLUMN referred_by_partner_id uuid DEFAULT NULL
  REFERENCES public.partners(id) ON DELETE SET NULL;
