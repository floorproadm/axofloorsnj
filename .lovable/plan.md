

## Multi-Tenancy Phase 2: Secondary Tables Migration + Code Updates

### Step 1: Run Database Migration

Apply the full `multi_tenancy_secondary_tables.sql` migration covering 10 tables:
- **partners, tasks, feed_posts, feed_comments, automation_sequences, automation_drips, notifications, material_requests, referral_profiles, referrals**

Each table gets: `organization_id` column (FK to organizations), backfill to AXO_ORG_ID, NOT NULL constraint, index, tenant-scoped RLS policy.

### Step 2: Run Verification Query

Confirm all backfilled rows have zero NULLs.

### Step 3: Update Code — Add `organization_id: AXO_ORG_ID` to All INSERT Operations

These files have INSERT operations that currently do NOT include `organization_id`:

| File | Table(s) | Insert Location |
|------|----------|-----------------|
| `src/hooks/admin/usePartnersData.ts` | partners | `createPartner` mutation (~line 89) |
| `src/hooks/useTasks.ts` | tasks | `createTask` mutation (~line 102) |
| `src/hooks/admin/useFeedData.ts` | feed_posts | `useCreateFeedPost` (~line 196) |
| `src/hooks/admin/useFeedData.ts` | feed_comments | `useAddFeedComment` (~line 380) |
| `src/hooks/useAutomationFlows.ts` | automation_sequences | `createSequence` (~line 102) |
| `src/hooks/useAutomationFlows.ts` | automation_drips | `createDrip` (~line 156) |
| `src/hooks/useMaterialRequests.ts` | material_requests | `createRequest` (~line 45) |
| `src/hooks/useReferralProfile.ts` | referral_profiles | `register` (~line 95) |
| `src/hooks/useReferralProfile.ts` | referrals | `addReferral` (~line 159) |
| `src/pages/Builders.tsx` | notifications | Notification insert (~line 131) |
| `src/pages/Realtors.tsx` | notifications | Notification insert (~line 145) |

Each insert will add `organization_id: AXO_ORG_ID` (imported from `src/lib/constants.ts`).

### Step 4: Update `notify_on_chat_message` DB Function

The `notify_on_chat_message()` trigger function inserts into `notifications` without `organization_id`. This needs a migration to update the function, pulling `organization_id` from the project's org.

### Step 5: Drop Legacy RLS Policies

After new tenant-scoped policies are active, the old `has_role`-based policies on these tables become redundant/conflicting. Drop:
- `partners_admin_all`, `partners_authenticated_read`
- `tasks_admin_all`, `tasks_assigned_read`, `tasks_assigned_update`
- `feed_comments_admin_all`
- `automation_sequences_admin_all`, `automation_sequences_authenticated_read`
- `automation_drips_admin_all`, `automation_drips_authenticated_read`
- `material_requests_admin_all`, `material_requests_own_insert`, `material_requests_own_read`
- `referral_profiles_admin_all`
- `referrals_admin_all`

Note: `referral_profiles_public_insert`, `referral_profiles_public_read`, `referrals_public_insert`, `referrals_public_read` should be kept (public referral program pages need anonymous access) but updated to scope by org.

### Summary

- 1 migration (the uploaded SQL)
- 1 follow-up migration (update `notify_on_chat_message` + drop legacy policies)
- 11 code files updated to include `organization_id` on inserts

