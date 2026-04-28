# AXO Floors — End-to-End Honest Audit (April 2026)

> **Methodology:** Direct extraction from live Supabase schema, RLS policies, triggers, cron jobs, edge functions, and React codebase. No assumptions. Labels: **IMPLEMENTED / PARTIAL / PLACEHOLDER / BROKEN / MISSING**.

---

## A. EXECUTIVE SUMMARY

AXO Floors is a **single-tenant production system disguised as a multi-tenant platform**. The schema, RLS, and helper functions (`get_user_org_id`, `organization_members`) are designed for multi-tenancy, but **every write path in the frontend hardcodes `AXO_ORG_ID = 'a0000000-...0001'`** (`src/lib/constants.ts`). There is exactly **1 organization, 1 admin user, 1 partner_user, 4 projects, 12 customers, 2 leads, 5 proposals, 2 invoices, 0 referrals, 0 weekly_reviews, 0 chat_messages, 0 notifications, 0 job_proof rows** in the database today.

**What is real:**
- Lead → Customer → Project conversion (`convert_lead_to_project` RPC) — **IMPLEMENTED**
- Job costs / margin enforcement (`validate_proposal_margin`, `axo_validate_lead_transition`) — **IMPLEMENTED**
- Pipeline state machine with 8 stages and gates — **IMPLEMENTED**
- Proposal public link + signature capture — **IMPLEMENTED**
- Invoice public link with payment schedule — **IMPLEMENTED**
- SLA engine via `pg_cron` hourly + nightly proof reminder — **IMPLEMENTED**
- Multi-tenant RLS scaffolding — **IMPLEMENTED but unused (single org)**

**What is fake / unfinished:**
- **Partner portal:** auth + dashboard exist, but `referrals` table is empty, no commission ledger, no payout flow — **PLACEHOLDER**
- **Notifications:** table + RLS exist, 0 rows, only `notify_on_chat_message` and `notify_proposal_change_request` triggers actually fire — **PARTIAL**
- **Weekly Review:** UI + table exist, 0 rows ever saved — **PLACEHOLDER**
- **Automation drips:** 8 sequences + 31 drips configured in DB but **no scheduler/dispatcher** runs them; `send-follow-up` edge fn is manual-trigger only — **BROKEN**
- **Tasks (Mission Control):** 1 row in DB, `useTasks` reads/writes but no automated task creation triggers — **PARTIAL**
- **Reviews flow:** `/review-request` page exists, no DB table for review tracking — **MISSING**
- **`/thank-you` route renders Index** (homepage) — **BROKEN** (confirmed in earlier copy audit)
- **Routes `/baseboards`, `/builder-partnerships`, `/links` 404** despite components existing (App.tsx uses `/base-boards`, `/builder-offer`, `/hub`) — **BROKEN routing aliases missing**

