
-- automation_sequences
CREATE TABLE public.automation_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_type text NOT NULL DEFAULT 'sales',
  stage_key text NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_sequences_admin_all" ON public.automation_sequences
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "automation_sequences_authenticated_read" ON public.automation_sequences
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- automation_drips
CREATE TABLE public.automation_drips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES public.automation_sequences(id) ON DELETE CASCADE,
  delay_days integer NOT NULL DEFAULT 0,
  delay_hours integer NOT NULL DEFAULT 0,
  channel text NOT NULL DEFAULT 'sms',
  subject text,
  message_template text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_drips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_drips_admin_all" ON public.automation_drips
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "automation_drips_authenticated_read" ON public.automation_drips
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- updated_at triggers
CREATE TRIGGER set_updated_at_automation_sequences
  BEFORE UPDATE ON public.automation_sequences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_automation_drips
  BEFORE UPDATE ON public.automation_drips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
