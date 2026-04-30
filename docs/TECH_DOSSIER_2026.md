# TECH DOSSIER 2026 — AXO OS / FloorPro

> **Generated:** 2026-04-30
> **Source of truth:** Live Postgres (`information_schema`, `pg_catalog`, `pg_policies`, `pg_proc`), `src/App.tsx`, `src/pages/admin/**`, `src/components/admin/**`, `src/hooks/**`, `supabase/functions/**`, `supabase/migrations/**` (98 migrations).
> **Org constant:** `AXO_ORG_ID = 'a0000000-0000-0000-0000-000000000001'` (`src/lib/constants.ts`).
> **Counts:** 56 base tables, 5 views, 27 admin pages (~11,347 LoC), 34 admin components (~10,388 LoC), 41 hooks (~5,957 LoC), 7 edge functions, 27 PL/pgSQL functions, 30+ triggers, 13 enum values across 5 enum types.

---

## 1. DOSSIER 1 — DATABASE SCHEMA

### 1.1 Enums

| Enum type | Values |
|---|---|
| `app_role` | `admin`, `moderator`, `user` |
| `org_member_role` | `owner`, `admin`, `collaborator` |
| `org_plan` | `starter`, `pro`, `enterprise` |
| `org_type` | `flooring_owner`, `supply_partner` |
| `labor_pricing_model` | `sqft`, `daily` |
| `supply_conn_status` | `pending`, `active`, `paused` |

### 1.2 Multi-tenancy primitives

- **`organizations`** — root tenant. PK `id`, `slug` UNIQUE, `type` (org_type), `plan`, branding (`logo_url`, `primary_color`), trial flags.
- **`organization_members`** — link table (`user_id`, `organization_id`, `role`). UNIQUE(`user_id`,`organization_id`). RLS: read own org, manage requires owner/admin role.
- **`profiles`** — 1:1 mirror of `auth.users` (UNIQUE `user_id`). Auto-populated via `handle_new_user` trigger on `auth.users` insert.
- **`user_roles`** — global RBAC (`app_role`). UNIQUE(`user_id`,`role`). Checked via `has_role(uid, role)` SECURITY DEFINER.

> **No FK constraints exist between public tables and `auth.users`** (intentional — Supabase auth is decoupled). All cross-table references rely on UUIDs, validated at query time.

### 1.3 Tables — exhaustive listing

> Format: `column | type | NOT NULL | default`. PK = `id uuid` unless noted. RLS is **enabled on every table** (verified via `pg_class.relrowsecurity`).

#### 1.3.1 Identity & tenancy
| Table | Key non-id columns |
|---|---|
| `organizations` | name, slug UNIQUE, type, plan, logo_url, primary_color, phone, email, address, city, state DEFAULT 'NJ', zip_code, website_enabled, trial_ends_at, is_active |
| `organization_members` | user_id, organization_id, role (org_member_role) |
| `profiles` | user_id UNIQUE, full_name, email, avatar_url, phone, birthdate, role (text), bio |
| `user_roles` | user_id, role (app_role) UNIQUE(user_id,role) |
| `audit_log` | user_id, user_role, table_accessed, operation_type, data_classification, organization_id, access_timestamp |
| `company_settings` | company_name, default_margin_min_percent (NUMERIC, default 30), labor_pricing_model, default_labor_rate (3.50), referral_commission_percent (7), logo_url, primary_color, secondary_color, trade_name, organization_id, phone, email, website, tagline, **`singleton_key BOOL UNIQUE`** (idx `company_settings_singleton`) |
| `supply_connections` | supply_org_id, flooring_org_id, status (supply_conn_status). UNIQUE(supply_org_id, flooring_org_id) |

#### 1.3.2 CRM (leads, customers, partners)
| Table | Key columns |
|---|---|
| `customers` | full_name, email, phone, address, city, zip_code, organization_id, **portal_token** UNIQUE (default `encode(gen_random_bytes(24),'hex')`) |
| `leads` | name, phone, email, address, city, zip_code, location, **lead_source** ('website'), **status** ('cold_lead'), **priority** ('medium'), **services** jsonb, room_size, budget, message, notes, assigned_to, follow_up_date, last_contacted_at, **converted_to_project_id**, customer_id, follow_up_required, next_action_date, follow_up_actions jsonb, status_changed_at, referred_by_partner_id, organization_id |
| `lead_notes` | lead_id, organization_id, author_name, content, attachment_url, attachment_name |
| `partners` | company_name, contact_name, email, phone, partner_type ('builder'), service_zone ('core'), status ('active'), last_contacted_at, next_action_date, next_action_note, total_referrals, total_converted, birthday, photo_url, lead_source_tag, organization_id |
| `partner_users` | user_id UNIQUE, partner_id UNIQUE, organization_id, invited_by |
| `referral_profiles` | name, email, phone, referral_code UNIQUE, total_credits, total_referrals, total_converted, organization_id |
| `referrals` | referrer_id, referred_name, referred_email, referred_phone, status ('pending'), lead_id, credit_amount, credited_at, organization_id |
| `referral_rewards` | referrer_id, referral_id, type ('credit'), amount, description |
| `quiz_responses` | name, email, phone, city, zip_code, room_size, services jsonb, budget, source ('quiz'), organization_id |

#### 1.3.3 Projects, jobs, financials
| Table | Key columns |
|---|---|
| `projects` | customer_name, customer_email, customer_phone, address, city, zip_code, **project_type**, **project_status** ('pending'), square_footage, estimated_cost, actual_cost, start_date, completion_date, customer_id, team_lead, team_members text[], work_schedule, requires_progress_photos (true), referred_by_partner_id, organization_id, **next_action**, **next_action_date** |
| `project_members` | project_id, user_id UNIQUE(project_id,user_id), role ('collaborator') |
| `project_comments` | project_id, author_name, content, image_url, organization_id |
| `project_documents` | project_id, folder ('other'), file_name, file_type, file_url, uploaded_by, source ('admin_upload'), category ('misc'), version |
| `project_measurements` | project_id, status ('scheduled'), measurement_date, measured_by, total_sqft, total_linear_ft, service_type, material, finish_type |
| `measurement_areas` | measurement_id, room_name, area_sqft, linear_ft, dimensions, area_type ('floor'), display_order |
| `job_costs` | project_id UNIQUE, labor_cost, material_cost, additional_costs, **total_cost (generated by trigger)**, estimated_revenue, **margin_percent**, **profit_amount** |
| `job_cost_items` | job_cost_id, category ('other'), description, amount |
| `job_proof` | project_id, before_image_url, after_image_url |
| `material_costs` | project_id, organization_id, description, supplier, amount, purchase_date, receipt_url, is_paid, notes |
| `labor_entries` | project_id, organization_id, worker_name, role ('helper'), daily_rate, days_worked, **total_cost**, work_date, is_paid, notes |
| `material_requests` | project_id, requested_by, item_name, quantity, unit ('unit'), status ('pending'), reviewed_by, reviewed_at, organization_id |

#### 1.3.4 Sales pipeline
| Table | Key columns |
|---|---|
| `proposals` | project_id, customer_id, **proposal_number** UNIQUE, **status** ('draft'), good_price, better_price, best_price, margin_good, margin_better, margin_best, selected_tier, valid_until, sent_at, accepted_at, **use_tiers** (true), flat_price, organization_id, **share_token** UNIQUE (32 bytes hex), viewed_at, client_note |
| `proposal_signatures` | proposal_id, organization_id, signer_name, signer_email, signature_url, selected_tier, payment_method ('check'), client_note, ip_address inet, user_agent, signed_at |
| `proposal_change_requests` | proposal_id, customer_id, organization_id, message, status ('open'), resolved_at, resolved_by |

