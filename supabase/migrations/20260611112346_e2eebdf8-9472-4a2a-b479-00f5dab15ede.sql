
-- Fix profiles with mismatched IDs (they were seeded with random UUIDs instead of auth.users.id)
-- and link both users to AXO Floors organization.

-- Realign profile rows to their corresponding auth.users id by email.
UPDATE public.profiles p
SET id = u.id
FROM auth.users u
WHERE p.email = u.email AND p.id <> u.id;

-- Ensure both users are members of AXO Floors LLC.
INSERT INTO public.organization_members (user_id, organization_id, role)
SELECT u.id, 'a0000000-0000-0000-0000-000000000001'::uuid,
  CASE WHEN u.email = 'axofloorsnj@gmail.com' THEN 'owner'::org_member_role
       ELSE 'admin'::org_member_role END
FROM auth.users u
WHERE u.email IN ('axofloorsnj@gmail.com','eduardobraoli@gmail.com')
ON CONFLICT (user_id, organization_id) DO NOTHING;