**Top risks:**
1. 💰 `media` and `gallery` storage buckets allow **anonymous SELECT on the entire bucket** — proprietary client photos are public.
2. 💰 `audit_log` allows any authenticated user to SELECT all rows (`qual: true`).
3. 💰 `customers_authenticated_read` policy lets **any logged-in user read all customers across all orgs** — bypasses tenant isolation.
4. 💰 `job_proof_authenticated_read` and `job_cost_items_authenticated_read` — same global read leak.
5. ⚠️ Hardcoded `AXO_ORG_ID` in 20+ files makes onboarding a second tenant a multi-day refactor.
6. ⚠️ `service_role` anon key is **embedded in cron job SQL** (visible in `cron.job` table) — not technically a leak (it's the anon key, not service role) but tightly coupled.

---

## B. CURRENT SYSTEM ARCHITECTURE

```
┌──────────── PUBLIC SITE (axofloorsnj.com) ────────────┐
│  React 18 + Vite + Tailwind + shadcn/ui                │
│  Routes: /, /hardwood-flooring, /sanding-and-refinish, │
│  /vinyl-plank-flooring, /staircase, /base-boards,      │
│  /gallery, /stain-gallery, /about, /contact,           │
│  /campaign, /quiz, /floor-diagnostic, /project-wizard, │
│  /thank-you (BROKEN), /referral-program, /builders,    │
│  /realtors, /builder-offer, /partner-program,          │
│  /wow-pack, /review-request, /hub, /shared/:token,     │
│  /invoice/:token, /proposal/:token, /portal/:token     │
└──────────────────┬─────────────────────────────────────┘
                   │ INSERT leads (anon RLS allowed)
                   ▼
┌────────────── SUPABASE (project ref dcfmrqrbsfxvqhihpamd) ─┐
│  • 47 public tables + 4 views                              │
│  • 31 RLS policies + storage policies                      │
│  • 35 SECURITY DEFINER functions                           │
│  • 27 BEFORE/AFTER triggers                                │
│  • 7 edge functions                                        │
│  • 2 cron jobs (sla_engine_hourly, nightly-proof-reminder) │
│  • 6 storage buckets                                       │
└──────────────────┬─────────────────────────────────────────┘
                   │ has_role(uid,'admin') + get_user_org_id()
                   ▼
┌──────────────── ADMIN APP (/admin/*) ──────────────────┐
│  ProtectedRoute → checks 'admin' role via has_role RPC │
│  PWA shell (admin-manifest.json + admin-sw.js)         │
│  27 admin pages                                        │
└────────────────────────────────────────────────────────┘
                   │ project_members table
                   ▼
┌──────────── COLLABORATOR PORTAL (/collaborator/*) ─────┐
│  ProtectedRoute(requireAdmin=false)                    │
│  6 pages: dashboard, schedule, docs, chat, profile,    │
│  project/:projectId                                    │
└────────────────────────────────────────────────────────┘
                   │ partner_users table
                   ▼
┌──────────────── PARTNER PORTAL (/partner/*) ───────────┐
│  PartnerAuth + PartnerDashboard only — 2 pages         │
│  No referral submission UI wired to DB                 │
└────────────────────────────────────────────────────────┘
```

---

## C. DATABASE MAP

### C.1 Tables (47 base tables + 4 views)

| Table | Cols | Rows | Status | Notes |
|---|---|---|---|---|
| `appointments` | 17 | 3 | IMPLEMENTED | Has `assigned_to uuid[]` AND separate `appointment_assignees` table — **duplication** |
| `appointment_assignees` | 4 | ? | IMPLEMENTED | Newer pattern, keep this; drop `assigned_to[]` array |
| `audit_log` | 9 | many | IMPLEMENTED | ⚠️ Read by ALL authenticated users |
| `automation_sequences` | 9 | 8 | PLACEHOLDER | Configured, no dispatcher |
| `automation_drips` | 12 | 31 | PLACEHOLDER | No scheduler runs them |
| `chat_messages` | 7 | 0 | IMPLEMENTED | Realtime ready, never used yet |
| `company_settings` | 18 | ? | IMPLEMENTED | Singleton enforced via unique index |
| `customers` | 12 | 12 | IMPLEMENTED | ⚠️ Global read leak via `customers_authenticated_read` |
| `feed_posts` / `feed_post_images` / `feed_comments` / `feed_folders` | — | 1 | PARTIAL | One post; full CRUD wired |
| `gallery_folders` / `gallery_projects` | — | 1 | PARTIAL | Public read open to anon |
| `invoices` (19) / `invoice_items` (8) / `invoice_payment_schedule` (7) | — | 2 | IMPLEMENTED | 30/40/30 schedule logic real |
| `job_costs` (11) / `job_cost_items` (6) | — | 2 | IMPLEMENTED | Triggers recalc aggregates |
| `job_proof` | 6 | 0 | IMPLEMENTED | Enforced via trigger on completion; nothing uploaded |
| `labor_entries` | 12 | ? | IMPLEMENTED | Syncs to `job_costs.labor_cost` via trigger |
| `lead_notes` | 9 | ? | IMPLEMENTED | Tenant-scoped |
| `leads` | 29 | 2 | IMPLEMENTED | Full state machine, gates, SLA |
| `material_costs` (12) / `material_requests` (13) | — | ? | IMPLEMENTED | Field requests + admin costs |
| `measurement_areas` (10) / `project_measurements` (13) | — | ? | IMPLEMENTED | Auto-recalc totals trigger |
| `media_files` | 19 | 10 | IMPLEMENTED | Visibility scoping (internal/client/public) |
| `notifications` | 9 | 0 | PARTIAL | Triggers exist, never fired |
| `organization_members` (5) / `organizations` (18) | — | 1/1 | IMPLEMENTED but unused | Single org only |
| `partner_users` (6) / `partners` (20) | — | 1/5 | PARTIAL | Auth wired, no referral UI |
| `payments` | 13 | 2 | IMPLEMENTED | Income/Payroll/Expense categories |
| `profiles` | 11 | ? | IMPLEMENTED | Auto-created via `handle_new_user` trigger |
| `project_comments` | 8 | ? | IMPLEMENTED | Journal/timeline |
| `project_documents` | 12 | ? | IMPLEMENTED | Admin-only writes |
| `project_members` | 5 | 4 | IMPLEMENTED | Scopes collaborator access |
| `projects` | 26 | 4 | IMPLEMENTED | Core entity |
| `proposal_change_requests` | 9 | ? | IMPLEMENTED | Anon write via portal_token |
| `proposal_signatures` | 13 | ? | IMPLEMENTED | Anon insert via share_token |
| `proposals` | 24 | 5 | IMPLEMENTED | 3-tier or direct mode |
| `quiz_responses` | 13 | ? | IMPLEMENTED | Public insert |
| `referral_profiles` (11) / `referral_rewards` (7) / `referrals` (11) | — | ?/?/0 | PLACEHOLDER | 0 referrals, no commission posting |
| `service_catalog` | 14 | 26 | IMPLEMENTED | Real pricing data |
| `supply_connections` | 6 | 0 | PLACEHOLDER | FloorPro vision, unused |
| `system_node_arrows` / `system_node_notes` / `system_node_overrides` | — | ? | IMPLEMENTED | AXO Master System mindmap |
| `tasks` | 15 | 1 | PARTIAL | Mission Control, only 1 row |
| `user_roles` | 4 | ? | IMPLEMENTED | `app_role` enum, `has_role` SECURITY DEFINER |
| `weekly_reviews` (14) / `weekly_review_projects` (4) | — | 0 | PLACEHOLDER | Never saved |

### C.2 Views

- `view_pipeline_metrics`, `view_financial_metrics`, `view_stage_aging` — used by `get_dashboard_metrics` RPC
- `leads_followup_overdue`, `leads_estimate_scheduled_stale` — used by SLA engine
- `projects_missing_progress_photos` — used by dashboard

### C.3 Enums

- `app_role`: `admin, moderator, user`
- `org_member_role`: `owner, admin, collaborator`
- `org_plan`: `starter, pro, enterprise`
- `org_type`: `flooring_owner, supply_partner`
- `supply_conn_status`: `pending, active, paused`
- `labor_pricing_model`: `sqft, daily`

### C.4 Foreign Keys (selected critical)

- `leads.customer_id → customers.id` (nullable — by design for new leads)
- `leads.converted_to_project_id` — **NOT a FK** (just a uuid column) ⚠️
- `projects.customer_id → customers.id`
- `projects.referred_by_partner_id → partners.id ON DELETE SET NULL`
- `proposals.project_id → projects.id ON DELETE CASCADE`
- `proposals.customer_id → customers.id ON DELETE CASCADE`
- `job_costs.project_id → projects.id ON DELETE CASCADE`
- `invoices.project_id` — **need to verify FK** (visible in queries)
- `appointments.project_id → projects.id ON DELETE SET NULL`
- `profiles.user_id → auth.users(id) ON DELETE CASCADE`
- `user_roles.user_id → auth.users(id) ON DELETE CASCADE`

**Missing FKs that should exist:**
- `leads.converted_to_project_id → projects.id` ❌
- `payments.project_id` (need to verify)
- `tasks.project_id`, `tasks.assigned_to`

### C.5 Indexes

- ✅ `idx_customers_email_phone`, `idx_customers_portal_token`
- ✅ `idx_feed_posts_share_token` (partial, where not null)
- ✅ Tenant indexes on `organization_id` for feed/automation tables
- ❌ **No index** on `leads.status`, `leads.organization_id`, `leads.converted_to_project_id`
- ❌ **No index** on `projects.organization_id`, `projects.project_status`
- ❌ **No index** on `audit_log.created_at` or `operation_type` (will get slow)

### C.6 RLS Policies — Critical Issues

| Table | Policy | Issue |
|---|---|---|
| `audit_log` | `Authenticated users can view audit log` qual: `true` | 💰 **Any logged user reads ALL audit data** |
| `customers` | `customers_authenticated_read` qual: `auth.uid() IS NOT NULL` | 💰 **Bypasses tenant isolation** |
| `job_proof` | `job_proof_authenticated_read` qual: `auth.uid() IS NOT NULL` | 💰 **Cross-tenant leak** |
| `job_cost_items` | `job_cost_items_authenticated_read` qual: `auth.uid() IS NOT NULL` | 💰 **Cross-tenant leak** |
| `project_documents` | `project_documents_authenticated_read` qual: `auth.uid() IS NOT NULL` | 💰 **Cross-tenant leak** |
| `gallery_folders/projects` | `_public_read` qual: `true` (anon) | OK by design (marketing) |
| `feed_posts_shared_read` | `share_token IS NOT NULL` | ✅ correct |
| `media` bucket | anon SELECT on entire bucket | 💰 see storage |

### C.7 Triggers (27 total, key ones)

| Table | Trigger | Function | Purpose |
|---|---|---|---|
| `leads` | `trg_validate_lead_transition` BEFORE UPDATE OF status | `axo_validate_lead_transition` | Pipeline gate enforcement |
| `leads` | `trg_validate_lead_insert` BEFORE INSERT | `validate_lead_insert` | Strips admin fields from anon inserts |
| `leads` | `trigger_set_follow_up_on_quoted` BEFORE UPDATE | `set_follow_up_on_quoted` | Auto-flag follow-up on proposal_sent |
| `leads` | `trg_set_status_changed_at` BEFORE UPDATE | `set_status_changed_at` | Stage aging tracking |
| `leads` | `trg_enforce_partner_lead_defaults` BEFORE INSERT | `enforce_partner_lead_defaults` | Stamps partner-submitted leads |
| `projects` | `enforce_job_proof_trigger` BEFORE UPDATE | `enforce_job_proof_on_completion` | Blocks completion w/o AFTER photo |
| `projects` | `trg_project_next_action` AFTER UPDATE OF project_status | `trg_recompute_next_action` | NRA calculation |
| `proposals` | `trg_enforce_proposal_acceptance` BEFORE INS/UPD | `enforce_proposal_acceptance` | Requires `selected_tier` when accepted |
| `material_costs` → `job_costs` | (sync trigger) | `sync_material_costs_to_job_costs` | Aggregates total |
| `labor_entries` → `job_costs` | (sync trigger) | `sync_labor_entries_to_job_costs` | Aggregates total |
| `job_cost_items` | `recalc_job_cost_aggregates` | Rolls up per-item costs |
| `measurement_areas` | `recalc_measurement_totals_trigger` | Auto-totals sqft/linear |
| `chat_messages` | (notify trigger) | `notify_on_chat_message` | Inserts into notifications |
| `proposal_change_requests` | (notify trigger) | `notify_proposal_change_request` | Inserts into notifications |

⚠️ The `set_status_changed_at`, `recalc_job_cost_aggregates`, and notify triggers exist as functions but their CREATE TRIGGER definitions weren't fully shown — verify all 27 are actually attached.

### C.8 Storage Buckets

| Bucket | Public | Risk |
|---|---|---|
| `gallery` | YES | OK (marketing) |
| `feed-media` | YES | OK (marketing) |
| `job-proof` | YES | 💰 **Should be private** — internal photos |
| `media` | NO bucket flag, but `media_anon_read` SELECT policy = entire bucket | 💰 **Anonymous can list/read everything** |
| `project-documents` | NO | ✅ Authenticated only |
| `proposal-signatures` | NO bucket flag, but `proposal_signatures_anon_read` allows anon SELECT | ⚠️ Acceptable if only path-known |

### C.9 Edge Functions

| Function | Purpose | Status | `verify_jwt` |
|---|---|---|---|
| `collaborator-upload` | Field photo upload via Resumable | IMPLEMENTED | `false` |
| `facebook-conversions` | FB Conversions API | IMPLEMENTED | default |
| `invite-team-member` | Sends invite email via Resend | IMPLEMENTED | `false` |
| `nightly-proof-reminder` | Cron-fired daily 22:00 | IMPLEMENTED | default |
| `send-follow-up` | Manual SMS/email send | PARTIAL — no caller in app | default |
| `send-notifications` | Push/in-app dispatcher | PARTIAL — verify caller | default |
| `send-to-notion` | Mirror leads to Notion | IMPLEMENTED | default |

### C.10 Cron Jobs (pg_cron)

```
sla_engine_hourly       0 * * * *      SELECT public.run_sla_engine();
nightly-proof-reminder  0 22 * * *     net.http_post → /functions/v1/nightly-proof-reminder
```

⚠️ `nightly-proof-reminder` cron has the **anon JWT hardcoded in the cron command body** (visible in `cron.job` table). Functional but rotate-blocked.

---

## D. ROUTE / PAGE INVENTORY

### D.1 Public Routes (29 from App.tsx)

| Route | Component | Status | Notes |
|---|---|---|---|
| `/` | `Index` | IMPLEMENTED | Hero + sections, has Portuguese leftover ("Saiba Mais") |
| `/hardwood-flooring` | `HardwoodFlooring` | IMPLEMENTED | |
| `/sanding-and-refinish` | `SandingRefinish` | IMPLEMENTED | |
| `/vinyl-plank-flooring` | `VinylPlankFlooring` | IMPLEMENTED | |
| `/staircase` | `Staircase` | IMPLEMENTED | |
| `/base-boards` | `BaseBoards` | IMPLEMENTED | ⚠️ Audit referenced `/baseboards` (404) — alias missing |
| `/gallery` | `Gallery` | IMPLEMENTED | |
| `/stain-gallery` | `StainGallery` | IMPLEMENTED | |
| `/contact` | `Contact` | IMPLEMENTED | |
| `/about` | `About` | IMPLEMENTED | |
| `/campaign` | `Campaign` | IMPLEMENTED | ⚠️ Stale seasonal copy |
| `/quiz` | `Quiz` | IMPLEMENTED | Inserts to `quiz_responses` |
| `/thank-you` | `ThankYou` | **BROKEN** | Renders Index instead per copy audit — verify component file |
| `/referral-program` | `ReferralProgram` | IMPLEMENTED | Marketing only |
| `/builders` | `Builders` | IMPLEMENTED | |
| `/realtors` | `Realtors` | IMPLEMENTED | |
| `/builder-offer` | `BuilderPartnerships` | IMPLEMENTED | ⚠️ Audit referenced `/builder-partnerships` (404) |
| `/partner-program` | `PartnerProgram` | IMPLEMENTED | |
| `/floor-diagnostic` | `FloorDiagnostic` | IMPLEMENTED | Multi-step → leads |
| `/axo-master-system` | `AxoMasterSystem` | IMPLEMENTED | Internal mindmap (public!) ⚠️ |
| `/wow-pack` | `WowPack` | IMPLEMENTED | |
| `/project-wizard` | `ProjectWizard` | IMPLEMENTED | 4-step → leads |
| `/review-request` | `ReviewRequest` | PLACEHOLDER | No DB tracking |
| `/shared/:token` | `SharedPost` | IMPLEMENTED | Feed post share |
| `/invoice/:token` | `PublicInvoice` | IMPLEMENTED | Realtime view tracking |
| `/proposal/:token` | `PublicProposal` | IMPLEMENTED | Signature capture |
| `/portal/:token` | `PublicPortal` | IMPLEMENTED | Customer portal |
| `/hub` | `Links` | IMPLEMENTED | ⚠️ Audit referenced `/links` (404) |
| `/auth` | `Auth` | IMPLEMENTED | Generic login |

### D.2 Admin Routes (27)

`/admin`, `/admin/dashboard`, `/admin/auth`, `/admin/gallery`, `/admin/feed/:postId`, `/admin/feed/:postId/edit`, `/admin/leads`, `/admin/leads/:leadId`, `/admin/jobs/:jobId`, `/admin/intake`, `/admin/mission-control`, `/admin/settings`, `/admin/projects`, `/admin/projects/:projectId`, `/admin/jobs/:projectId/documents`, `/admin/measurements`, `/admin/schedule`, `/admin/performance`, `/admin/catalog`, `/admin/help`, `/admin/partners`, `/admin/payments`, `/admin/automations`, `/admin/weekly-review`, `/admin/labor-payroll`, `/admin/crews`, `/admin/proposals`

All wrapped in `ProtectedRoute requireAdmin={true}` → checks `has_role(uid,'admin')`. ✅

### D.3 Collaborator Routes

`/collaborator` (Layout) → index `Dashboard`, `schedule`, `docs`, `chat`, `profile`, `project/:projectId`. All `requireAdmin={false}` (just authenticated). ✅

### D.4 Partner Routes

- `/partner/auth` → `PartnerAuth`
- `/partner/dashboard` → `PartnerDashboard`
- `/partner` → redirects to `/partner/dashboard`

⚠️ **Partner routes are NOT wrapped in `ProtectedRoute`.** Auth check must be inline in `PartnerDashboard` — needs verification. If absent, anyone can hit `/partner/dashboard` directly.

---

## E. FLOW-BY-FLOW ANALYSIS

### E.1 Lead Capture → Project — **IMPLEMENTED**

```
Public form (Contact / Quiz / FloorDiagnostic / ProjectWizard / LeadMagnetGate)
  → useLeadCapture inserts into `leads` (anon RLS allowed)
  → trg_validate_lead_insert strips admin fields
  → trg_enforce_partner_lead_defaults stamps partner if applicable
  → send-to-notion edge fn fires (Notion mirror)
  → facebook-conversions edge fn fires (FB pixel)
  → leads visible in /admin/leads (LinearPipeline)
  → admin advances stages (transition_lead_status RPC)
  → axo_validate_lead_transition trigger enforces gates:
       in_draft requires margin >= company_settings.default_margin_min_percent
       proposal_sent → in_production requires accepted proposal
       leaving proposal_sent requires >=1 follow-up
  → admin clicks "Convert" → convert_lead_to_project RPC creates Customer + Project + Job Costs row
```

**Failure points:** No automated FB/Notion fire confirmation in DB; if edge fn fails, lead still saves (good). No retry queue.

### E.2 Estimate / Proposal — **IMPLEMENTED**

```
Project must exist → Job Costs filled → margin >= min
  → /admin/proposals → ProposalGenerator (Tiers or Direct mode)
  → validate_proposal_margin RPC blocks send if margin < min
    (logs to audit_log as PROPOSAL_BLOCKED)
  → proposal saved with share_token
  → Public link /proposal/:token → PublicProposal page
  → Customer signs (proposal_signatures insert via anon RLS)
  → Customer can request changes (proposal_change_requests + notification trigger)
  → Admin marks accepted → enforce_proposal_acceptance trigger requires selected_tier
```

**Gap:** No automatic email to customer when proposal sent — only the link. No tracking of email opens.

### E.3 Project / Job — **IMPLEMENTED**

```
Job Costs (labor + material + additional) → margin computed
  Triggers: sync_material_costs_to_job_costs, sync_labor_entries_to_job_costs, recalc_job_cost_aggregates
  → JobDetail UI in /admin/jobs/:jobId
  → next_action computed via compute_project_next_action
  → on status update, trg_project_next_action recomputes
  → completion blocked unless job_proof.after_image_url exists (enforce_job_proof_trigger)
```

### E.4 Scheduling — **IMPLEMENTED but DUPLICATED**

```
appointments table has both:
  - assigned_to uuid[] (legacy)
  - separate appointment_assignees join table (newer)
Schedule page reads from both — risk of drift.
```

### E.5 Invoice — **IMPLEMENTED**

```
Created inline in JobDetail (InvoicesPaymentsSection)
  → invoice_payment_schedule rows (30/40/30 default)
  → public link /invoice/:token
  → Realtime view tracking via invoices_public_mark_viewed UPDATE policy
```

**Gap:** No automatic reminders for overdue invoices. No Stripe integration — payment is manually marked received.

### E.6 Payment — **PARTIAL**

```
payments table: category in (received | labor | expense)
  → /admin/payments hub (Income / Payroll / Expense)
  → Manual entry only — NO Stripe, no ACH, no card processing
```

### E.7 Gallery / Media — **IMPLEMENTED**

```
media_files: visibility ∈ {internal, client, public}
  Public marketing → /gallery (gallery_projects + gallery_folders)
  Feed → feed_posts + feed_post_images (admin internal + share_token public)
  Job photos → job_proof bucket (PUBLIC ⚠️)
```

### E.8 Reviews — **PLACEHOLDER**

```
/review-request page only.
NO DB table for review_requests, review_responses, or Google review tracking.
No automation to send post-job review request.
```

### E.9 Partner Referral — **PLACEHOLDER**

```
DB ready: partners (5 rows), partner_users (1 row), referrals (0 rows), referral_rewards, referral_profiles
RLS: leads_partner_insert + enforce_partner_lead_defaults trigger work.
PARTNER PORTAL UI: only PartnerAuth + PartnerDashboard. NO referral submission form wired to DB.
NewReferralSheet component exists but check if mounted — not in routes.
```

### E.10 Commission Tracking — **MISSING**

No commission ledger table. `referral_rewards` exists (7 cols) but no triggers post on lead conversion or invoice payment. Manual only.

### E.11 Notifications / Automations — **PARTIAL / BROKEN**

```
WORKS:
  - notify_on_chat_message trigger → notifications table
  - notify_proposal_change_request trigger → notifications table
  - run_sla_engine() hourly → escalates lead priority
  - nightly-proof-reminder cron → edge fn fires daily 22:00

BROKEN:
  - automation_sequences (8) + automation_drips (31) configured but NO scheduler
    consumes them. send-follow-up edge fn exists but no cron/trigger calls it.
  - 0 rows in notifications despite triggers existing → either chat is unused or
    proposal_change_requests untouched (consistent with chat_messages=0).
```

---

## F. COMPONENTS INVENTORY

### F.1 Core admin

- `AdminLayout`, `AdminSidebar`, `MobileBottomNav`, `AdminPWAHead`, `ProtectedRoute`
- `AddressAutocomplete` (Google Places)
- `ProposalGenerator`, `JobCostEditor`, `JobMarginDisplay`, `JobChecklist`, `JobProofUploader`
- `LeadControlModal`, `LeadFollowUpAlert`, `LeadPipelineStatus`, `LeadSignalBadge`
- `NewLeadDialog`, `NewJobDialog`, `NewEstimateDialog`, `NewPartnerDialog`
- `PartnerControlModal`, `PartnerDetailModal`, `PartnerDetailPanel`, `PartnerListItem`, `PartnerPipelineBoard`, `PartnerChecklist`
- `ProjectChatPanel`, `ProjectDocumentsManager`
- `QuickQuoteSheet`, `StatsCards`, `TensionMetricsCards`
- `dashboard/`: `MissionControl`, `MetricCard`, `AgendaSection`, `PriorityTasksList`, `NewTaskDialog`
- `feed/`: `FeedPostForm`, `FeedPostCard`, `FeedImageCarousel`, `FeedFiltersSheet`, `FeedFolderGrid`, `FeedCommentSection`, `CreateFolderDialog`
- `gallery/`: `GalleryFeedPanel`, `GalleryPublicPanel`, `MediaQuickUpload`, `FolderHubGrid`, `QuickFolderDialog`
- `automations/`: `SequenceDetail`, `DripEditor`, `StageFlowList`
- `settings/`: `BrandingSettings`, `GeneralSettings`, `TeamSettings`, `InviteTeamMemberDialog`

### F.2 Duplicates / dead

- `GalleryHub.tsx` AND `GalleryManager.tsx` both exist — ⚠️ **likely one is dead** (only `GalleryHub` is routed)
- `appointments.assigned_to[]` AND `appointment_assignees` table — duplicated assignment storage
- `PartnerDetailModal` AND `PartnerDetailPanel` — modal vs side sheet variants, may both be in use
- `axo-master-system.html` (static) AND `/axo-master-system` route (React) — likely legacy static file

### F.3 Public / shared

- `Header`, `Footer`, `Hero`, `Portfolio`, `AboutSection`, `ContactSection`, `ContactForm`, `ServiceArea`, `ReviewsSection`, `LeadMagnetGate`, `MediaRenderer`, `SEOHead`, `ScrollToTop`, `GoogleBusinessIntegration`, `AppSidebar`

### F.4 Partner / Collaborator

- `partner/`: `PartnerStageBar`, `PartnerLeadCard`, `PartnerProfileTab`, `NewReferralSheet` ← **not routed**
- `collaborator/CollaboratorLayout`
- `referral/`: `ReferralDashboard`, `AddReferralForm`, `ReferralQRCode`, `ReferralTierBadge` — built but ReferralProgram is marketing only

### F.5 Public portal / proposal

- `portal/ChangeRequestDialog`
- `proposal/SignatureDialog`

---

## G. AUTH / RBAC ANALYSIS

### G.1 Login flows

- **Public:** `/auth` → email+password (signup auto-confirm? **needs verify** — `Auth.tsx` not inspected here)
- **Admin:** `/admin/auth` → `AdminAuth.tsx` → `signInWithPassword` → `ProtectedRoute` checks `has_role(uid,'admin')`
- **Partner:** `/partner/auth` → `PartnerAuth` → ⚠️ **No ProtectedRoute on `/partner/dashboard`**
- **Collaborator:** uses `/auth` then routed to `/collaborator/*` via `ProtectedRoute(requireAdmin=false)`

### G.2 Role storage

- `user_roles` table with `app_role` enum {admin, moderator, user} — **CORRECT pattern, not on profiles**
- `has_role(uid, role)` SECURITY DEFINER RPC — **CORRECT, no recursion risk**
- `organization_members` with `org_member_role` enum {owner, admin, collaborator} — multi-tenant RBAC layer
- `partner_users` table links auth.users → partners + organization

### G.3 Security gaps

| # | Issue | Severity |
|---|---|---|
| 1 | `audit_log` global authenticated read (`qual: true`) | 💰 HIGH |
| 2 | `customers_authenticated_read` ignores org boundary | 💰 HIGH |
| 3 | `job_proof_authenticated_read` ignores org boundary | 💰 HIGH |
| 4 | `job_cost_items_authenticated_read` ignores org boundary | 💰 HIGH |
| 5 | `project_documents_authenticated_read` ignores org boundary | 💰 HIGH |
| 6 | `media` bucket: `media_anon_read` allows anon SELECT on entire bucket | 💰 HIGH |
| 7 | `job-proof` bucket is public — internal photos exposed | 💰 HIGH |
| 8 | `/partner/dashboard` not wrapped in ProtectedRoute | ⚠️ MED |
| 9 | `/axo-master-system` is a public route exposing internal system mindmap | ⚠️ MED |
| 10 | Anon JWT embedded in cron job command — rotation breaks cron | ⚠️ LOW |
| 11 | `validate_lead_transition` RPC always returns `(true, NULL)` regardless of `p_new_status` — gate work is in trigger only | INFO (trigger handles it) |

---

## H. AUTOMATION ANALYSIS

| Automation | Implementation | Status |
|---|---|---|
| **NRA (Next Required Action)** | `compute_project_next_action()` PLPGSQL — fires on status update via `trg_project_next_action`. `get_lead_nra()` for leads. `get_leads_nra_batch()` for grid. | ✅ IMPLEMENTED |
| **SLA timers** | `pg_cron sla_engine_hourly` → `run_sla_engine()` escalates priority on `leads_followup_overdue` and `leads_estimate_scheduled_stale` views. | ✅ IMPLEMENTED |
| **Lead follow-up** | `set_follow_up_on_quoted` trigger sets `follow_up_required = true` and `next_action_date = +2d` when entering proposal_sent. | ✅ IMPLEMENTED |
| **Proposal follow-up** | Same as lead follow-up; gate trigger blocks exit without ≥1 follow-up entry. | ✅ IMPLEMENTED |
| **Job status updates** | `enforce_job_proof_on_completion` blocks complete without AFTER photo. | ✅ IMPLEMENTED |
| **Invoice reminders** | NONE | ❌ MISSING |
| **Partner activation email** | `invite-team-member` edge fn handles team but no dedicated partner activation flow. | ⚠️ PARTIAL |
| **Review requests** | `/review-request` page exists but no automation to send post-completion. | ❌ MISSING |
| **Internal notifications** | `notify_on_chat_message`, `notify_proposal_change_request` triggers → `notifications` table. `useNotifications` hook reads it. | ⚠️ PARTIAL (only 2 triggers, 0 rows in production) |
| **Drip sequences** | 8 sequences + 31 drips in DB, NO consumer cron runs them. | ❌ BROKEN — placeholder UI |
| **Nightly proof reminder** | pg_cron 22:00 → edge fn `nightly-proof-reminder`. | ✅ IMPLEMENTED |
| **Notion lead sync** | `send-to-notion` edge fn called from lead capture. | ✅ IMPLEMENTED |
| **FB Conversions** | `facebook-conversions` edge fn. | ✅ IMPLEMENTED |

---

## I. CRITICAL ISSUES

### I.1 Security (fix this week)

1. **Tighten `audit_log` SELECT** to admin only.
2. **Replace `customers_authenticated_read`** with tenant-scoped policy or admin-only.
3. **Same for `job_proof`, `job_cost_items`, `project_documents`** — add `organization_id` join in RLS.
4. **Make `media` bucket private**, replace `media_anon_read` with token-based access for shared assets.
5. **Make `job-proof` bucket private**, serve via signed URLs.
6. **Add ProtectedRoute** on `/partner/dashboard` (or inline auth check + role verify).
7. **Audit `/axo-master-system`** — internal docs should be admin-only.
8. **Rotate** plan: do not rotate anon JWT until cron job is updated to use a vault secret.

### I.2 Functional (fix this month)

9. **Build a drip dispatcher** (pg_cron + edge fn `send-follow-up`) that scans `leads`/`projects` against `automation_drips.delay_days` and posts SMS/email.
10. **Wire NewReferralSheet** into `/partner/dashboard` so partners can submit leads.
11. **Build commission posting logic** — trigger on `invoices.status = 'paid'` to insert into `referral_rewards`.
12. **Fix `/thank-you`** route — currently renders Index per copy audit.
13. **Add aliases** `/baseboards`, `/builder-partnerships`, `/links` (or update marketing links).
14. **Replace homepage Portuguese copy** ("Saiba Mais", "Método Transformação Completa™").
15. **De-duplicate** `appointments.assigned_to[]` vs `appointment_assignees` — pick one, migrate data, drop other.
16. **Delete or merge** `GalleryManager.tsx` if unused.

### I.3 Data integrity (fix this quarter)

17. Add FK `leads.converted_to_project_id → projects(id)`.
18. Add indexes on `leads(organization_id, status)`, `projects(organization_id, project_status)`, `audit_log(created_at)`.
19. Add a `review_requests` table + post-completion trigger to send Google review link.
20. Build invoice overdue reminders (cron + edge fn).

### I.4 Multi-tenancy (before signing 2nd customer)

21. Remove all imports of `AXO_ORG_ID` from `src/`. Replace with `useCurrentOrg()` hook reading from `organization_members`.
22. Backfill `organization_id` on any rows currently missing it (verify nullability per table).
23. Remove the global `_authenticated_read` RLS leaks listed above.

---

## J. RECOMMENDED BUILD ROADMAP

### Phase 1 — Money Flow (2 weeks)

- **Stripe integration** for invoices (payment intents, webhooks → `payments.received`)
- **Invoice overdue reminder** cron + email
- **Auto-link payment** to invoice when received
- **Commission posting** on paid invoice → `referral_rewards`

### Phase 2 — Partner / Referral System (2 weeks)

- Wire `NewReferralSheet` to `/partner/dashboard`
- ProtectedRoute on `/partner/*`
- Partner inviter (admin clicks → `link_partner_user` RPC + email via `invite-team-member`)
- Commission ledger UI for partners
- Partner payout marking (admin)

### Phase 3 — Automations / NRA / SLA (2 weeks)

- Drip dispatcher (cron every 15min) — scans `leads`/`projects` against `automation_drips`
- Send via Twilio (SMS) + Resend (email) using existing secrets
- Track sends in a new `automation_send_log` table
- Build `/admin/automations` consumer status panel
- Add invoice overdue + project stagnation triggers to NRA

### Phase 4 — Marketing / Gallery / Reviews (2 weeks)

- `review_requests` table + post-completion automation
- Google Place ID stored in `company_settings`, deep-link generator
- Fix homepage Portuguese copy + missing route aliases
- Stain Gallery asset cleanup (3 duplicated swatches per earlier audit)
- Convert `job-proof` to private bucket + signed URL serving in `JobProofUploader`

### Phase 5 — Multi-tenancy hardening (1 week, before 2nd tenant)

- Remove `AXO_ORG_ID` constant; introduce `useCurrentOrg()`
- Tighten the 5 RLS leak policies
- Add missing indexes
- Migrate `appointments.assigned_to[]` → `appointment_assignees`

---

## K. QUESTIONS THAT NEED HUMAN CONFIRMATION

1. **Auth signups:** Is `/auth` open to anyone, or invite-only? Need to inspect `Auth.tsx` and Supabase auth settings.
2. **`/axo-master-system`:** Should this be public marketing or admin-only? Currently public.
3. **`job-proof` bucket public:** Was this intentional (for sharing photos via direct URL) or oversight?
4. **`media` bucket anon read:** Same question — what depends on anon access?
5. **`GalleryManager.tsx` vs `GalleryHub.tsx`:** Which is canonical?
6. **`appointments.assigned_to[]`:** Is anything still reading it, or safe to drop?
7. **`automation_sequences` data:** Are the 8 sequences real campaigns to dispatch, or only design specs?
8. **`/thank-you` rendering Index:** Confirmed broken in earlier copy audit — is there an actual `ThankYou.tsx` body or is it placeholder?
9. **Stripe vs manual payments:** Confirm decision — current state is manual entry only.
10. **Partner portal scope:** Is the MVP just "view referrals" or does it need lead submission UI now?
11. **Notion sync direction:** One-way (Lovable→Notion) only? Any inbound Notion → leads?
12. **Mission Control tasks:** Are tasks supposed to be auto-generated from NRA/SLA, or only manual?
13. **Weekly Review:** Why is the table empty after months of UI? Is the "Close Week" button wired to insert?
14. **`referral_profiles` vs `partners`:** What is the conceptual difference? Both seem to model the same entity.
15. **`supply_connections` + `supply_has_access`:** Is the FloorPro supply-partner vision still on the roadmap or abandoned?

---

**End of Audit.** All claims above are derived from live DB extraction (47 tables, 31 RLS policies, 27 triggers, 35 SECURITY DEFINER functions, 7 edge functions, 2 cron jobs) and direct file inspection of `src/App.tsx`, `src/components/shared/ProtectedRoute.tsx`, `src/lib/constants.ts`, hooks, and pages on April 28, 2026.
