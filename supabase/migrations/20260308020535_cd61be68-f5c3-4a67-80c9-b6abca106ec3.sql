
-- 1. referral_profiles table
CREATE TABLE public.referral_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  referral_code text NOT NULL UNIQUE,
  total_credits numeric NOT NULL DEFAULT 0,
  total_referrals integer NOT NULL DEFAULT 0,
  total_converted integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_profiles ENABLE ROW LEVEL SECURITY;

-- Public can register
CREATE POLICY "referral_profiles_public_insert" ON public.referral_profiles
  FOR INSERT WITH CHECK (true);

-- Anyone can read own profile by referral_code (no auth needed)
CREATE POLICY "referral_profiles_public_read" ON public.referral_profiles
  FOR SELECT USING (true);

-- Admin can do everything
CREATE POLICY "referral_profiles_admin_all" ON public.referral_profiles
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.referral_profiles(id) ON DELETE CASCADE,
  referred_name text NOT NULL,
  referred_email text,
  referred_phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  credit_amount numeric NOT NULL DEFAULT 0,
  credited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Public insert (referrer submits referrals without auth)
CREATE POLICY "referrals_public_insert" ON public.referrals
  FOR INSERT WITH CHECK (true);

-- Public read filtered by referrer_id (page uses referral_code to find referrer_id)
CREATE POLICY "referrals_public_read" ON public.referrals
  FOR SELECT USING (true);

-- Admin all
CREATE POLICY "referrals_admin_all" ON public.referrals
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. referral_rewards table
CREATE TABLE public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.referral_profiles(id) ON DELETE CASCADE,
  referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'credit',
  amount numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_rewards_public_read" ON public.referral_rewards
  FOR SELECT USING (true);

CREATE POLICY "referral_rewards_admin_all" ON public.referral_rewards
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Add referral_commission_percent to company_settings
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS referral_commission_percent numeric NOT NULL DEFAULT 7;
