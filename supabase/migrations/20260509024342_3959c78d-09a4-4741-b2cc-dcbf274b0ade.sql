-- ============================================================
-- 1. REFERRAL BOOSTER: Remove public PII exposure
-- ============================================================

DROP POLICY IF EXISTS referrals_public_read ON public.referrals;
DROP POLICY IF EXISTS referral_profiles_public_read ON public.referral_profiles;

-- Secure RPC: lookup by email, returns only the matching profile + its own referrals.
-- Used by the public Referral Booster page where users authenticate themselves via email.
CREATE OR REPLACE FUNCTION public.get_referral_dashboard(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.referral_profiles%ROWTYPE;
  v_referrals jsonb;
BEGIN
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_profile
  FROM public.referral_profiles
  WHERE lower(email) = lower(trim(p_email))
  LIMIT 1;

  IF v_profile.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC), '[]'::jsonb)
  INTO v_referrals
  FROM public.referrals r
  WHERE r.referrer_id = v_profile.id;

  RETURN jsonb_build_object(
    'profile', to_jsonb(v_profile),
    'referrals', v_referrals
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_referral_dashboard(text) TO anon, authenticated;

-- ============================================================
-- 2. JOB COST ITEMS: Restrict to user's organization
-- ============================================================

DROP POLICY IF EXISTS job_cost_items_authenticated_read ON public.job_cost_items;

CREATE POLICY job_cost_items_tenant_read
ON public.job_cost_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.job_costs jc
    JOIN public.projects p ON p.id = jc.project_id
    WHERE jc.id = job_cost_items.job_cost_id
      AND p.organization_id = public.get_user_org_id()
  )
);

-- ============================================================
-- 3. Fix mutable search_path on notify_new_lead_email
-- ============================================================

ALTER FUNCTION public.notify_new_lead_email() SET search_path = public, extensions;