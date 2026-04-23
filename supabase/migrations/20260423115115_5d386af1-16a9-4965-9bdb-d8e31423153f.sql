-- 1) Tabela de vínculo entre auth.users e partners
CREATE TABLE public.partner_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  invited_by uuid,
  UNIQUE(partner_id)
);

CREATE INDEX idx_partner_users_user_id ON public.partner_users(user_id);
CREATE INDEX idx_partner_users_partner_id ON public.partner_users(partner_id);

ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;

-- 2) Função auxiliar: pega partner_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_partner_id_for_user()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_partner_org_for_user()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.partner_users WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 3) RLS para partner_users
CREATE POLICY "partner_users_self_read"
ON public.partner_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR organization_id = get_user_org_id());

CREATE POLICY "partner_users_admin_manage"
ON public.partner_users
FOR ALL
TO authenticated
USING (organization_id = get_user_org_id())
WITH CHECK (organization_id = get_user_org_id());

-- 4) RLS adicional em partners: parceiro logado vê o próprio registro
CREATE POLICY "partners_self_read"
ON public.partners
FOR SELECT
TO authenticated
USING (id = get_partner_id_for_user());

-- 5) RLS adicional em leads: parceiro vê apenas leads que indicou
CREATE POLICY "leads_partner_read_own_referrals"
ON public.leads
FOR SELECT
TO authenticated
USING (referred_by_partner_id = get_partner_id_for_user());

-- 6) RLS para parceiro inserir leads (com auto-set do partner_id via trigger)
CREATE POLICY "leads_partner_insert"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = get_partner_org_for_user()
  AND referred_by_partner_id = get_partner_id_for_user()
);

-- 7) Trigger: ao parceiro inserir lead, força lead_source e organization_id
CREATE OR REPLACE FUNCTION public.enforce_partner_lead_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id uuid;
  v_org_id uuid;
BEGIN
  v_partner_id := public.get_partner_id_for_user();
  IF v_partner_id IS NOT NULL THEN
    v_org_id := public.get_partner_org_for_user();
    NEW.referred_by_partner_id := v_partner_id;
    NEW.organization_id := v_org_id;
    NEW.lead_source := 'partner_referral';
    NEW.status := 'cold_lead';
    NEW.priority := 'medium';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_partner_lead_defaults
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.enforce_partner_lead_defaults();

-- 8) Função para admin convidar parceiro (apenas vincula user_id existente ao partner)
CREATE OR REPLACE FUNCTION public.link_partner_user(p_partner_id uuid, p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_link_id uuid;
BEGIN
  -- Verifica se admin do org pode fazer isso
  SELECT organization_id INTO v_org_id FROM public.partners WHERE id = p_partner_id;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Partner não encontrado';
  END IF;
  IF v_org_id != public.get_user_org_id() THEN
    RAISE EXCEPTION 'Sem permissão para vincular este parceiro';
  END IF;

  INSERT INTO public.partner_users(user_id, partner_id, organization_id, invited_by)
  VALUES (p_user_id, p_partner_id, v_org_id, auth.uid())
  ON CONFLICT (partner_id) DO UPDATE SET user_id = EXCLUDED.user_id, invited_by = EXCLUDED.invited_by
  RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$;