#### 1.3.5 Money out (invoices, payments)
| Table | Key columns |
|---|---|
| `invoices` | project_id, customer_id, **invoice_number**, **status** ('draft'), amount, tax_amount, discount_amount, total_amount, due_date, paid_at, payment_method, organization_id, deposit_amount, **share_token** UNIQUE, viewed_at |
| `invoice_items` | invoice_id, description, quantity, unit_price, amount, detail |
| `invoice_payment_schedule` | invoice_id, phase_label, percentage, timing, phase_order |
| `payments` | project_id, **category** ('received' / labor / expense), amount, payment_date, payment_method, **status** ('pending'), description, collaborator_id, organization_id |

#### 1.3.6 Schedule, comms, automation
| Table | Key columns |
|---|---|
| `appointments` | customer_name, customer_phone, appointment_type, appointment_date, appointment_time, duration_hours (1), location, **status** ('scheduled'), notes, reminder_sent, project_id, customer_id, assigned_to uuid[], organization_id |
| `appointment_assignees` | appointment_id, profile_id UNIQUE(appointment_id,profile_id) |
| `chat_messages` | project_id, sender_id, sender_name, content, read |
| `notifications` | user_id, title, body, type ('info'), read, link, organization_id |
| `tasks` | title, description, **status** ('pending'), **priority** ('medium'), assigned_to, related_project_id, related_lead_id, related_partner_id, due_date, created_by (DEFAULT auth.uid()), completed_at, organization_id |
| `automation_sequences` | pipeline_type ('sales'), stage_key, name, is_active, display_order, organization_id |
| `automation_drips` | sequence_id, delay_days, delay_hours, channel ('sms'), subject, message_template, is_active, display_order, organization_id |

#### 1.3.7 Catalog, media, gallery, weekly review
| Table | Key columns |
|---|---|
| `service_catalog` | item_type ('service'), name, description, category, default_material, default_finish, base_price, price_unit ('sqft'), is_active, display_order, image_url |
| `media_files` | project_id, feed_post_id, uploaded_by, uploaded_by_role ('admin'), source_type ('admin_upload'), visibility ('internal'), folder_type ('job_progress'), file_type ('image'), storage_path, thumbnail_path, metadata jsonb, quality_checked, reviewed_by, reviewed_at, is_marketing_asset |
| `feed_posts` | project_id, post_type ('photo'), title, description, location, category, tags text[], visibility ('internal'), status ('draft'), folder_id, author_name ('Admin'), author_id, likes_count, comments_count, share_token uuid, organization_id |
| `feed_post_images` | feed_post_id, file_url, file_type ('image'), display_order |
| `feed_folders` | name, description, cover_image_url, item_count, display_order, organization_id |
| `feed_comments` | feed_post_id, author_name, content, organization_id |
| `gallery_folders` | name, description, cover_image_url, display_order, organization_id |
| `gallery_projects` | title, description, category, location, image_url, is_featured, display_order, folder_name, parent_folder_id, organization_id |
| `weekly_reviews` | organization_id, **week_start** (UNIQUE per org), week_end, total_revenue, total_profit, avg_margin, jobs_completed, leads_won, notes, action_items, status ('open'), closed_at |
| `weekly_review_projects` | weekly_review_id, project_id UNIQUE(weekly_review_id, project_id) |
| `system_node_overrides` | tab_id, node_id, title, subtitle, tag, color, x, y, w, h, is_custom, is_deleted, content jsonb, organization_id; UNIQUE(org, tab, node) |
| `system_node_arrows` | tab_id, from_node_id, to_node_id, dashed, is_deleted, organization_id; UNIQUE(org, tab, from, to) |
| `system_node_notes` | node_id, organization_id, content; UNIQUE(node, org) |

### 1.4 Views
- `view_financial_metrics`: active_jobs, completed_jobs, pipeline_value, total_revenue, total_profit, avg_margin_30d.
- `view_pipeline_metrics`: status, total, last_30d, avg_days_in_pipeline.
- `view_stage_aging`: lead_id, name, status, days_in_pipeline, next_action_date, action_overdue.
- `leads_estimate_scheduled_stale`: id, name, days_stale.
- `leads_followup_overdue`: id, name, next_action_date.
- `projects_missing_progress_photos`: project_id, customer_name.

### 1.5 Foreign keys (declared)

> The DB has **no declared `FOREIGN KEY` constraints** on public tables (verified via `information_schema.table_constraints WHERE constraint_type='FOREIGN KEY'` returns 0 rows). All referential integrity is enforced via:
> - RLS subqueries (e.g. `invoice_items.invoice_id IN (SELECT id FROM invoices WHERE org_id = …)`),
> - PL/pgSQL triggers (`axo_validate_lead_transition`, `enforce_proposal_acceptance`, etc.),
> - Application-level validation in hooks.

### 1.6 Notable indexes (selection)

- `idx_company_settings_singleton ON company_settings ((true))` — ensures only 1 row.
- `unique_project_cost ON job_costs(project_id)` — 1 cost row per project.
- `idx_feed_posts_share_token` partial WHERE share_token IS NOT NULL.
- `idx_media_files_marketing` partial WHERE is_marketing_asset = true.
- `idx_proposals_share_token`, `idx_invoices_share_token` (UNIQUE) — public link lookups.
- `weekly_reviews_organization_id_week_start_key` — 1 review per org/week.
- `idx_leads_customer_id`, `idx_appointments_customer_id`, `idx_projects_customer_id`, `idx_labor_entries_project`, `idx_material_costs_project`, `idx_lead_notes_lead_id`, `idx_project_documents_folder (project_id, folder)`.

### 1.7 RLS — patterns

Every table is RLS-enabled. Five recurring patterns:

1. **`*_tenant_all` (most tables)** — `USING (organization_id = get_user_org_id()) WITH CHECK (...)` for `authenticated` role. The single most important policy template.
2. **Admin override** — `has_role(auth.uid(),'admin')` for tables without `organization_id` (job_cost_items, job_proof, measurement_areas, project_members, feed_*).
3. **Public token reads** — anon SELECT on `proposals`, `invoices`, `invoice_items`, `invoice_payment_schedule`, `customers`, `projects` gated on `share_token IS NOT NULL` or `portal_token IS NOT NULL`. Powers `/proposal/:token`, `/invoice/:token`, `/portal/:token`.
4. **Anonymous insert** — `leads_public_insert`, `quiz_responses`, `referrals`, `referral_profiles`, `proposal_signatures` (gated to share_token), `proposal_change_requests` (gated to portal_token). Powers all marketing forms.
5. **Partner / collaborator scoped** —
   - `leads_partner_*`: `referred_by_partner_id = get_partner_id_for_user()`.
   - `chat_messages_collaborator_*`, `media_files_collaborator_*`, `projects_collaborator_read`: `EXISTS (project_members WHERE user_id = auth.uid())`.
   - `partners_self_*`: `id = get_partner_id_for_user()`.

Full policy listing is preserved in `/tmp/dossier/db.txt` lines 932–1131; key SECURITY DEFINER helpers below in §3.

### 1.8 ERD (textual)

