
CREATE TABLE public.service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL DEFAULT 'service',
  name text NOT NULL,
  description text,
  category text,
  default_material text,
  default_finish text,
  base_price numeric NOT NULL DEFAULT 0,
  price_unit text NOT NULL DEFAULT 'sqft',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_catalog_admin_all"
ON public.service_catalog FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "service_catalog_authenticated_read"
ON public.service_catalog FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);
