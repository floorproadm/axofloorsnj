ALTER TABLE public.tasks
  ADD COLUMN related_partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;