```
organizations 1───* organization_members *───1 auth.users
                │                              │
                │                              ├──1 profiles
                │                              ├──* user_roles (global app_role)
                │                              └──* partner_users *──1 partners
                │
                ├──* customers ──┐
                ├──* partners ──*│ referrals
                ├──* leads ──────┤   (referred_by_partner_id)
                │  (converted_to_project_id ↘)
                ├──* projects ──┬── job_costs 1:1 ── job_cost_items
                │               ├── job_proof 1:1
                │               ├── project_measurements ── measurement_areas
                │               ├── material_costs       (sync trigger → job_costs)
                │               ├── labor_entries        (sync trigger → job_costs)
                │               ├── project_documents
                │               ├── project_comments
                │               ├── project_members  ◀── chat_messages, media_files (collab RLS)
                │               ├── proposals ── proposal_signatures, proposal_change_requests
                │               ├── invoices ── invoice_items, invoice_payment_schedule
                │               ├── payments
                │               ├── tasks (related_project_id)
                │               ├── appointments ── appointment_assignees
                │               └── feed_posts ── feed_post_images, feed_comments, media_files
                ├──* automation_sequences ── automation_drips
                ├──* notifications  (per-user inbox)
                ├──* weekly_reviews ── weekly_review_projects
                ├──* gallery_folders, gallery_projects
                ├──* feed_folders
                ├──* service_catalog
                ├──* quiz_responses, referral_profiles, referral_rewards
                ├──* system_node_overrides / arrows / notes (Mind-Map persistence)
                └──* supply_connections (supply_org_id ↔ flooring_org_id)
```

---

## 2. DOSSIER 2 — ROUTE LIST

All routes from `src/App.tsx`. Layout wrapper notes: admin routes use `AdminLayout` *inside* each page (not at the route level); collaborator portal uses nested `<Route>` with `CollaboratorLayout` (Outlet). Partner portal currently has no layout wrapper.

### 2.1 Public marketing & lead capture (no auth)

| Path | Component | Purpose |
|---|---|---|
| `/` | `Index` | Home / landing |
| `/hardwood-flooring` | `HardwoodFlooring` | Service page |
| `/sanding-and-refinish` | `SandingRefinish` | Service page |
| `/vinyl-plank-flooring` | `VinylPlankFlooring` | Service page |
| `/staircase` | `Staircase` | Service page |
| `/base-boards` | `BaseBoards` | Service page |
| `/gallery` | `Gallery` | Public gallery |
| `/stain-gallery` | `StainGallery` | DuraSeal stains |
| `/contact` | `Contact` | Contact form |
| `/about` | `About` | About page |
| `/campaign` | `Campaign` | Ad-campaign LP |
| `/quiz` | `Quiz` | Lead-magnet quiz → `quiz_responses` |
| `/thank-you` | `ThankYou` | Post-conversion page |
| `/referral-program` | `ReferralProgram` | Referral signup |
| `/builders` | `Builders` | Builder funnel |
| `/realtors` | `Realtors` | Realtor funnel |
| `/builder-offer` | `BuilderPartnerships` | Builder LP |
| `/partner-program` | `PartnerProgram` | Partner LP |
| `/floor-diagnostic` | `FloorDiagnostic` | Multi-service diagnostic funnel |
| `/axo-master-system` | `AxoMasterSystem` | Mind-map (system_node_*) |
| `/wow-pack` | `WowPack` | Marketing |
| `/project-wizard` | `ProjectWizard` | 4-step consultative form |
| `/review-request` | `ReviewRequest` | Review-collection page |
| `/hub` | `Links` | Linktree-style |

### 2.2 Public token-gated (anon RLS)

| Path | Component | Token source |
|---|---|---|
| `/shared/:token` | `SharedPost` | `feed_posts.share_token` |
| `/invoice/:token` | `PublicInvoice` | `invoices.share_token` |
| `/proposal/:token` | `PublicProposal` | `proposals.share_token` |
| `/portal/:token` | `PublicPortal` | `customers.portal_token` |

### 2.3 Auth screens

| Path | Component | Note |
|---|---|---|
| `/auth` | `Auth` | Generic (collaborator/customer) |
| `/admin/auth` | `AdminAuth` | Admin-only sign-in (PWA exit prevention) |
| `/partner/auth` | `PartnerAuth` | Partner-only sign-in |

### 2.4 Admin (protected: `<ProtectedRoute>` → requires `has_role(uid,'admin')`)

| Path | Component |
|---|---|
| `/admin`, `/admin/dashboard` | `AdminDashboard` |
| `/admin/mission-control` | `AdminMissionControl` |
| `/admin/intake` | `AdminIntake` |
| `/admin/leads` | `AdminLeadsManager` |
| `/admin/leads/:leadId` | `LeadDetail` |
| `/admin/projects` | `ProjectsHub` |
| `/admin/projects/:projectId` | `ProjectDetail` |
| `/admin/jobs/:jobId` | `JobDetail` |
| `/admin/jobs` | redirect → `/admin/projects` |
| `/admin/jobs/:projectId/documents` | `ProjectDocuments` |
| `/admin/measurements` | `MeasurementsManager` |
| `/admin/proposals` | `AdminProposals` |
| `/admin/payments` | `AdminPayments` |
| `/admin/schedule` | `AdminSchedule` |
| `/admin/performance` | `AdminPerformance` |
| `/admin/weekly-review` | `WeeklyReview` |
| `/admin/labor-payroll` | `LaborPayroll` |
| `/admin/crews` | `CrewsVans` |
| `/admin/partners` | `AdminPartners` |
| `/admin/automations` | `AdminAutomations` |
| `/admin/catalog` | `AdminCatalog` |
| `/admin/gallery` | `GalleryHub` |
| `/admin/feed/:postId` | `FeedPostDetail` |
| `/admin/feed/:postId/edit` | `FeedPostEdit` |
| `/admin/help` | `AdminHelp` |
| `/admin/settings` | `AdminSettings` |

### 2.5 Collaborator portal (`<ProtectedRoute requireAdmin={false}>` → `CollaboratorLayout` with `<Outlet/>`)

| Path | Component |
|---|---|
| `/collaborator` | `CollaboratorDashboard` |
| `/collaborator/schedule` | `CollaboratorSchedule` |
| `/collaborator/docs` | `CollaboratorDocs` |
| `/collaborator/chat` | `CollaboratorChat` |
| `/collaborator/profile` | `CollaboratorProfile` |
| `/collaborator/project/:projectId` | `CollaboratorProjectDetail` |

### 2.6 Partner portal (no auth wrapper at route level — guards inside component)

| Path | Component |
|---|---|
| `/partner` | redirect → `/partner/dashboard` |
| `/partner/dashboard` | `PartnerDashboard` |

### 2.7 Catch-all
| Path | Component |
|---|---|
| `*` | `NotFound` |

### 2.8 Edge functions (HTTP, see §5 for detail)
- `POST /functions/v1/collaborator-upload` — auth required
- `POST /functions/v1/facebook-conversions` — anon (server-side pixel)
- `POST /functions/v1/invite-team-member` — admin auth required
- `POST /functions/v1/nightly-proof-reminder` — service role / cron
- `POST /functions/v1/send-follow-up` — service / triggered
- `POST /functions/v1/send-notifications` — service / triggered
- `POST /functions/v1/send-to-notion` — public (lead webhook)

---

## 3. DOSSIER 3 — AUTH / RBAC

### 3.1 Login flow

