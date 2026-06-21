ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Existing users (who already have an organization) shouldn't see onboarding
UPDATE public.profiles p
SET onboarding_completed = true,
    onboarding_completed_at = now()
WHERE EXISTS (
  SELECT 1 FROM public.organization_members om WHERE om.user_id = p.user_id
)
AND onboarding_completed = false;