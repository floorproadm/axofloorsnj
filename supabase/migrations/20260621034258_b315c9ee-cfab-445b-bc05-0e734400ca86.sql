ALTER TABLE public.invoices DROP CONSTRAINT invoices_project_id_fkey,
  ADD CONSTRAINT invoices_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.chat_messages DROP CONSTRAINT chat_messages_project_id_fkey,
  ADD CONSTRAINT chat_messages_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.payments DROP CONSTRAINT payments_project_id_fkey,
  ADD CONSTRAINT payments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

ALTER TABLE public.material_requests DROP CONSTRAINT material_requests_project_id_fkey;