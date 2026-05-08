
-- Editable email templates per organization
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  template_key text NOT NULL,
  subject_template text NOT NULL,
  body_template text NOT NULL,
  description text,
  variables text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, template_key)
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view templates"
  ON public.email_templates FOR SELECT
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Org members can update templates"
  ON public.email_templates FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Org members can insert templates"
  ON public.email_templates FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