`src/contexts/AuthContext.tsx`:
- Single `AuthProvider` wraps entire app. Sets up `supabase.auth.onAuthStateChange` listener FIRST then calls `getSession()` (correct ordering).
- Exposes: `user`, `session`, `loading`, `signUp(email,password,fullName?)`, `signIn(email,password)`, `signOut()`, `resetPassword(email)`.
- `signUp` sets `emailRedirectTo: ${window.location.origin}/` and stores `full_name` in `options.data` (consumed by `handle_new_user` trigger).
- `resetPassword` redirects to `/auth?mode=reset`.

**Provider:** Email + Password only is wired in code. Google/Apple/SAML are supported by Lovable Cloud but **not currently invoked from any page** (verified — no `signInWithOAuth` in repo).

**Three auth entry points:** `/auth` (generic), `/admin/auth` (admin), `/partner/auth` (partner). Used by `ProtectedRoute` redirects (`requireAdmin ? /admin/auth : /auth`).

### 3.2 Tables involved in auth

```
auth.users  (Supabase managed)
   │
   ├──1:1── public.profiles    (UNIQUE user_id, populated by handle_new_user trigger)
   │
   ├──*── public.user_roles    (global RBAC, app_role = admin|moderator|user)
   │
   ├──*── public.organization_members (per-tenant role: owner|admin|collaborator)
   │
   ├──1:1── public.partner_users (UNIQUE user_id, links to partners.id)
   │
   └──*── public.project_members (UNIQUE(project_id,user_id), per-project access)
```

### 3.3 Role layers

There are **two parallel role systems** (deliberate — global vs tenant):

| Layer | Table | Enum | Used by |
|---|---|---|---|
| Global RBAC | `user_roles` | `app_role: admin/moderator/user` | `has_role(uid,'admin')` everywhere → `ProtectedRoute`, RLS on tables without `organization_id` |
| Tenant RBAC | `organization_members` | `org_member_role: owner/admin/collaborator` | `get_user_org_id()` → all `*_tenant_all` RLS policies; org-mgmt UI |

### 3.4 Permission check pipeline

**Frontend (`src/components/shared/ProtectedRoute.tsx`)**:
1. `useAuth()` → loads user/session.
2. If `!user` → redirect to `/admin/auth` (or `/auth` when `requireAdmin=false`).
3. If `requireAdmin` → `supabase.rpc('has_role',{ _user_id:user.id, _role:'admin' })`. Reject if false → `/admin/auth`.
4. Renders children only when role check passes.

**Backend (RLS)** — three SECURITY DEFINER helpers do all the heavy lifting:

```sql
public.has_role(_user_id uuid, _role app_role) → boolean
   -- "select 1 from user_roles where user_id=_user_id and role=_role"
public.get_user_org_id() → uuid
   -- returns organization_members.organization_id for auth.uid()
public.get_partner_id_for_user() → uuid
public.get_partner_org_for_user() → uuid
public.supply_has_access(p_org_id uuid) → boolean
```

These bypass RLS recursion and are the only cross-table read points used inside policies.

### 3.5 `AXO_ORG_ID` hardcoded constant

**Location:** `src/lib/constants.ts`

```ts
export const AXO_ORG_ID = 'a0000000-0000-0000-0000-000000000001';
```

**Usage pattern:** All client-side INSERTs that need an organization scope use this constant directly (e.g. `useProjectsHub`, `useTasks`, `usePayments`, `useLeadCapture`, weekly-review hooks). For SELECTs the RLS policy `organization_id = get_user_org_id()` does the filtering — `AXO_ORG_ID` is **only** used at write time when the value would otherwise be missing or for the singleton tenant.

**Implication:** This is the AXO Floors single-tenant guardrail. The schema is multi-tenant ready, but the codebase still hardcodes this constant. The migration plan to FloorPro (memory: `strategy/floorpro-os-vision`) requires replacing this constant with an `organization_id` derived from `organization_members`.

### 3.6 `profiles` ↔ `auth.users` relationship

- **No FK** is declared (Supabase decoupling).
- `profiles.user_id` is UNIQUE and is set by trigger `handle_new_user` on `auth.users` insert (verified in `pg_proc`).
- `handle_new_user` reads `NEW.raw_user_meta_data->>'full_name'` (set by `signUp`) and inserts a profile row.
- Cleanup on auth.users delete is **not** automatic — manual.

### 3.7 Partner & Collaborator auth specifics

- `partner_users` (UNIQUE on `user_id` AND `partner_id`) — links a Supabase auth user to exactly one `partners` row. RLS allows partner self-read of their own `partners` row + own referred leads (`leads_partner_read_own_referrals`).
- `project_members` — used by `/collaborator/*` portal. RLS on `chat_messages`, `media_files`, `projects` cross-references it via `EXISTS` subqueries.

---

## 4. DOSSIER 4 — Lead → Proposal → Project → Invoice flow

### 4.1 Entity statuses

#### `leads.status` — 10 stages (`src/hooks/useLeadPipeline.ts` + `axo_validate_lead_transition` trigger)
```
cold_lead → warm_lead → estimate_requested → estimate_scheduled →
  in_draft → proposal_sent → { in_production | proposal_rejected }
proposal_rejected → in_draft (rework loop)
in_production → { completed | lost }   [terminal]
```

Legacy values that auto-map (in `STATUS_MAP`): `new`, `new_lead`, `contacted`, `appt_scheduled`, `quoted`, `proposal`, `won`.

#### `proposals.status`
`draft → sent → accepted` (or `rejected`). The `enforce_proposal_acceptance` trigger requires `selected_tier IS NOT NULL` (or `use_tiers=false` with `flat_price`) before `accepted`.

#### `projects.project_status`
`pending → in_progress → completed`. (Some legacy code uses `in_production` synonym.) The `enforce_job_proof_on_completion` trigger BEFORE UPDATE blocks `→ completed` unless `job_proof.before_image_url` AND `after_image_url` are set (per `validate_project_completion`).

#### `invoices.status`
`draft → sent → viewed → paid` (`viewed_at` updated by anon UPDATE policy when client opens link; `paid_at` set by app).

#### `payments.status`
`pending → completed` (or `failed`, `refunded`). `category` ∈ `received | labor | expense`.

### 4.2 Validation gates (PL/pgSQL — encoded in DB, cannot be bypassed by client)

| Gate | Trigger / Function | Condition |
|---|---|---|
| Lead transition | `axo_validate_lead_transition` (BEFORE UPDATE on `leads`) | Strict allowed-next list above |
| `→ in_draft` | same | Lead must have `converted_to_project_id`; `job_costs.margin_percent ≥ company_settings.default_margin_min_percent` |
| Leaving `proposal_sent` | same | At least 1 entry in `leads.follow_up_actions` jsonb array |
| `proposal_sent → in_production` | same | Linked project must have a proposal with `status='accepted'` |
| Partner-inserted lead defaults | `enforce_partner_lead_defaults` (BEFORE INSERT) | Forces `organization_id` and `referred_by_partner_id` from partner JWT context |
| Lead insert sanity | `validate_lead_insert` (BEFORE INSERT) | Required field validation |
| `set_status_changed_at` | trigger | Stamps `status_changed_at` on every status change |
| `set_follow_up_on_quoted` | trigger | When status enters `proposal_sent`, auto-sets `follow_up_required=true` |
| Proposal acceptance | `enforce_proposal_acceptance` (BEFORE INSERT/UPDATE on proposals) | If `status='accepted'`: needs `selected_tier` (or `use_tiers=false`) |
| Project completion | `enforce_job_proof_on_completion` (BEFORE UPDATE on projects) | Requires before+after photos |
| Project NRA | `trg_recompute_next_action` (AFTER UPDATE on projects) → `compute_project_next_action()` | Recomputes `next_action`/`next_action_date` |
| Job costs aggregate | `recalc_job_cost_aggregates` (job_cost_items) | Recomputes total_cost/margin_percent/profit_amount |
| Material/labor sync | `sync_material_costs_to_job_costs`, `sync_labor_entries_to_job_costs` | Auto-rolls into `job_costs` |
| Measurement totals | `recalc_measurement_totals` (measurement_areas) | Recomputes `total_sqft`/`total_linear_ft` |

