-- 1. Add user_id to referral_profiles (nullable for legacy rows)
ALTER TABLE public.referral_profiles
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_referral_profiles_user_id ON public.referral_profiles(user_id);

-- 2. RLS policies for authenticated access
DROP POLICY IF EXISTS "Users can view own referral profile" ON public.referral_profiles;
CREATE POLICY "Users can view own referral profile"
ON public.referral_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own referral profile" ON public.referral_profiles;
CREATE POLICY "Users can update own referral profile"
ON public.referral_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Grants (authenticated needs to read/update own row)
GRANT SELECT, UPDATE ON public.referral_profiles TO authenticated;

-- 4. Claim/create function — invoked after signup confirmation
CREATE OR REPLACE FUNCTION public.claim_referral_profile(
  p_name text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS public.referral_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_profile public.referral_profiles%ROWTYPE;
  v_org_id uuid;
  v_code text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Auth user has no email';
  END IF;

  -- 1) Already linked
  SELECT * INTO v_profile FROM public.referral_profiles
  WHERE user_id = v_user_id LIMIT 1;
  IF FOUND THEN
    RETURN v_profile;
  END IF;

  -- 2) Claim existing profile by email (case-insensitive)
  SELECT * INTO v_profile FROM public.referral_profiles
  WHERE lower(email) = lower(v_email) AND user_id IS NULL
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.referral_profiles
    SET user_id = v_user_id,
        name = COALESCE(NULLIF(trim(p_name), ''), name),
        phone = COALESCE(NULLIF(trim(p_phone), ''), phone),
        updated_at = now()
    WHERE id = v_profile.id
    RETURNING * INTO v_profile;
    RETURN v_profile;
  END IF;

  -- 3) Create new profile
  SELECT id INTO v_org_id FROM public.organizations ORDER BY created_at LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization configured';
  END IF;

  v_code := upper(substr(md5(v_user_id::text || clock_timestamp()::text), 1, 8));

  INSERT INTO public.referral_profiles (user_id, name, email, phone, referral_code, organization_id)
  VALUES (
    v_user_id,
    COALESCE(NULLIF(trim(p_name), ''), split_part(v_email, '@', 1)),
    v_email,
    COALESCE(NULLIF(trim(p_phone), ''), ''),
    v_code,
    v_org_id
  )
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_referral_profile(text, text) TO authenticated;