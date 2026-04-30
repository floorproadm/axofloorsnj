-- Drop deprecated B2C gamified rewards table.
-- Safe: 0 rows, no incoming FKs, only consumer was useReferralProfile.ts (already patched).
DROP POLICY IF EXISTS "referral_rewards_public_read" ON public.referral_rewards;
DROP POLICY IF EXISTS "referral_rewards_admin_all" ON public.referral_rewards;
DROP POLICY IF EXISTS "referral_rewards_tenant_all" ON public.referral_rewards;

DROP TABLE IF EXISTS public.referral_rewards;