### 4.3 Conversion: `convert_lead_to_project(p_lead_id, p_project_type)` SECURITY DEFINER

Verified body:
1. `SELECT … FROM leads … FOR UPDATE`. Errors if lead doesn't exist, already converted, or missing `organization_id`.
2. Reuses `customer_id` from lead, or INSERTs into `customers` (with org_id).
3. INSERTs into `projects` (`project_status='pending'`).
4. INSERTs zeroed `job_costs` row.
5. UPDATEs lead with `customer_id` and `converted_to_project_id`.
6. Writes `audit_log` row (operation_type='LEAD_CONVERTED').
7. Returns project_id.

Called from: `useLeadConversion` hook → invoked by `LeadControlModal` and the Pipeline UI.

### 4.4 Status-transition wrappers (RPC layer)

- `transition_lead_status(p_lead_id, p_new_status)` — server-side wrapper that performs the UPDATE and surfaces friendly errors. Called by `useLeadPipeline.updateLeadStatus`.
- `validate_lead_transition(p_lead_id, p_new_status)` — read-only check (returns can_transition / error_message / current_status / required_status).
- `validate_proposal_margin(p_project_id)` — pre-flight check before sending proposal (`useProposalValidation`).
- `validate_proposal_acceptance(p_proposal_id)` — preflight for accepting.
- `validate_project_completion(p_project_id)` — preflight for completing.
- `calculate_job_margin(p_project_id)` — inspector returning all financial fields + margin_status.
- `get_lead_nra(p_lead_id)`, `get_leads_nra_batch(p_lead_ids)` — Next-Required-Action engine.
- `run_sla_engine()` — hourly cron (see §5) escalates priority of stagnant leads.
- `link_partner_user(p_partner_id, p_user_id)` — invite-flow helper.
- `get_dashboard_metrics()` — aggregation SSOT for Admin Dashboard.

### 4.5 Component → DB transition map

| UI action | Component (file) | Hook / RPC | Tables touched |
|---|---|---|---|
| Mark stage advance on Kanban | `LinearPipeline.tsx` | `useLeadPipeline.updateLeadStatus` → `transition_lead_status` | `leads` |
| Convert lead | `LeadControlModal` (1302 LoC) | `useLeadConversion` → `convert_lead_to_project` | `leads`, `customers`, `projects`, `job_costs`, `audit_log` |
| Quick Quote (auto-build entire pipeline in 3 steps) | `QuickQuoteSheet` (1008 LoC) | direct inserts | `customers`, `projects`, `job_costs`, `proposals`, `leads` |
| Generate proposal (3-tier or direct) | `ProposalGenerator` (911 LoC) | `useProposalGeneration`, `useProposalValidation` | `proposals` |
| Send proposal (status → sent) | `Proposals.tsx`, `ProposalGenerator` | direct UPDATE | `proposals` |
| Public client signs | `PublicProposal.tsx` + `SignatureDialog` | INSERT (anon RLS) | `proposal_signatures`, `proposals` (status='accepted') |
| Public client requests change | `PublicProposal.tsx` + `ChangeRequestDialog` | INSERT (anon RLS) | `proposal_change_requests` (notify trigger fires) |
| Inline invoice creation in JobDetail | `InvoicesPaymentsSection` | `useInvoices.createInvoice` | `invoices`, `invoice_items`, `invoice_payment_schedule` |
| Public invoice viewed | `PublicInvoice.tsx` | anon UPDATE policy `invoices_public_mark_viewed` | `invoices.viewed_at` |
| Record payment | `Payments.tsx` + `NewPaymentDialog` | `usePayments` | `payments` |
| Complete project | `JobDetail.tsx` | direct UPDATE → `enforce_job_proof_on_completion` runs | `projects`, validates via `job_proof` |

### 4.6 ASCII flow

```
                       ┌────────────────────────────────────────────────┐
                       │  PUBLIC FORMS (anon RLS leads_public_insert)   │
                       │  /quiz, /floor-diagnostic, /project-wizard,    │
                       │  /contact, partner referral                    │
                       └───────────────────────────┬────────────────────┘
                                                   │ INSERT
                                                   ▼
   ┌──────────────────── leads (status='cold_lead') ────────────────────┐
   │   triggers: validate_lead_insert, enforce_partner_lead_defaults    │
   │             trg_set_status_changed_at, set_follow_up_on_quoted     │
   └───────────────────────────┬────────────────────────────────────────┘
                               │ axo_validate_lead_transition (gates)
                               ▼
        cold_lead → warm_lead → estimate_requested → estimate_scheduled
                                                          │
                                                          ▼
                                              convert_lead_to_project()
                                                ┌─────────┼───────────────┐
                                                ▼         ▼               ▼
                                          customers   projects        job_costs (zeroed)
                                                          │
                                                          │ Quick Quote / ProposalGenerator
                                                          ▼
                              in_draft  ───┐    proposals (status='draft')
                          (margin gate)    │    triggers: enforce_proposal_acceptance
                                           ▼
                              proposal_sent ──┐ status='sent', share_token issued
                                              │
                          ┌───────────────────┼─────────────────┐
                          │ public client opens /proposal/:token│
                          │ SignatureDialog OR ChangeRequest    │
                          ▼                   ▼                 ▼
                   proposal_signatures  proposals.status='accepted'  proposal_change_requests
                          │                   │ (notify trigger)
                          │                   ▼
                          │           enforce_proposal_acceptance
                          │           checks selected_tier OR flat_price
                          ▼
                   in_production ──┐ axo_validate_lead_transition gate:
                                   │   requires accepted proposal & follow-up
                                   ▼
                              projects.project_status='in_progress'
                                          │
                                          ├── material_costs ─┐ sync trigger → job_costs
                                          ├── labor_entries ──┤
                                          ├── job_cost_items ─┤ recalc trigger → job_costs
                                          ├── job_proof (before/after)
                                          └── invoices ── invoice_items
                                                  │             │
                                                  │             ▼ public /invoice/:token
                                                  │             (viewed_at via anon UPDATE)
                                                  │             ▼
                                                  ▼          payments(category=received)
                                          → projects.project_status='completed'
                                            (enforce_job_proof_on_completion blocks
                                             unless before+after exist)
                                                  │
                                                  ▼
                                           lead.status='completed'   [TERMINAL]
                                                                      └── lost  [TERMINAL]
```

---

## 5. DOSSIER 5 — Edge functions, automations, triggers, cron

### 5.1 Edge functions

