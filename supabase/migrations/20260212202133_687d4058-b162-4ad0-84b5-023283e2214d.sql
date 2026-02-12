-- FASE 4b: Criar bucket gallery para storage de imagens do GalleryManager
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para o bucket gallery
CREATE POLICY "Gallery images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload gallery images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update gallery images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete gallery images"
ON storage.objects FOR DELETE
USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));

-- FASE 4c: Validação server-side para INSERT público de leads
-- Trigger que valida campos obrigatórios e sanitiza dados
CREATE OR REPLACE FUNCTION public.validate_lead_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validar comprimento de campos
  IF length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Nome excede limite de 200 caracteres';
  END IF;

  IF length(NEW.phone) > 30 THEN
    RAISE EXCEPTION 'Telefone excede limite de 30 caracteres';
  END IF;

  IF NEW.email IS NOT NULL AND length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Email excede limite de 255 caracteres';
  END IF;

  IF NEW.message IS NOT NULL AND length(NEW.message) > 2000 THEN
    RAISE EXCEPTION 'Mensagem excede limite de 2000 caracteres';
  END IF;

  -- Forçar status inicial para inserções públicas (não-admin)
  IF NOT public.has_role(COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), 'admin') THEN
    NEW.status := 'new_lead';
    NEW.priority := 'medium';
    NEW.assigned_to := NULL;
    NEW.converted_to_project_id := NULL;
    NEW.customer_id := NULL;
    NEW.follow_up_actions := '[]'::jsonb;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_lead_insert
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.validate_lead_insert();