| Name | LoC | Trigger | What it does | Tables / APIs |
|---|---|---|---|---|
| `collaborator-upload` | 184 | HTTP POST (auth required) | Validates JWT, MIME (jpeg/png/webp), size ≤10 MB, folder ∈ `before_after\|job_progress`, project membership; uploads to `media` storage bucket with service role and inserts `media_files` row | `project_members`, `media_files`, storage `media` bucket |
| `facebook-conversions` | 107 | HTTP POST (anon, server-side pixel) | Forwards `eventData` to Facebook Conversions API for pixel `403151700983838` using `FACEBOOK_ACCESS_TOKEN` | external |
| `invite-team-member` | 121 | HTTP POST (admin only) | Validates caller via `has_role(uid,'admin')`; calls `auth.admin.inviteUserByEmail`; inserts `user_roles` row when role ∈ {admin, moderator} | `user_roles`, `auth.users` |
| `nightly-proof-reminder` | 169 | pg_cron (daily, ~18:00) | Scans recently completed/in_progress projects missing AFTER photos; creates `notifications` for org owners/admins; emails summary via Resend (`RESEND_API_KEY`) | `projects`, `job_proof`, `organization_members`, `notifications`, Resend |
| `send-follow-up` | 238 | Triggered by app or cron | Sends follow-up SMS/email with sanitized logging (CSP/XFO/XCTO headers) | `leads`, Twilio/Resend |
| `send-notifications` | 262 | Triggered (e.g. new chat, change request) | Generic SMS dispatch via Twilio (`TWILIO_*`); sanitized logs | `notifications`, Twilio |
| `send-to-notion` | 201 | HTTP POST (public webhook) | Mirrors lead inserts to a Notion DB (`NOTION_API_KEY`, `NOTION_DATABASE_ID`) | external (Notion) |

All functions enforce CORS with the standard Supabase headers and return JSON. `verify_jwt` defaults; `invite-team-member` validates the JWT in code.

### 5.2 PL/pgSQL functions (27 total) — grouped

**Tenancy/RBAC helpers (SECURITY DEFINER):** `has_role`, `get_user_org_id`, `get_partner_id_for_user`, `get_partner_org_for_user`, `supply_has_access`, `link_partner_user`.

**Pipeline gates / triggers:**
- `axo_validate_lead_transition` (BEFORE UPDATE leads) — strict valid-next-stage list + margin gate + follow-up gate + accepted-proposal gate.
- `validate_lead_insert`, `enforce_partner_lead_defaults` (BEFORE INSERT leads).
- `set_status_changed_at`, `set_follow_up_on_quoted`, `update_updated_at_column` (generic timestamping).
- `enforce_proposal_acceptance` (proposals).
- `enforce_job_proof_on_completion` (projects), backed by `validate_project_completion`.
- `transition_lead_status` (RPC wrapper).

**Financial & measurement aggregation:**
- `recalc_job_cost_aggregates` (job_cost_items) — sums into `job_costs`.
- `sync_material_costs_to_job_costs`, `sync_labor_entries_to_job_costs` (mat/labor → job_costs.material_cost/labor_cost).
- `recalc_measurement_totals` (measurement_areas → project_measurements totals).
- `calculate_job_margin`, `validate_proposal_margin`.

**NRA / dashboards:**
- `compute_project_next_action(uuid)` — full decision tree (costs missing, margin low, AFTER photo missing, invoice missing, balance due, etc.) writes `projects.next_action` and `next_action_date`.
- `trg_recompute_next_action` (AFTER UPDATE projects).
- `get_lead_nra`, `get_leads_nra_batch`.
- `get_dashboard_metrics()` (jsonb) — admin dashboard SSOT.
- `run_sla_engine()` (jsonb) — hourly cron escalates priority on stale leads using `view_stage_aging` / `leads_followup_overdue`.

**Notifications:**
- `notify_on_chat_message` (AFTER INSERT chat_messages) — writes a `notifications` row for project members other than the sender.
- `notify_proposal_change_request` (AFTER INSERT proposal_change_requests) — notifies org admins.

**Lead → project conversion:** `convert_lead_to_project(uuid, text)` (see §4.3).

**User onboarding:** `handle_new_user` (AFTER INSERT auth.users) — creates `profiles` row.

### 5.3 Triggers (verified in `information_schema.triggers`)

```
appointments       update_appointments_updated_at        BEFORE UPDATE  update_updated_at_column
automation_drips   set_updated_at_automation_drips       BEFORE UPDATE  update_updated_at_column
automation_seqs    set_updated_at_automation_sequences   BEFORE UPDATE  update_updated_at_column
chat_messages      trg_notify_chat_message               AFTER  INSERT  notify_on_chat_message
company_settings   update_company_settings_updated_at    BEFORE UPDATE  update_updated_at_column
customers          update_customers_updated_at           BEFORE UPDATE  update_updated_at_column
feed_folders       update_feed_folders_updated_at        BEFORE UPDATE  update_updated_at_column
feed_posts         update_feed_posts_updated_at          BEFORE UPDATE  update_updated_at_column
gallery_folders    update_gallery_folders_updated_at     BEFORE UPDATE  update_updated_at_column
gallery_projects   update_gallery_projects_updated_at    BEFORE UPDATE  update_updated_at_column
invoices           update_invoices_updated_at            BEFORE UPDATE  update_updated_at_column
job_cost_items     trg_recalc_job_cost_aggregates        AFTER  I/U/D   recalc_job_cost_aggregates
job_costs          update_job_costs_updated_at           BEFORE UPDATE  update_updated_at_column
job_proof          update_job_proof_updated_at           BEFORE UPDATE  update_updated_at_column
labor_entries      trg_sync_labor_entries                AFTER  I/U/D   sync_labor_entries_to_job_costs
leads              trg_validate_lead_transition          BEFORE UPDATE  axo_validate_lead_transition
leads              trigger_set_follow_up_on_quoted       BEFORE UPDATE  set_follow_up_on_quoted
leads              update_leads_updated_at               BEFORE UPDATE  update_updated_at_column
leads              trg_enforce_partner_lead_defaults     BEFORE INSERT  enforce_partner_lead_defaults
leads              trg_validate_lead_insert              BEFORE INSERT  validate_lead_insert
leads              trg_set_status_changed_at             BEFORE UPDATE  set_status_changed_at
material_costs     trg_sync_material_costs               AFTER  I/U/D   sync_material_costs_to_job_costs
material_costs     update_material_costs_updated_at      BEFORE UPDATE  update_updated_at_column
measurement_areas  recalc_measurement_totals_trigger     AFTER  I/U/D   recalc_measurement_totals
media_files        trg_media_files_updated_at            BEFORE UPDATE  update_updated_at_column
organizations      trg_organizations_updated_at          BEFORE UPDATE  update_updated_at_column
partners           set_partners_updated_at               BEFORE UPDATE  update_updated_at_column
payments           update_payments_updated_at            BEFORE UPDATE  update_updated_at_column
profiles           update_profiles_updated_at            BEFORE UPDATE  update_updated_at_column
project_comments   update_project_comments_updated_at    BEFORE UPDATE  update_updated_at_column
project_documents  update_project_documents_updated_at   BEFORE UPDATE  update_updated_at_column
project_measurements update_project_measurements_updated_at BEFORE UPDATE update_updated_at_column
projects           update_projects_updated_at            BEFORE UPDATE  update_updated_at_column
projects           enforce_job_proof_trigger             BEFORE UPDATE  enforce_job_proof_on_completion
projects           trg_project_next_action               AFTER  UPDATE  trg_recompute_next_action
proposal_change_requests trg_notify_proposal_change_request AFTER INSERT notify_proposal_change_request
proposals          trg_enforce_proposal_acceptance       BEFORE I/U     enforce_proposal_acceptance
proposals          update_proposals_updated_at           BEFORE UPDATE  update_updated_at_column
quiz_responses     update_quiz_responses_updated_at      BEFORE UPDATE  update_updated_at_column
tasks              set_tasks_updated_at                  BEFORE UPDATE  update_updated_at_column
+ on auth.users:   handle_new_user                       AFTER  INSERT  handle_new_user
```

### 5.4 Cron jobs

`SELECT * FROM cron.job` requires `cron` schema permissions which are not granted to the read role used here (`ERROR: permission denied for schema cron`). Inferred from migration history and edge function comments:

- **`run_sla_engine()`** — hourly (memory: `infrastructure/sla-engine-v1-enforcement`).
- **`nightly-proof-reminder`** — daily ~18:00 (comment in function source).

To verify, the user can run as service role: `SELECT jobname, schedule, command FROM cron.job;`.

### 5.5 Webhooks

- **Outbound:** `send-to-notion` (lead mirror), `facebook-conversions` (server-side pixel), `nightly-proof-reminder` (Resend email), `send-follow-up` / `send-notifications` (Twilio SMS).
- **Inbound:** none externally configured (the `leads_public_insert` policy is the public ingestion path, called from the marketing site directly).

### 5.6 Notification flow

```
chat_messages INSERT      → notify_on_chat_message      → notifications (per project member)
proposal_change_requests  → notify_proposal_change_request → notifications (per org admin)
nightly cron              → nightly-proof-reminder edge fn → notifications + Resend email
```

Frontend reads via `useNotifications` (Realtime subscription on `notifications` table — RLS policy `notifications_own_read` filters to `auth.uid()`).

---

## 6. DOSSIER 6 — Component map

> Format: file (LoC), props (when public), key hooks, Supabase ops (`from('table').op`), subcomponents, important local state. Sources: file headers + `rg` of `.from('…')` calls.

### 6.1 `AdminSidebar.tsx` — 253 LoC
- **Props:** none. Hooks: `useSidebar`, `useAuth`, `useLanguage`, `useToast`.
- **Supabase:** `from('company_settings').select('logo_url')`, `storage.from('media').createSignedUrl`.
- **State:** `logoUrl: string|null`.
- **Subcomponents:** `Sidebar*` primitives, `NavLink`, `Button` (logout).
- **Nav structure:**
  - Top: Home `/admin/dashboard`, Schedule, Projects, Payments, Performance.
  - **Tools:** Mission Control, Captação (Intake), Leads & Vendas, Medições, Propostas.
  - **Manage:** Partners, Crews & Fleet, Catálogo, Gallery, Automations.
  - Footer: Help, Settings + Logout.

### 6.2 `Dashboard.tsx` — 391 LoC
- Hooks: `useDashboardData` (admin), `useTasks`, `useNotifications`.
- **Supabase via hook:** RPC `get_dashboard_metrics` (SSOT), reads `tasks`, `view_financial_metrics`, `view_pipeline_metrics`.
- Subcomponents: `MetricCard`, `MissionControl`, `PriorityTasksList`, `AgendaSection`, `ActionableAlertsSection`, `StatsCards`, `TensionMetricsCards`, `NewTaskDialog`.

### 6.3 `LeadsManager.tsx` — 50 LoC
- **Wraps `LinearPipeline`** (see `src/pages/admin/components/LinearPipeline.tsx`).
- Reads URL `?status=` param, normalizes via `normalizeStatus`, restricts to sales-pipeline subset (`cold_lead`…`proposal_rejected`).
- Hooks: `useAdminData` (provides leads list).

### 6.4 `LeadDetail.tsx` — 115 LoC + `LeadControlModal.tsx` — 1302 LoC
- **`LeadControlModal`** is the master lead-cockpit sheet. Hooks: `useLeadPipeline`, `useLeadConversion`, `useLeadFollowUp`, `useLeadNRA`, `useTasks`.
- **Supabase:** `lead_notes` (insert/select/delete with attachment), `leads` (select + status updates via RPC), `tasks`, `appointments`.
- Subcomponents: `LeadPipelineStatus`, `LeadFollowUpAlert`, `LeadSignalBadge`, `ChangeRequestDialog`, address autocomplete.
- Local state: active tab, follow-up form, conversion form (project_type), note draft.

### 6.5 `ProjectsHub.tsx` — 344 LoC
- Hooks: `useProjectsHub` (consolidates 6 queries: `projects` w/ job_costs+partners+project_members, `proposals`, `project_measurements`, `material_costs`, `labor_entries`, `weekly_reviews`).
- Subcomponents: `ProjectPipelineBoard` (kanban), `ProjectDetailPanel` (side-sheet 984 LoC), `NewJobDialog`, `QuickQuoteSheet`.

### 6.6 `JobDetail.tsx` — 1146 LoC
- Master read-first / edit-by-section job page (memory: `features/jobs/job-detail-notion-layout`).
- Hooks: `useJobCosts`, `useJobCostItems`, `useJobProof`, `useMaterialCosts`, `useLaborEntries`, `useMeasurements`, `useInvoices`, `usePayments`, `useProjectDocuments`, `useProjectActivity`, `useProjectSignals`, `useTasks`.
- **Supabase:** writes `projects`, `job_costs`, `job_proof`, `material_costs`, `labor_entries`, `invoices`, `payments`, `project_comments`, `project_documents`.
- Subcomponents: `JobFinancialHeader`, `InvoicesPaymentsSection`, `JobChecklist`, `JobProofUploader`, `JobMarginDisplay`, `JobCostEditor`, `ProjectChatPanel`, `ProjectDocumentsManager`.

### 6.7 `Proposals.tsx` — 1042 LoC + `ProposalGenerator.tsx` — 911 LoC + `QuickQuoteSheet.tsx` — 1008 LoC
- `Proposals.tsx`: list & 5-stage board (memory: `features/proposals-management-system`); switch tiers/direct.
- `ProposalGenerator`: hooks `useProposalGeneration`, `useProposalValidation` (calls `validate_proposal_margin` RPC). Writes `proposals`.
- `QuickQuoteSheet`: 3-step lead-automation flow that **inserts** customer→project→job_costs→proposal→lead (with `referred_by_partner_id`). Heaviest write component in the app.

### 6.8 `Payments.tsx` — 506 LoC
- Hooks: `useInvoices`, `usePayments`. Subcomponents: `InvoiceDetailsSheet`, `NewInvoiceDialog`, `NewPaymentDialog`, `PaymentDetailsSheet`.
- **Supabase:** `invoices`, `invoice_items`, `invoice_payment_schedule`, `payments`, `projects`.

### 6.9 `MissionControl.tsx` — 118 LoC
- Hooks: `useTasks`, `useDashboardData`. Subcomponents: `MissionControl` (dashboard variant), `PriorityTasksList`, `NewTaskDialog`.
- Read-only aggregator over `tasks` (admin RLS) + Notifications.

### 6.10 `Settings.tsx` — 126 LoC
- Tabs: General, Branding, Team. Subcomponents: `GeneralSettings` (writes `company_settings`), `BrandingSettings` (`storage.from('media')` + `company_settings`), `TeamSettings` (reads `profiles`, `user_roles`, `project_members`; invokes `invite-team-member` edge fn via `InviteTeamMemberDialog`).

### 6.11 `Performance.tsx` — 315 LoC
- Hooks: `usePerformanceData` (filters projects.project_status='completed' only — memory: `features/performance-monitoring-hub`). Subcomponents: `WeeklyReviewTab` (reads projects/leads/payments).
- **Supabase:** `projects`, `leads`, `payments`, `view_financial_metrics`.

### 6.12 `LaborPayroll.tsx` — 348 LoC
- Hook: `useLaborEntries`. Writes `labor_entries` (which sync via trigger to `job_costs`). Lists per-project per-worker with mark-as-paid toggle.

### 6.13 `Schedule.tsx` — 818 LoC
- Hooks: `useCollaboratorSchedule` (project_members + appointments) when scoped, plus `appointments`/`appointment_assignees` direct queries.
- View modes: Day, List, Week (memory: `features/schedule/management-modes`).
- Default view from `appointment_assignees` count (memory: `features/schedule/appointment-management-logic`).

### 6.14 `Partners.tsx` — 228 LoC
- Hooks: `usePartnersData`, `usePartnerPipeline`. Subcomponents: `PartnerPipelineBoard` (6-stage Kanban), `PartnerDetailPanel` (984 LoC), `PartnerListItem`, `NewPartnerDialog`, `InvitePartnerDialog` (creates `partner_users` via edge fn).
- **Supabase:** `partners` CRUD; partner→leads via RLS.

### 6.15 Other admin pages (concise)

| Page | LoC | Highlights |
|---|---|---|
| `Intake.tsx` | 765 | Lead intake hub, channel performance sheet (memory: `features/leads/intake-central-hub`) |
| `MeasurementsManager.tsx` | 719 | Lists `project_measurements` + `measurement_areas`; FullMeasurementDialog; stairs in steps not sqft |
| `Catalog.tsx` | 802 | Service catalog CRUD; HEIC convert; Install/Sanding/Stairs/Repair/Add-on order |
| `Automations.tsx` | 97 | Wraps `StageFlowList`, `SequenceDetail`, `DripEditor` (`useAutomationFlows`) |
| `WeeklyReview.tsx` | 507 | Close-Week snapshot → `weekly_reviews` + `weekly_review_projects` |
| `CrewsVans.tsx` | 721 | Crews & Fleet (memory: `features/management/crews-and-payroll-hub`) |
| `GalleryHub.tsx` | 20 | Tabbed: GalleryPublicPanel + GalleryFeedPanel |
| `GalleryManager.tsx` | 959 | Folder/post manager — gallery_folders, gallery_projects, feed_posts, feed_post_images, media_files |
| `ProjectDetail.tsx` | 448 | Older detail layout, redirects mostly to JobDetail |
| `ProjectDocuments.tsx` | 65 | Wraps `ProjectDocumentsManager` |
| `FeedPostDetail.tsx` / `FeedPostEdit.tsx` | 201 / 113 | feed_posts CRUD + comments |
| `AdminAuth.tsx` | 357 | Email/password sign-in screen; PWA-aware redirect logic |

### 6.16 Hooks summary (selected)

| Hook | LoC | Tables / RPCs | Purpose |
|---|---|---|---|
| `admin/useAdminData` | 143 | `leads`, `projects` | Cross-page data for admin pages |
| `admin/useDashboardData` | 249 | `get_dashboard_metrics` RPC + tasks/views | Dashboard SSOT |
| `admin/useFeedData` | 402 | feed_posts, feed_post_images, feed_comments, feed_folders, media_files | Full feed CRUD |
| `admin/usePartnersData` | 131 | `partners` | Partner list/details |
| `useLeadPipeline` | 194 | RPC `transition_lead_status` | Stage advance + UI labels/colors |
| `useLeadConversion` | 62 | RPC `convert_lead_to_project` | Lead→project |
| `useLeadFollowUp` | 160 | `leads.follow_up_actions` | Follow-up entries |
| `useLeadNRA` | 84 | RPC `get_lead_nra`, `get_leads_nra_batch` | Next-required action |
| `useProjectsHub` | 234 | projects (+job_costs+partners+members), proposals, measurements, material_costs, labor_entries, weekly_reviews | Hub aggregator |
| `useJobCosts` / `useJobCostItems` | 167 / 92 | job_costs, job_cost_items | Margin & line items |
| `useMaterialCosts` / `useLaborEntries` | 88 / 88 | mirrors → job_costs via trigger | |
| `useJobProof` | 190 | job_proof, media_files, storage `media` | Before/after photos |
| `useInvoices` | 264 | invoices, invoice_items, invoice_payment_schedule | Full invoice CRUD |
| `usePayments` | 148 | payments | Income/labor/expense |
| `useProposals` / `useProposalGeneration` / `useProposalValidation` | 160 / 307 / 60 | proposals + RPC `validate_proposal_margin` | Proposal pipeline |
| `useTasks` | 156 | tasks | Mission Control |
| `useNotifications` | 63 | notifications + Realtime | Inbox |
| `useAutomationFlows` | 216 | automation_sequences, automation_drips | Drip campaigns |
| `useCompanySettings` | 150 | company_settings + storage `media` | Branding |
| `useNodeOverrides` | 148 | system_node_overrides | Mind-map persistence |
| `useReferralProfile` | 222 | referral_profiles, referrals, referral_rewards | Booster gamification |
| `useCollaboratorProjects` / `useCollaboratorSchedule` / `useCollaboratorUpload` | 52 / 56 / 69 | project_members, appointments, edge `collaborator-upload` | Field portal |
| `useMeasurements` | 239 | project_measurements, measurement_areas | Areas & totals |
| `useProjectDocuments` | 152 | project_documents + storage | Files |
| `useProjectActivity` / `useProjectSignals` | 112 / 87 | project_comments + computed signals | Activity feed |
| `useWeeklyReviews` | 106 | weekly_reviews + weekly_review_projects | Close-week |

---

## 7. Cross-cutting observations

1. **DB is the contract.** All critical business rules (margin gate, follow-up gate, accepted-proposal gate, before/after gate, cost aggregation, NRA computation) live in PL/pgSQL. The frontend presents friendly errors but cannot bypass.
2. **No declared FOREIGN KEYs.** Integrity is enforced via RLS subqueries + triggers. A single malformed UUID in a write path is application-bug surface area.
3. **Multi-tenancy ready, single-tenant deployed.** Schema fully tenant-scoped via `organization_id` and `get_user_org_id()`. Codebase still hardcodes `AXO_ORG_ID` for INSERTs — this is the single largest blocker to the FloorPro multi-tenant rollout.
4. **Public ingress points are anon RLS policies, not endpoints.** `leads_public_insert`, `quiz_responses`, `referrals`, `proposal_signatures` (token-gated), `proposal_change_requests` (token-gated), `invoices_public_mark_viewed` (token-gated). Token-gated reads use `share_token` (proposals, invoices, feed_posts) or `portal_token` (customers).
5. **Two RBAC layers (intentional).** `app_role` (global, used by `ProtectedRoute` and admin-only RLS) vs `org_member_role` (tenant role). Partner access is via separate `partner_users` + `get_partner_id_for_user()`, fully isolated.
6. **Heavy components warrant audit.** `LeadControlModal` (1302), `JobDetail` (1146), `Proposals` (1042), `QuickQuoteSheet` (1008), `GalleryManager` (959), `PartnerDetailPanel` (984), `ProposalGenerator` (911) — collectively ~7300 LoC concentrate most of the admin write paths.
7. **Cron permissions** were not readable via the standard admin DB role — verify `cron.job` contents with service role to confirm `run_sla_engine` and proof-reminder schedules.

— END —
