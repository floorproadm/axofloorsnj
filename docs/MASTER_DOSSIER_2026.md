# MASTER DOSSIER 2026 — AXO Floors / FloorPro OS

> **Documento gerado em:** 2026-04-28  
> **Fonte:** Auditoria direta do codebase (`src/`, `supabase/`) + introspecção do banco Supabase (`information_schema`, `pg_policies`, `pg_proc`, `pg_trigger`, `cron.job`, `storage.buckets`, `storage.objects`).  
> **Audiência:** Agentes externos de IA (Antigravity, Claude Code, Cursor) e novos engenheiros que precisem operar no projeto sem fazer perguntas básicas.  
> **Convenções:**  
> - 💰 **CRÍTICO** = bloqueador de receita ou margem  
> - ⚠️ **VERIFICAR** = informação parcial / não confirmável só pelo código  
> - 🗑️ **LEGADO** = código presente mas marcado como obsoleto / sem uso ativo confirmado  

---

## SEÇÃO 1 — IDENTIDADE DO SISTEMA

### 1.1 Produto

| Campo | Valor |
|---|---|
| Nome interno (codebase) | **AXO Floors** (em transição para FloorPro OS) |
| Nome comercial atual | **AXO Floors** (`company_settings.trade_name = 'AXO Floors'`) |
| Domínio publicado (custom) | `https://axofloorsnj.com` |
| Domínio Lovable (publish) | `https://axofloorsnj.lovable.app` |
| Preview Lovable | `https://id-preview--75ef3430-fc70-4e14-8a90-5292bf5cce1c.lovable.app` |
| Lovable Project ID | `75ef3430-fc70-4e14-8a90-5292bf5cce1c` |
| Supabase Project Ref | `dcfmrqrbsfxvqhihpamd` |
| Supabase URL | `https://dcfmrqrbsfxvqhihpamd.supabase.co` |
| Tenant ID padrão (singleton AXO) | `a0000000-0000-0000-0000-000000000001` (`src/lib/constants.ts → AXO_ORG_ID`) |

### 1.2 Stack (versões reais do `package.json`)

- **Build:** Vite 5 + React 18 + TypeScript 5  
- **Styling:** Tailwind CSS v3 + shadcn/ui (Radix UI primitives)  
- **State / Data:** `@tanstack/react-query` v5 (default `new QueryClient()` sem retry config customizado)  
- **Routing:** `react-router-dom` v6 (`BrowserRouter`)  
- **Auth / DB / Storage:** Supabase (`@supabase/supabase-js` v2)  
- **Forms:** `react-hook-form` + `zod`  
- **Animation:** `framer-motion`  
- **Drag & Drop:** `@dnd-kit/*`  
- **Calendar:** `react-day-picker`  
- **Charts:** `recharts`  
- **Backend runtime:** Deno (Supabase Edge Functions)  
- **3rd-party APIs ativas:** Resend (email), Twilio (SMS), Notion API, Facebook Conversions API (Pixel ID `403151700983838`), Google Places API (frontend)  

### 1.3 Filosofia de Design (Operational Dominance + Linear/Vercel)

O sistema migrou de uma postura de **enforcement rígido** para **assistência visual** (`mem://strategy/operational-dominance-philosophy`):

- **O que ainda É enforcement (banco/triggers, irremovível pelo frontend):**
  - 💰 `validate_proposal_margin` bloqueia envio de proposta abaixo da margem mínima da `company_settings`
  - 💰 `axo_validate_lead_transition` força transições válidas no pipeline de leads (10 estágios)
  - `enforce_proposal_acceptance` exige `selected_tier` quando `status='accepted'`
  - `enforce_partner_lead_defaults` bloqueia parceiros de criarem leads em outra org
  - `validate_lead_insert` força `cold_lead`/`medium`/sem `customer_id` quando inserido por não-admin
- **O que virou assistência (visual, sem bloquear):**
  - Conclusão de projeto: `enforce_job_proof_on_completion` ainda existe no banco (exige foto AFTER) **MAS** `mem://features/jobs/proof-badge-not-gate` indica que a UI agora exibe um badge "Missing Proof" em vez de bloquear ⚠️ VERIFICAR — banco e UI em desacordo
  - Pipeline de jobs (`projects.project_status`): transições livres na UI
- **UI/UX:** Linear/Vercel dark theme, fontes tabulares, alta densidade, mobile-first em 375px (admin tem PWA em `/admin`).

### 1.4 Status atual das features

| Status | Features |
|---|---|
| **Em produção** | Leads pipeline (10 estágios), Projects Hub, Job Detail, Proposals (Tiers + Direct), Invoices (com share_token), Public Portal por token, Partner Portal MVP, Collaborator Portal mobile-first, Mission Control (página dedicada), Dashboard com agregação RPC, Service Catalog, Measurements, Job Proof, Material Costs/Requests, Labor Entries/Payroll, Payments hub, Weekly Review, SLA Engine V1 (cron horário), Nightly Proof Reminder (cron diário), Notion sync, Facebook CAPI, Resend follow-ups, Internal Chat por projeto, Notifications engine, Stain Gallery, Floor Diagnostic, Project Wizard, Referral Program (gamificado) |
| **Em desenvolvimento / parcial** | White-label multi-tenant (memória `mem://strategy/floorpro-os-vision` indica transição para FloorPro), Supply partner connections (tabela `supply_connections` existe mas sem UI completa) |
| **Depreciado / Legado** | Rota `/admin/jobs` redireciona para `/admin/projects` (🗑️ LEGADO — `App.tsx:169`) |

---

## SEÇÃO 2 — MAPA DE ROTAS COMPLETO

Extraído integralmente de `src/App.tsx` (linhas 97–280).

### 2.1 Rotas Públicas (sem auth)

| Path | Componente | Categoria | Status | Observação |
|---|---|---|---|---|
| `/` | `Index` | público | ativa | Home page marketing |
| `/hardwood-flooring` | `HardwoodFlooring` | público | ativa | SEO landing |
| `/sanding-and-refinish` | `SandingRefinish` | público | ativa | SEO landing |
| `/vinyl-plank-flooring` | `VinylPlankFlooring` | público | ativa | SEO landing |
| `/staircase` | `Staircase` | público | ativa | SEO landing |
| `/base-boards` | `BaseBoards` | público | ativa | SEO landing |
| `/gallery` | `Gallery` | público | ativa | Galeria pública |
| `/stain-gallery` | `StainGallery` | público | ativa | DuraSeal 40 cores |
| `/contact` | `Contact` | público | ativa | Formulário → leads |
| `/about` | `About` | público | ativa | |
| `/campaign` | `Campaign` | público | ativa | Landing campanha paga |
| `/quiz` | `Quiz` | público | ativa | Funil interativo |
| `/thank-you` | `ThankYou` | público | ativa | Pós-conversão |
| `/referral-program` | `ReferralProgram` | público | ativa | Bronze→Diamond gamificado |
| `/builders` | `Builders` | público | ativa | |
| `/realtors` | `Realtors` | público | ativa | |
| `/builder-offer` | `BuilderPartnerships` | público | ativa | |
| `/partner-program` | `PartnerProgram` | público | ativa | |
| `/floor-diagnostic` | `FloorDiagnostic` | público | ativa | 💰 Funil de conversão principal (substitui "free estimate") |
| `/axo-master-system` | `AxoMasterSystem` | público | ativa | Mindmap interativo (PT/EN) |
| `/wow-pack` | `WowPack` | público | ativa | |
| `/project-wizard` | `ProjectWizard` | público | ativa | 4-step paralelo ao Floor Diagnostic |
| `/review-request` | `ReviewRequest` | público | ativa | Direciona para Google/Facebook reviews |
| `/hub` | `Links` | público | ativa | Linktree style com mascote Woody |
| `/auth` | `Auth` | público | ativa | Login genérico (não-admin) |
| `*` | `NotFound` | público | ativa | 404 |

### 2.2 Rotas Públicas por Token (token-public)

| Path | Componente | Categoria | Status | Token vem de |
|---|---|---|---|---|
| `/shared/:token` | `SharedPost` | token-público | ativa | `feed_posts.share_token` (uuid) |
| `/invoice/:token` | `PublicInvoice` | token-público | ativa | 💰 `invoices.share_token` (text) |
| `/proposal/:token` | `PublicProposal` | token-público | ativa | 💰 `proposals.share_token` (text) |
| `/portal/:token` | `PublicPortal` | token-público | ativa | `customers.portal_token` (text, default = `encode(gen_random_bytes(24),'hex')`) |

### 2.3 Rotas Admin (requireAdmin=true)

Todas envolvidas em `<ProtectedRoute>` (default `requireAdmin=true`).

| Path | Componente | Status |
|---|---|---|
| `/admin/auth` | `AdminAuth` | ativa (página de login admin, **fora** do ProtectedRoute) |
| `/admin` | `AdminDashboard` | ativa |
| `/admin/dashboard` | `AdminDashboard` | ativa (alias) |
| `/admin/gallery` | `GalleryHub` | ativa |
| `/admin/feed/:postId` | `FeedPostDetail` | ativa |
| `/admin/feed/:postId/edit` | `FeedPostEdit` | ativa |
| `/admin/leads` | `AdminLeadsManager` (`LeadsManager.tsx`) | ativa |
| `/admin/leads/:leadId` | `LeadDetail` | ativa |
| `/admin/jobs/:jobId` | `JobDetail` | ativa |
| `/admin/jobs` | `<Navigate to="/admin/projects" replace />` | 🗑️ **LEGADO REDIRECT** |
| `/admin/intake` | `AdminIntake` | ativa |
| `/admin/mission-control` | `AdminMissionControl` | ativa (criada recentemente, fora do dashboard) |
| `/admin/settings` | `AdminSettings` | ativa |
| `/admin/projects/:projectId` | `ProjectDetail` | ativa |
| `/admin/jobs/:projectId/documents` | `ProjectDocuments` | ativa ⚠️ VERIFICAR (path usa `/admin/jobs/...` mas hub é `/admin/projects` — inconsistência) |
| `/admin/measurements` | `MeasurementsManager` | ativa |
| `/admin/schedule` | `AdminSchedule` | ativa |
| `/admin/performance` | `AdminPerformance` | ativa (só projetos `completed`) |
| `/admin/catalog` | `AdminCatalog` | ativa |
| `/admin/help` | `AdminHelp` | ativa |
| `/admin/partners` | `AdminPartners` | ativa |
| `/admin/payments` | `AdminPayments` | ativa |
| `/admin/automations` | `AdminAutomations` | ativa |
| `/admin/weekly-review` | `WeeklyReview` | ativa |
| `/admin/labor-payroll` | `LaborPayroll` | ativa |
| `/admin/crews` | `CrewsVans` | ativa |
| `/admin/proposals` | `AdminProposals` | ativa |
| `/admin/projects` | `ProjectsHub` | ativa (Projects Hub Cockpit) |

### 2.4 Rotas Collaborator (requireAdmin=false)

Layout pai `CollaboratorLayout` em `/collaborator` com `<Outlet>`.

| Path | Componente | Status |
|---|---|---|
| `/collaborator` (index) | `CollaboratorDashboard` | ativa |
| `/collaborator/schedule` | `CollaboratorSchedule` | ativa |
| `/collaborator/docs` | `CollaboratorDocs` | ativa |
| `/collaborator/chat` | `CollaboratorChat` | ativa (Realtime) |
| `/collaborator/profile` | `CollaboratorProfile` | ativa |
| `/collaborator/project/:projectId` | `CollaboratorProjectDetail` | ativa |

### 2.5 Rotas Partner (sem ProtectedRoute — auth interno na página)

| Path | Componente | Status | Observação |
|---|---|---|---|
| `/partner/auth` | `PartnerAuth` | ativa | Login específico do parceiro |
| `/partner/dashboard` | `PartnerDashboard` | ativa | ⚠️ **NÃO usa `<ProtectedRoute>`** — auth feita inline. Verificar bypass |
| `/partner` | `<Navigate to="/partner/dashboard" replace />` | redirect | |

---

## SEÇÃO 3 — SCHEMA DO BANCO DE DADOS

> Schema `public`. Todas as tabelas com RLS habilitado, exceto onde anotado.  
> **Nenhuma foreign key explícita declarada no banco** — relacionamentos são por convenção via UUID. Isso é uma decisão arquitetural intencional (auditoria `mem://docs/system-audit-baseline` afirma que existem FKs, mas a introspecção atual de `information_schema` retorna vazio para todas as tabelas listadas — ⚠️ VERIFICAR se foram dropadas em migration recente).

### 3.1 Tipos enumerados (ENUMs)

```sql
public.app_role          = ('admin','moderator','user')
public.labor_pricing_model = ('sqft','daily')
public.org_member_role   = ('owner','admin','collaborator')
public.org_plan          = ('starter','pro','enterprise')
public.org_type          = ('flooring_owner','supply_partner')
public.supply_conn_status = ('pending','active','paused')
```

### 3.2 Tabelas de sistema / RBAC

#### `organizations`
| Campo | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | PK |
| name | text | NO | — | |
| slug | text | NO | — | |
| type | org_type | NO | 'flooring_owner' | |
| plan | org_plan | YES | 'starter' | |
| logo_url | text | YES | — | |
| primary_color | text | YES | '#1a1a2e' | |
| phone, email, address, city | text | YES | — | |
| state | text | YES | 'NJ' | |
| zip_code | text | YES | — | |
| website_enabled | bool | YES | false | |
| trial_ends_at | timestamptz | YES | — | |
| is_active | bool | YES | true | |
| created_at, updated_at | timestamptz | YES | now() | |

**RLS:** ✅ ativa  
- `orgs_read_own` (SELECT, authenticated): `id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())`  
- `orgs_update_owner` (UPDATE, authenticated): só role `owner`  
- ❌ INSERT/DELETE bloqueados pra todos

#### `organization_members`
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | — |
| organization_id | uuid | NO | — |
| role | org_member_role | NO | 'collaborator' |
| created_at | timestamptz | YES | now() |

**RLS:** ✅  
- `org_members_read_own_or_org` (SELECT): `user_id = auth.uid() OR organization_id = get_user_org_id()`  
- `org_members_manage` (INSERT), `org_members_manage_update` (UPDATE), `org_members_manage_delete` (DELETE): só `owner`/`admin` da org

#### `user_roles` (RBAC global, separada da org)
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | — |
| role | app_role | NO | — |
| created_at | timestamptz | YES | now() |

**RLS:** ✅  
- `Users can view own roles` (SELECT public): `auth.uid() = user_id`  
- `Admins can manage all roles` (ALL public): `has_role(auth.uid(),'admin')`  

> **CRÍTICO de segurança:** roles ficam aqui (não em `profiles`) para evitar privilege escalation. `has_role()` é SECURITY DEFINER — evita recursão de RLS.

#### `profiles`
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | YES | — |
| full_name, email, avatar_url, phone, bio, role | text | YES | — |
| birthdate | date | YES | — |
| created_at, updated_at | timestamptz | NO | now() |

**RLS:** Users veem/editam só o próprio. Admins veem tudo. Sem DELETE.  
**Trigger `handle_new_user`:** AFTER INSERT em `auth.users` → cria `profiles` automaticamente com `full_name` do raw_user_meta_data.

#### `audit_log`
Best-effort logging (não dispara rollback se falhar).

| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | YES | — |
| user_role | text | YES | — |
| operation_type | text | NO | — (ex: `LEAD_CONVERTED`, `PROPOSAL_BLOCKED`, `COLLABORATOR_UPLOAD`, `SLA_ESCALATION_FOLLOWUP`, `COMPLETION_BLOCKED`) |
| table_accessed | text | NO | — |
| data_classification | text | YES | — (geralmente JSON serializado) |
| organization_id | uuid | YES | — |
| access_timestamp, created_at | timestamptz | YES | now() |

**RLS:** SELECT free para qualquer authenticated; INSERT free para qualquer um. Sem UPDATE/DELETE.

### 3.3 Tabelas operacionais — núcleo de negócio

#### `leads` 💰
| Campo | Tipo | Null | Default | Observação |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | |
| organization_id | uuid | NO | — | tenant |
| name | text | NO | — | |
| phone | text | NO | — | max 30 chars |
| email | text | YES | — | max 255 |
| address, city, zip_code, location | text | YES | — | |
| lead_source | text | NO | 'website' | |
| status | text | NO | 'cold_lead' | 💰 ver Seção 5 |
| priority | text | NO | 'medium' | low/medium/high/urgent |
| services | jsonb | YES | '[]' | |
| room_size | text | YES | — | |
| budget | numeric | YES | — | |
| message, notes | text | YES | — | message max 2000 |
| assigned_to | text | YES | — | |
| follow_up_date | timestamptz | YES | — | |
| follow_up_required | bool | YES | false | |
| next_action_date | date | YES | — | |
| follow_up_actions | jsonb | YES | '[]' | array de logs de follow-up |
| last_contacted_at | timestamptz | YES | — | |
| converted_to_project_id | uuid | YES | — | preenchido por `convert_lead_to_project` |
| customer_id | uuid | YES | — | preenchido na conversão |
| status_changed_at | timestamptz | YES | now() | atualizado pelo trigger |
| referred_by_partner_id | uuid | YES | — | |
| created_at, updated_at | timestamptz | NO | now() | |

**RLS:**  
- `leads_tenant_all` (ALL authenticated): `organization_id = get_user_org_id()`  
- `leads_public_insert` (INSERT anon/authenticated): `true` — captura pública via formulários  
- `leads_partner_insert` (INSERT authenticated): obriga `organization_id = get_partner_org_for_user()` AND `referred_by_partner_id = get_partner_id_for_user()`  
- `leads_partner_read_own_referrals` (SELECT authenticated): partner vê só os próprios

**Triggers:** `validate_lead_insert` (BEFORE INSERT), `axo_validate_lead_transition` (BEFORE UPDATE), `set_status_changed_at`, `set_follow_up_on_quoted`, `enforce_partner_lead_defaults`.

#### `customers`
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| organization_id | uuid | NO | — |
| full_name | text | NO | — |
| email, phone, address, city, zip_code, notes | text | YES | — |
| portal_token | text | YES | `encode(gen_random_bytes(24),'hex')` 💰 |
| created_at, updated_at | timestamptz | NO | now() |

**RLS:** tenant ALL + `customers_authenticated_read` (qualquer autenticado lê) + `customers_public_read_by_token` (anon lê quando portal_token NOT NULL) + `customers_public_read_via_proposal_token`.

#### `projects` 💰
| Campo | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | |
| organization_id | uuid | NO | — | |
| customer_id | uuid | YES | — | nullable! |
| customer_name, customer_email, customer_phone | text | NO | — | |
| address, city, zip_code | text | YES | — | |
| project_type | text | NO | — | |
| project_status | text | NO | 'pending' | pending/in_progress/in_production/completed (livre via UI) |
| square_footage, estimated_cost, actual_cost | numeric | YES | — | |
| start_date, completion_date | date | YES | — | |
| team_lead | text | YES | — | |
| team_members | text[] | YES | '{}' | |
| work_schedule | text | YES | '8:00 AM - 5:00 PM' | |
| requires_progress_photos | bool | NO | true | |
| referred_by_partner_id | uuid | YES | — | |
| next_action, next_action_date | text/date | YES | — | calculado por `compute_project_next_action` |
| notes | text | YES | — | |
| created_at, updated_at | timestamptz | NO | now() | |

**RLS:**  
- `projects_tenant_all` (ALL authenticated): tenant  
- `projects_collaborator_read` (SELECT authenticated): membro de `project_members`  
- `projects_public_list_by_customer` (SELECT anon): customer com `portal_token`  
- `projects_public_read_via_proposal_token` (SELECT anon): existe proposta com `share_token`  
- `projects_supply_read` (SELECT authenticated): `supply_has_access(organization_id)`

**Triggers:** `enforce_job_proof_on_completion` (BEFORE UPDATE quando vai pra `completed`), `trg_recompute_next_action` (AFTER INSERT/UPDATE).

#### `project_members`
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| project_id | uuid | NO | — |
| user_id | uuid | NO | — |
| role | text | NO | 'collaborator' |
| created_at | timestamptz | YES | now() |

**RLS:** admin manage all + `project_members_own_read` (`auth.uid() = user_id`).

#### `job_costs` 💰
**Generated columns:**
```sql
total_cost      = labor_cost + material_cost + additional_costs
margin_percent  = CASE WHEN estimated_revenue > 0
                    THEN round(((estimated_revenue - total_cost)/estimated_revenue)*100, 2)
                    ELSE 0 END
profit_amount   = estimated_revenue - total_cost
```
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| project_id | uuid | NO | — |
| labor_cost, material_cost, additional_costs | numeric | NO | 0 |
| estimated_revenue | numeric | NO | 0 |
| total_cost, margin_percent, profit_amount | numeric | YES | (GENERATED) |
| created_at, updated_at | timestamptz | NO | now() |

**RLS:** tenant via projects (sem WITH CHECK — ver Seção 15).

**Triggers:** `recalc_job_cost_aggregates` (AFTER INSERT/UPDATE/DELETE em `job_cost_items` recalcula material/labor/additional), `sync_material_costs_to_job_costs`, `sync_labor_entries_to_job_costs`.

#### `job_cost_items`
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| job_cost_id | uuid | NO | — |
| category | text | NO | 'other' (materials/labor/overhead/other) |
| description | text | NO | '' |
| amount | numeric | NO | 0 |
| created_at | timestamptz | NO | now() |

**RLS:** admin all + authenticated read.

#### `material_costs`
Despesas individuais de material por projeto.
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| organization_id | uuid | NO | — |
| project_id | uuid | NO | — |
| description | text | NO | '' |
| supplier | text | YES | — |
| amount | numeric | NO | 0 |
| purchase_date | date | YES | CURRENT_DATE |
| receipt_url, notes | text | YES | — |
| is_paid | bool | YES | false |
| created_at, updated_at | timestamptz | YES | now() |

**RLS:** tenant ALL.  
**Trigger:** `sync_material_costs_to_job_costs` (recalcula `job_costs.material_cost` por projeto).

#### `labor_entries`
**Generated:** `total_cost = daily_rate * days_worked`
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| organization_id | uuid | NO | — |
| project_id | uuid | NO | — |
| worker_name | text | NO | — |
| role | text | YES | 'helper' |
| daily_rate | numeric | NO | 0 |
| days_worked | numeric | NO | 1 |
| work_date | date | YES | CURRENT_DATE |
| is_paid | bool | YES | false |
| total_cost | numeric | YES | (GENERATED) |
| notes | text | YES | — |
| created_at | timestamptz | YES | now() |

**RLS:** tenant ALL.  
**Trigger:** `sync_labor_entries_to_job_costs`.

#### `material_requests`
Pedidos do campo (collaborator).
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| organization_id | uuid | NO | — |
| project_id | uuid | YES | — |
| requested_by | uuid | NO | — |
| item_name | text | NO | — |
| quantity | numeric | NO | 1 |
| unit | text | NO | 'unit' |
| status | text | NO | 'pending' |
| reviewed_by | uuid | YES | — |
| reviewed_at | timestamptz | YES | — |
| notes | text | YES | — |
| created_at, updated_at | timestamptz | NO | now() |

**RLS:** tenant ALL.

#### `payments`
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| organization_id | uuid | NO | — |
| project_id | uuid | YES | — |
| collaborator_id | uuid | YES | — |
| category | text | NO | 'received' (received/payroll/expense) |
| amount | numeric | NO | 0 |
| payment_date | date | NO | CURRENT_DATE |
| payment_method, status, description, notes | text | YES | — |
| created_at, updated_at | timestamptz | NO | now() |

**RLS:** tenant ALL.

#### `invoices` 💰
**Generated:** `total_amount = amount + tax_amount - discount_amount`
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| organization_id | uuid | NO | — |
| project_id | uuid | NO | — |
| customer_id | uuid | YES | — |
| invoice_number | text | NO | — |
| amount, tax_amount, discount_amount, deposit_amount | numeric | NO | 0 |
| total_amount | numeric | YES | (GENERATED) |
| status | text | NO | 'draft' |
| due_date | date | NO | — |
| paid_at | timestamptz | YES | — |
| payment_method | text | YES | — |
| share_token | text | YES | — | 💰 portal público |
| viewed_at | timestamptz | YES | — | atualizado pelo cliente quando abre o link |
| notes | text | YES | — |
| created_at, updated_at | timestamptz | NO | now() |

**RLS:**  
- `invoices_tenant_all`  
- `invoices_public_list_by_customer` (anon via `customers.portal_token`)  
- `invoices_public_read_by_token` (anon via `share_token`)  
- `invoices_public_mark_viewed` (UPDATE anon quando `share_token` not null) — permite tracking de visualização  

#### `invoice_items`
**Generated:** `amount = quantity * unit_price`  
RLS: tenant via invoices + `invoice_items_public_read_by_token` (anon).

#### `invoice_payment_schedule`
30/40/30 padrão (`mem://features/invoicing-governance-standard`).  
Campos: `phase_label`, `phase_order`, `timing`, `percentage`. RLS tenant + leitura por share_token.

#### `proposals` 💰
| Campo | Tipo | Null | Default | Observação |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | |
| project_id | uuid | NO | — | NOT NULL — toda proposta exige projeto |
| customer_id | uuid | NO | — | NOT NULL — toda proposta exige cliente |
| organization_id | uuid | NO | — | |
| proposal_number | text | YES | — | gerado no app: `PROP-${Date.now().toString(36)}` |
| use_tiers | bool | NO | true | toggle Tiers vs Direct |
| good_price, better_price, best_price | numeric | NO | 0 | NOT NULL — em Direct mode são preenchidos com `flat_price` |
| margin_good, margin_better, margin_best | numeric | NO | 0 | |
| flat_price | numeric | YES | — | só usado quando `use_tiers=false` |
| status | text | NO | 'draft' | draft/sent/viewed/accepted/declined |
| selected_tier | text | YES | — | obrigatório quando status='accepted' |
| accepted_at | timestamptz | YES | — | preenchido automaticamente |
| valid_until | date | YES | — | default no app: now()+30 dias |
| share_token | text | YES | — | 💰 |
| viewed_at | timestamptz | YES | — | |
| created_at, updated_at | timestamptz | NO | now() | |

**RLS:**  
- `proposals_tenant_all`  
- `proposals_public_list_by_customer` (anon via portal_token)  
- `proposals_public_read_by_token` (anon via share_token)  
- `proposals_public_mark_viewed` (UPDATE anon)  

**Triggers:** `enforce_proposal_acceptance` (BEFORE UPDATE — exige `selected_tier` se accepted, preenche `accepted_at`).

#### `proposal_signatures`
Assinaturas via canvas no portal público.
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| proposal_id | uuid | NO | — |
| organization_id | uuid | NO | — |
| signer_name | text | NO | — |
| signer_email | text | YES | — |
| signature_url | text | NO | — | path no bucket `proposal-signatures` |
| selected_tier | text | YES | — |
| payment_method | text | NO | 'check' |
| client_note | text | YES | — |
| ip_address, user_agent | (resto) | — | ⚠️ VERIFICAR campos restantes |
| created_at | timestamptz | NO | now() |

**RLS:** `proposal_signatures_public_insert` (INSERT anon/authenticated, com check via share_token) + tenant read.

#### `proposal_change_requests`
Cliente pede alteração na proposta via portal.
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| proposal_id, customer_id, organization_id | uuid | NO | — |
| message | text | NO | — |
| status | text | NO | 'open' |
| resolved_at | timestamptz | YES | — |
| resolved_by | uuid | YES | — |
| created_at | timestamptz | NO | now() |

**RLS:** anon submit via portal_token, tenant manage. **Trigger:** `notify_proposal_change_request` cria `notifications` para owner/admin.

#### `job_proof`
Fotos before/after.
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| project_id | uuid | NO | — |
| before_image_url, after_image_url | text | YES | — |
| created_at, updated_at | timestamptz | NO | now() |

**RLS:** admin all + authenticated read. (Note: 1 row por projeto — ⚠️ não suporta múltiplas fotos. Galerias adicionais ficam em `media_files`.)

### 3.4 Tabelas de pipeline / vendas

#### `appointments`
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| organization_id | uuid | NO | — |
| customer_id, project_id | uuid | YES | — |
| customer_name, customer_phone | text | NO | — |
| appointment_date | date | NO | — |
| appointment_time | time | NO | — |
| duration_hours | numeric | YES | 1 |
| appointment_type | text | NO | — |
| status | text | NO | 'scheduled' |
| location, notes | text | YES | — |
| reminder_sent | bool | YES | false |
| assigned_to | uuid[] | YES | '{}' (legado, ver `appointment_assignees`) |
| created_at, updated_at | timestamptz | NO | now() |

**RLS:** tenant ALL.

#### `appointment_assignees`
Tabela de junção (substituindo `appointments.assigned_to`).
RLS isolamento via `appointments.organization_id`.

#### `partners`
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| organization_id | uuid | NO | — |
| company_name, contact_name | text | NO | — |
| email, phone, photo_url, lead_source_tag, notes, next_action_note | text | YES | — |
| partner_type | text | NO | 'builder' |
| service_zone | text | NO | 'core' |
| status | text | NO | 'active' |
| total_referrals, total_converted | int | NO | 0 |
| birthday, next_action_date | date | YES | — |
| last_contacted_at | timestamptz | YES | — |
| created_at, updated_at | timestamptz | NO | now() |

**RLS:** tenant + `partners_self_read`/`partners_self_update` (parceiro vê/edita o próprio via `get_partner_id_for_user()`).

#### `partner_users`
Vincula `auth.users` → `partners`.  
RLS: admin manage da org + self_read.  
Função `link_partner_user(p_partner_id, p_user_id)` é usada pelo admin para vincular.

#### `tasks`
Mission Control / tarefas manuais.
RLS: tenant ALL. ⚠️ VERIFICAR — colunas exatas não recuperadas integralmente; `mem://features/mission-control-task-system` indica suporte a prefixo `🤝` para partners.

#### `automation_sequences`
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| organization_id | uuid | NO | — |
| name | text | NO | — |
| pipeline_type | text | NO | 'sales' |
| stage_key | text | NO | — |
| is_active | bool | NO | true |
| display_order | int | NO | 0 |
| created_at, updated_at | timestamptz | NO | now() |

#### `automation_drips`
Mensagens dentro de uma sequence.
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| organization_id | uuid | NO | — |
| sequence_id | uuid | NO | — |
| channel | text | NO | 'sms' (sms/email/whatsapp) |
| subject | text | YES | — |
| message_template | text | NO | '' |
| delay_days | int | NO | 0 |
| delay_hours | int | NO | 0 |
| display_order | int | NO | 0 |
| is_active | bool | NO | true |
| created_at, updated_at | timestamptz | NO | now() |

⚠️ Atualmente **não há cron** consumindo essas sequências — config persiste mas execução depende de implementação futura ou trigger manual.

### 3.5 Tabelas de medições / catálogo

#### `project_measurements`
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| project_id | uuid | NO | — |
| status | text | NO | 'scheduled' |
| measurement_date | timestamptz | YES | — |
| measured_by, service_type, material, finish_type, notes | text | YES | — |
| total_sqft, total_linear_ft | numeric | NO | 0 (recalc por trigger) |
| created_at, updated_at | timestamptz | NO | now() |

#### `measurement_areas`
Por projeto, multi-room. `area_type` ∈ floor/baseboard/handrail/stairs.  
**Trigger:** `recalc_measurement_totals` recomputa `project_measurements.total_*`.

#### `service_catalog`
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| item_type | text | — | 'service' \| 'material' |
| name, description, category | text | — | — |
| default_material, default_finish | text | YES | — |
| base_price | numeric | NO | 0 |
| price_unit | text | — | 'sqft'/'unit'/'step'/'linear_ft' |
| is_active | bool | NO | true |
| display_order | int | NO | 0 |
| image_url | text | YES | — | path em `media/catalog/...` |
| created_at, updated_at | timestamptz | NO | now() |

**RLS:** admin all, authenticated read.

#### `project_documents`
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| project_id | uuid | NO | — |
| folder | text | NO | 'other' |
| category | text | YES | 'misc' |
| file_name, file_url, file_type | text | NO | — |
| uploaded_by | uuid | YES | — |
| source | text | NO | 'admin_upload' |
| version | int | YES | 1 |
| created_at, updated_at | timestamptz | NO | now() |

**RLS:** admin CRUD + authenticated read.

### 3.6 Tabelas de comunicação / mídia

#### `chat_messages`
RLS: admin all + collaborator pode inserir/ler se `project_members.user_id = auth.uid()`.  
**Trigger:** `notify_on_chat_message` (AFTER INSERT) — cria `notifications` pra todos os membros do projeto exceto o sender, e admins se sender ≠ admin.

#### `media_files`
Hub central de mídia (substitui uploads dispersos).
- `source_type`: admin_upload / collaborator
- `folder_type`: job_progress / before_after / etc.
- `visibility`: internal / client / public
- `quality_checked`: bool (revisão admin)

RLS multi-camada: admin all, authenticated lê internal/client/public, collaborator insert/read se membro do projeto, anon lê só `visibility='public'`.

#### `feed_posts`, `feed_post_images`, `feed_comments`, `feed_folders`
Sistema de Company Feed. RLS:
- Admin all (interno)
- `feed_posts_public_read` (anon): `visibility='public' AND status='published'`
- `feed_posts_shared_read` (anon): `share_token IS NOT NULL`
- `feed_post_images_public_read` (anon): join com posts públicos
- `feed_folders_public_read`: `true` (qualquer um lê)

#### `gallery_folders`, `gallery_projects`
Catálogo público de portfolio. RLS: leitura pública (anon+authenticated), CRUD por tenant.

#### `notifications`
| Campo | Tipo | Null | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | — |
| organization_id | uuid | NO | — |
| type | text | NO | 'info' (info/chat/proof_missing/proposal_change_request/etc.) |
| title | text | NO | — |
| body, link | text | YES | — |
| read | bool | NO | false |
| created_at | timestamptz | NO | now() |

**RLS:** owner read/update + admin all + tenant all.

#### `lead_notes`
Notas + 1 anexo por nota (`attachment_url`/`attachment_name`). RLS tenant.

#### `project_comments`
Diário cronológico de projeto, opcional `image_url`. RLS: admin all + tenant.

### 3.7 Tabelas de governança / referral

#### `weekly_reviews` + `weekly_review_projects`
Snapshots semanais persistentes (Total Revenue/Profit/Margin/Jobs Completed). RLS tenant.

#### `referrals`
Indicações públicas (anon insert).  
**RLS:** tenant ALL + public read + public insert.

#### `referral_profiles`
Perfis gamificados (Bronze→Diamond).  
**RLS:** tenant ALL + public read + public insert.

#### `referral_rewards`
Catálogo de recompensas. RLS: admin all + public read.

#### `quiz_responses`
Respostas do `/quiz`. RLS: anyone insert + authenticated read.

### 3.8 Tabelas de sistema / supply / mindmap

#### `supply_connections`
Marketplace de fornecedores (B2B). Status enum `supply_conn_status`.  
RLS: `supply_conn_read_involved` (qualquer org dos dois lados), insert/update só pelo lado supply.

#### `system_node_arrows`, `system_node_notes`, `system_node_overrides`
Persistência customizada do AXO Master System (mindmap interativo). RLS tenant.

### 3.9 Views (não-tabelas)

- `view_pipeline_metrics` — agregações por status
- `view_financial_metrics` — active_jobs, completed_jobs, pipeline_value, total_profit, total_revenue, avg_margin_30d
- `view_stage_aging` — leads stalled por estágio
- `leads_followup_overdue` — usado pelo SLA Engine
- `leads_estimate_scheduled_stale` — usado pelo SLA Engine
- `projects_missing_progress_photos` — usado pelo Dashboard

### 3.10 Indexes

⚠️ VERIFICAR — não recuperados via consulta (não foram listados na introspecção). Inferência: PKs implícitas em `id`, e indexes triviais por `organization_id` provavelmente existem para suportar performance multi-tenant. Recomendo `SELECT * FROM pg_indexes WHERE schemaname='public'` em sessão futura para listar exatamente.

---

## SEÇÃO 4 — FUNÇÕES E TRIGGERS DO SUPABASE

### 4.1 Funções Helper (SECURITY DEFINER, STABLE)

| Função | Args | Retorno | O que faz |
|---|---|---|---|
| `has_role(_user_id, _role app_role)` | uuid, enum | bool | Checa se user tem role na `user_roles`. Base do RBAC global. |
| `get_user_org_id()` | — | uuid | Retorna `organization_id` do primeiro `organization_members` do `auth.uid()`. Base do isolamento multi-tenant. |
| `get_partner_id_for_user()` | — | uuid | Retorna `partner_id` do primeiro `partner_users` do `auth.uid()`. |
| `get_partner_org_for_user()` | — | uuid | Retorna `organization_id` do `partner_users`. |
| `supply_has_access(p_org_id)` | uuid | bool | True se o user atual é membro de uma org com `supply_connections.status='active'` apontando para `p_org_id`. |

### 4.2 Funções RPC chamadas pelo frontend

| RPC | Args | Retorno | Comportamento |
|---|---|---|---|
| `transition_lead_status` | `p_lead_id, p_new_status` | json (lead) | UPDATE leads + dispara trigger de validação. |
| `validate_lead_transition` | `p_lead_id, p_new_status` | table | ⚠️ Atualmente é stub — retorna `(true, NULL, current, NULL)`. Validação real está no trigger `axo_validate_lead_transition`. |
| `convert_lead_to_project` | `p_lead_id, p_project_type` | uuid (project_id) | 💰 Cria/usa customer, cria project + job_costs zerado, vincula lead. Audit `LEAD_CONVERTED`. Bloqueia se lead já convertido. |
| `validate_proposal_margin` | `p_project_id` | table | 💰 Compara `job_costs.margin_percent` vs `company_settings.default_margin_min_percent`. Loga `PROPOSAL_BLOCKED` em audit_log se < min. |
| `calculate_job_margin` | `p_project_id` | table | Retorna métricas + status text (OK / WARNING / ERROR). |
| `validate_project_completion` | `p_project_id` | table | Verifica AFTER photo (BEFORE é opcional). Loga `COMPLETION_BLOCKED`. |
| `validate_proposal_acceptance` | `p_proposal_id` | jsonb | Garante `selected_tier` quando accepted. |
| `get_dashboard_metrics()` | — | jsonb | 💰 SSOT do Dashboard — agrega pipeline, financial, alerts, missing_photos, sla_breaches, recent uploads, system_actions. |
| `get_lead_nra(p_lead_id)` | uuid | jsonb | Next Required Action determinístico por estágio. |
| `get_leads_nra_batch(p_lead_ids[])` | uuid[] | jsonb[] | Loop de `get_lead_nra` para batch. |
| `link_partner_user(p_partner_id, p_user_id)` | uuid, uuid | uuid | Admin vincula auth.users a partner. Bloqueia se org não bate. |
| `run_sla_engine()` | — | jsonb | 💰 Executa hourly via cron — escalona prioridade de leads em followup_overdue ou estimate_scheduled_stale. Audit `SLA_ESCALATION_*`. Usa `pg_try_advisory_lock(922337203685477000)` para evitar concorrência. |

### 4.3 Triggers

| Trigger | Tabela | Evento | Função | O que faz |
|---|---|---|---|---|
| (validação) | `leads` | BEFORE INSERT | `validate_lead_insert` | Trim limites + força defaults se não-admin. |
| `axo_validate_lead_transition` | `leads` | BEFORE UPDATE | mesma | 💰 Valida transições do pipeline 10-stage. Gates: in_draft exige projeto + margem ok; sair de proposal_sent exige follow-up; → in_production exige proposta accepted. |
| `set_status_changed_at` | `leads` | BEFORE UPDATE | mesma | Atualiza `status_changed_at` quando status muda. |
| `set_follow_up_on_quoted` | `leads` | BEFORE UPDATE | mesma | Quando vira proposal_sent, força `follow_up_required=true` e `next_action_date=+2d`. Quando vira completed/lost/in_production, zera. |
| `enforce_partner_lead_defaults` | `leads` | BEFORE INSERT | mesma | Se inserter é partner, força `referred_by_partner_id`, `organization_id`, `lead_source='partner_referral'`, `status='cold_lead'`. |
| `enforce_job_proof_on_completion` | `projects` | BEFORE UPDATE | mesma | 💰 Bloqueia transição → completed sem foto AFTER. ⚠️ banco e UI em desacordo (memória diz que virou só badge). |
| `trg_recompute_next_action` | `projects` | AFTER INSERT/UPDATE | `compute_project_next_action` | Atualiza `projects.next_action` + `next_action_date`. |
| `enforce_proposal_acceptance` | `proposals` | BEFORE UPDATE | mesma | Quando status=accepted, exige `selected_tier`, preenche `accepted_at`. |
| `recalc_job_cost_aggregates` | `job_cost_items` | AFTER INSERT/UPDATE/DELETE | mesma | Recomputa `job_costs.material_cost/labor_cost/additional_costs` por job_cost_id. |
| `sync_material_costs_to_job_costs` | `material_costs` | AFTER INSERT/UPDATE/DELETE | mesma | SUM material_costs → `job_costs.material_cost`. |
| `sync_labor_entries_to_job_costs` | `labor_entries` | AFTER INSERT/UPDATE/DELETE | mesma | SUM labor_entries → `job_costs.labor_cost`. |
| `recalc_measurement_totals` | `measurement_areas` | AFTER INSERT/UPDATE/DELETE | mesma | Recomputa totais em `project_measurements`. |
| `notify_on_chat_message` | `chat_messages` | AFTER INSERT | mesma | Cria `notifications` para members + admins. |
| `notify_proposal_change_request` | `proposal_change_requests` | AFTER INSERT | mesma | Cria `notifications` para owner/admin da org. |
| `handle_new_user` | `auth.users` | AFTER INSERT | mesma | Cria `profiles` com `full_name` do raw_user_meta_data. |
| `update_updated_at_column` | (várias) | BEFORE UPDATE | mesma | Atualiza `updated_at = now()`. |

> **Nota (introspecção):** A query `information_schema.triggers` retornou vazio na sessão atual ⚠️ VERIFICAR. Os triggers acima foram inferidos do contexto disponível e dos comportamentos observados em código + memórias. Recomendo `SELECT tgname, tgrelid::regclass, tgtype FROM pg_trigger WHERE tgname NOT LIKE 'RI_%' AND tgname NOT LIKE 'pg_%';` para listar definitivamente.

### 4.4 Cron Jobs (`cron.job`)

| Job | Schedule | Comando | Ativo |
|---|---|---|---|
| `sla_engine_hourly` | `0 * * * *` (todo minuto 0) | `SELECT public.run_sla_engine();` | ✅ |
| `nightly-proof-reminder` | `0 22 * * *` (22:00 UTC diário) | `net.http_post(...functions/v1/nightly-proof-reminder)` com auth Bearer anon key | ✅ |

⚠️ **Não há cron** consumindo `automation_sequences/automation_drips` — execução real depende de implementação futura ou trigger por evento de pipeline.

---

## SEÇÃO 5 — PIPELINE DE LEADS

### 5.1 Status (10 estágios) — `src/hooks/useLeadPipeline.ts`

```ts
PIPELINE_STAGES = [
  'cold_lead', 'warm_lead', 'estimate_requested', 'estimate_scheduled',
  'in_draft', 'proposal_sent', 'proposal_rejected',
  'in_production', 'completed', 'lost'
]
```

### 5.2 Transições válidas (frontend `VALID_TRANSITIONS` + backend trigger `axo_validate_lead_transition`)

| De | Para | Gate (backend, no trigger) | Side-effects automáticos |
|---|---|---|---|
| cold_lead | warm_lead | nenhum | — |
| warm_lead | estimate_requested | nenhum | — |
| estimate_requested | estimate_scheduled | nenhum | — |
| estimate_scheduled | in_draft | 💰 exige `converted_to_project_id NOT NULL` E `job_costs.margin_percent >= company_settings.default_margin_min_percent` | — |
| in_draft | proposal_sent | nenhum | `set_follow_up_on_quoted`: força `follow_up_required=true`, `next_action_date=+2d` |
| proposal_sent | in_production | 💰 exige `jsonb_array_length(follow_up_actions) > 0` E proposta vinculada com `status='accepted'` | `set_follow_up_on_quoted`: zera follow_up_required |
| proposal_sent | proposal_rejected | exige ≥1 follow-up | — |
| proposal_rejected | in_draft | nenhum | — |
| in_production | completed | nenhum (no trigger de leads — mas projeto exige AFTER photo) | — |
| in_production | lost | nenhum | — |
| completed | * | **terminal — bloqueado** | — |
| lost | * | **terminal — bloqueado** | — |

### 5.3 Campos auto-modificados em transições

- `status_changed_at` ← now() em qualquer mudança (`set_status_changed_at`)
- `updated_at` ← now() (gerenciado pelo `transition_lead_status` RPC)
- `follow_up_required`, `next_action_date` ← `set_follow_up_on_quoted`
- Bloqueio de UPDATE direto via RLS: não tem — RLS é por org, mas a validação fica no trigger.

### 5.4 Lost reason

⚠️ VERIFICAR — **Não há campo `lost_reason`** nas colunas da tabela `leads`. A justificativa fica em `notes` ou `follow_up_actions` (jsonb). Considerar adicionar campo dedicado.

### 5.5 Onde a validação roda

- **Frontend (`useLeadPipeline.updateLeadStatus`):** chama RPC `transition_lead_status` → toast com erro do trigger.
- **Backend:** trigger `axo_validate_lead_transition` é a fonte da verdade. Frontend `VALID_TRANSITIONS` é só hint de UI — banco é o gate real.

---

## SEÇÃO 6 — AUTENTICAÇÃO E RBAC

### 6.1 ProtectedRoute — `src/components/shared/ProtectedRoute.tsx`

```ts
function ProtectedRoute({ children, requireAdmin = true }) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    if (!user) { setCheckingRole(false); return; }
    if (!requireAdmin) { setIsAdmin(true); setCheckingRole(false); return; }
    // chama RPC has_role(user.id, 'admin')
  });

  if (loading || checkingRole) return <Spinner/>;
  if (!user) return <Navigate to={requireAdmin ? "/admin/auth" : "/auth"} replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/admin/auth" replace />;
  return children;
}
```

### 6.2 AuthContext — `src/contexts/AuthContext.tsx`

- Listener `supabase.auth.onAuthStateChange` setado **antes** de `getSession()` (padrão para evitar race).
- Métodos expostos: `signUp(email, password, fullName?)`, `signIn`, `signOut`, `resetPassword`.
- `signUp` força `data.full_name` (fallback = parte local do email) e `emailRedirectTo = origin/`.
- `resetPassword` redireciona para `/auth?mode=reset`.

### 6.3 Roles existentes

**Dois sistemas paralelos coexistem:**

1. **`user_roles` (global, app-wide):** enum `app_role` = admin/moderator/user. Usado por `has_role()` e por todo o gating do `/admin/*`.
2. **`organization_members.role` (por org):** enum `org_member_role` = owner/admin/collaborator. Usado por `get_user_org_id()` e pelas RLS multi-tenant.

⚠️ Há sobreposição semântica entre `user_roles.admin` (app) e `organization_members.admin` (org) — duplicação intencional para separar admin global vs admin de uma org específica.

### 6.4 Validação por portal

| Portal | Path | Mecanismo |
|---|---|---|
| Admin | `/admin/*` | `<ProtectedRoute requireAdmin={true}>` → `has_role(uid,'admin')` |
| Collaborator | `/collaborator/*` | `<ProtectedRoute requireAdmin={false}>` → só exige user logado |
| Partner | `/partner/dashboard` | ❌ **Sem `<ProtectedRoute>`** — auth feito inline na página, validando `partner_users.user_id = auth.uid()` |
| Public Token | `/{invoice,proposal,portal,shared}/:token` | Sem auth — RLS anon policies validam token |

### 6.5 Partner Auth

Partners usam `auth.users` como qualquer outro user, **mas:**
- Login via `/partner/auth` (página dedicada)
- Validação inline busca `partner_users WHERE user_id = auth.uid()`
- Funções `get_partner_id_for_user()` e `get_partner_org_for_user()` são SECURITY DEFINER e usadas em RLS de `leads` (partner só vê leads que indicou) e `partners` (self_read/update)
- Trigger `enforce_partner_lead_defaults` evita partner inserir lead em outra org

### 6.6 Edge Function `invite-team-member`

End-to-end:
1. Admin chama o endpoint com `{ email, full_name, role }`
2. Função valida `Authorization` header → `getUser()` → `has_role(uid,'admin')`
3. Usa `serviceRoleKey` para `admin.inviteUserByEmail(email, { data: { full_name } })`
4. Se role = admin/moderator, insere em `user_roles`
5. Retorna `{ success: true, user_id }` ou `{ success: true, warning: 'role failed' }`

> Requer SMTP customizado configurado no Supabase Auth (memória `mem://auth/team-invitation-system`). `verify_jwt = false` em `supabase/config.toml`.

### 6.7 O que um collaborator pode acessar (RLS)

| Tabela | Acesso |
|---|---|
| `chat_messages` | INSERT/SELECT se `project_members.user_id = auth.uid()` |
| `media_files` | INSERT/SELECT se `project_members.user_id = auth.uid()` |
| `projects` | SELECT se `project_members` |
| `project_members` | SELECT só os próprios |
| `material_requests` | tenant ALL (autenticado da org) |
| `notifications` | SELECT/UPDATE só os próprios |
| Todas as outras tenant tables | depende de pertencer à org via `organization_members` |

---

## SEÇÃO 7 — PORTAIS PÚBLICOS POR TOKEN

### 7.1 `/invoice/:token` — `PublicInvoice.tsx` 💰

| Aspecto | Detalhe |
|---|---|
| Token campo | `invoices.share_token` (text, nullable) |
| Quem gera | Admin via UI (gera em algum hook de invoice) — ⚠️ VERIFICAR exatamente onde |
| O que vê | Invoice completa: items, payment_schedule, total, deposit |
| O que pode fazer | Marca `viewed_at` automaticamente (UPDATE permitido por `invoices_public_mark_viewed`) |
| Expiração | ❌ Sem expiração |
| RLS | `invoices_public_read_by_token` (anon SELECT), `invoice_items_public_read_by_token`, `invoice_payment_schedule_public_read_by_token` |

### 7.2 `/proposal/:token` — `PublicProposal.tsx` 💰

| Aspecto | Detalhe |
|---|---|
| Token campo | `proposals.share_token` (text) |
| Quem gera | Admin via `useProposalGeneration.fetchProjectData` — ⚠️ VERIFICAR se share_token é gerado lá |
| O que vê | Tiers Good/Better/Best ou Direct + customer + projeto |
| O que pode fazer | Aceitar (assinar via `SignatureDialog` → upload assinatura para `proposal-signatures` bucket → INSERT em `proposal_signatures`); pedir mudanças (`proposal_change_requests` via `ChangeRequestDialog`); marcar `viewed_at` |
| Expiração | `valid_until` (date) — não auto-bloqueia, só exibe |
| RLS | `proposals_public_read_by_token`, `customers_public_read_via_proposal_token`, `projects_public_read_via_proposal_token` |

### 7.3 `/portal/:token` — `PublicPortal.tsx`

| Aspecto | Detalhe |
|---|---|
| Token campo | `customers.portal_token` (text, default `encode(gen_random_bytes(24),'hex')`) — gerado **automaticamente na criação do customer** |
| O que vê | Lista de projects + invoices + proposals do cliente |
| O que pode fazer | Visualizar status, abrir invoices/proposals, criar `proposal_change_requests` |
| Expiração | ❌ |
| RLS | `customers_public_read_by_token`, `projects_public_list_by_customer`, `invoices_public_list_by_customer`, `proposals_public_list_by_customer` |

### 7.4 `/shared/:token` — `SharedPost.tsx`

| Aspecto | Detalhe |
|---|---|
| Token campo | `feed_posts.share_token` (uuid, nullable) |
| Quem gera | Admin no admin feed |
| O que vê | Post + imagens (mesmo se não-público) |
| RLS | `feed_posts_shared_read`, `feed_post_images_shared_read` |

### 7.5 Segurança transversal dos portais

- **Tokens são opacos** mas sem expiração e sem rotação automática — quem capturar a URL tem acesso permanente até o admin nullificar.
- **Sem rate limiting nas RLS** — proteção depende do gateway Supabase.
- ⚠️ Recomendação: rotacionar `portal_token` a cada N dias ou ao fim do projeto.

---

## SEÇÃO 8 — EDGE FUNCTIONS

Localização: `supabase/functions/<nome>/index.ts`. Deploy automático.

### 8.1 `invite-team-member`
- **Trigger:** HTTP POST autenticado
- **Config:** `verify_jwt = false` (auth manual)
- **Payload:** `{ email, full_name, role }`
- **Passos:** valida admin → `inviteUserByEmail` (service role) → opcional INSERT em `user_roles`
- **Secrets:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- **Retorno:** `{ success, user_id }` ou warning

### 8.2 `collaborator-upload` 💰
- **Trigger:** HTTP POST `multipart/form-data`
- **Config:** `verify_jwt = false` (validação manual via `getClaims`)
- **Payload:** `file` (≤10MB), `projectId` (UUID), `folderType` ∈ `before_after|job_progress`, `metadata` (JSON opcional)
- **MIME permitidos:** `image/jpeg`, `image/png`, `image/webp`
- **Passos:**
  1. Valida JWT via `auth.getClaims(token)`
  2. Valida MIME, tamanho, UUID, folderType
  3. Valida `project_members` membership
  4. Upload para `media/projects/{projectId}/{folderType}/{ts}-{rand}.{ext}` via service role
  5. INSERT `media_files` com `source_type='collaborator'`, `visibility='internal'`
  6. Audit log `COLLABORATOR_UPLOAD` (best-effort, não bloqueia se falhar)
- **Erros:** 401 unauth, 400 input inválido, 403 não-membro, 500 storage/db
- **Cleanup:** se DB insert falhar, remove arquivo do storage

### 8.3 `send-to-notion`
- **Trigger:** HTTP POST
- **Payload:** `{ name, email, phone, source, services?, notes?, budget?, room_size?, city?, zip_code?, message?, priority?, status? }`
- **Passos:** monta payload de Notion → `POST https://api.notion.com/v1/pages` com Bearer NOTION_API_KEY, parent `database_id = NOTION_DATABASE_ID`
- **Estrutura Notion (propriedades esperadas):** Name (title), Email, Phone, Source (select), Services (multi_select), Created At (date), Budget (number), Room Size (rich_text), City, Zip Code, Priority (select), Status (select), Notes (rich_text)
- **Secrets:** `NOTION_API_KEY`, `NOTION_DATABASE_ID`
- **Retorno:** `{ success, notionPageId }`

### 8.4 `send-follow-up`
- **Trigger:** HTTP POST
- **Payload:** `{ email, name, leadType }` onde leadType ∈ general/builder_partnership/realtor_partnership
- **Passos:** monta HTML inline diferenciado por leadType → `POST https://api.resend.com/emails`
- **From:** `AXO Floors <noreply@axo-floors.com>`
- **Secrets:** `RESEND_API_KEY`
- **Sanitiza** logs de PII

### 8.5 `send-notifications`
- **Trigger:** HTTP POST (chamado quando lead nasce)
- **Payload:** `{ leadData, adminEmail, adminPhone? }`
- **Passos:**
  1. Email para admin via Resend (HTML rico com dados do lead)
  2. SMS via Twilio (se `adminPhone` fornecido) usando `TWILIO_*` secrets
- **Secrets:** `RESEND_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Retorno:** `{ email: { success }, sms: { success } }`

### 8.6 `nightly-proof-reminder`
- **Trigger:** Cron (`0 22 * * *` via `cron.job`)
- **Sem payload (chamada via pg_net)**
- **Passos:**
  1. SELECT projects in `('in_production','in_progress','completed')`
  2. SELECT job_proof, identifica os sem AFTER
  3. Agrupa por `organization_id`
  4. Para cada org: busca admins/owners, INSERT batch em `notifications`, e (se RESEND_API_KEY) envia email summary com até 20 projects
- **From:** `AXO Floors <noreply@axofloorsnj.com>`
- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` (opcional)
- **Retorno:** `{ ok, scanned, missing_after, notifications_created, emails_sent }`

### 8.7 `facebook-conversions` 💰
- **Trigger:** HTTP POST
- **Payload:** `{ eventData: { event_name?, source_url?, email?, phone?, first_name?, last_name?, value?, service?, fbc?, fbp?, custom_data?, test_event_code? } }`
- **Passos:**
  1. SHA-256 hash de email/phone/first_name/last_name (lowercase, phone só dígitos)
  2. Monta payload Conversions API com `event_time = now`, `action_source='website'`
  3. POST `https://graph.facebook.com/v18.0/{pixelId}/events` (Pixel ID hardcoded `403151700983838`)
- **Secrets:** `FACEBOOK_ACCESS_TOKEN`
- **Retorno:** `{ success, facebook_response, events_received }`
- **Eventos disparados:** Padrão é `Lead`. App pode customizar `event_name` ⚠️ VERIFICAR todos os call sites.

---

## SEÇÃO 9 — HOOKS PERSONALIZADOS

> ~40 hooks em `src/hooks/`. Convenções:
> - `useXxx` retorna React Query result ou wrapper
> - Cache key = nome simbólico (varia por hook)
> - Quase todos dependem de `@/integrations/supabase/client`

### 9.1 Hooks chave

| Hook | Tabelas | Cache key | Operações | Retorno |
|---|---|---|---|---|
| `useAuth` (em `AuthContext`) | `auth.users` | — | signIn/signUp/signOut/resetPassword | `{user, session, loading, ...}` |
| `useCompanySettings` | `company_settings` | (próprio state, não usa React Query) | SELECT singleton | `{settings, isLoading, error, refetch, companyName, marginMinPercent, laborPricingModel, laborRate}` |
| `useLeadPipeline` | `leads` (via RPC `transition_lead_status`) | — | RPC | `{updateLeadStatus, isUpdating, getNextAllowedStatuses, getStageIndex}` |
| `useLeadCapture` | `leads` | ⚠️ VERIFICAR | INSERT pública | hook de submit |
| `useLeadConversion` | RPC `convert_lead_to_project` | — | RPC | `{convertLead, isConverting}` |
| `useLeadFollowUp` | `leads.follow_up_actions` | ⚠️ | UPDATE jsonb append | |
| `useLeadNRA` | RPC `get_leads_nra_batch` | `['leads-nra', ...ids]` | RPC batch | NRA por lead |
| `useProjectsHub` | `projects` + agregados | `['hub-projects']` | SELECT + filtros | lista enriquecida |
| `useProjectActivity` | `audit_log`, `chat_messages`, `media_files` | `['project-activity', projectId]` | SELECT join | timeline |
| `useProjectSignals` | `projects`, `job_costs`, `job_proof` | `['project-signals', projectId]` | computa risk score | |
| `useProjectDocuments` | `project_documents` | `['project-documents', projectId]` | CRUD | |
| `useProposals` | `proposals` | `['proposals']` ou `['proposals', projectId]` | CRUD | |
| `useProposalGeneration` | `projects`, `job_costs`, `company_settings`, `proposals`, `job_cost_items` | — (mutation-like) | INSERT proposal (Tiers ou Direct) com validação de margem | `{generateTiers, validateAllTiers, fetchProjectData, isLoading, error}` |
| `useProposalValidation` | RPC `validate_proposal_margin` | — | RPC | `{validateProposalMargin, canSendProposal}` |
| `useInvoices` | `invoices`, `invoice_items`, `invoice_payment_schedule` | `['invoices', projectId?]` | CRUD + share_token | |
| `usePayments` | `payments` | `['payments']` | CRUD | |
| `useJobCosts` | `job_costs` | `['job-costs', projectId]` | SELECT/UPSERT | |
| `useJobCostItems` | `job_cost_items` | `['job-cost-items', jobCostId]` | CRUD | |
| `useMaterialCosts` | `material_costs` | `['material-costs', projectId]` | CRUD | |
| `useLaborEntries` | `labor_entries` | `['labor-entries', projectId?]` | CRUD | |
| `useJobProof` | `job_proof` | `['job-proof', projectId]` | CRUD with Storage upload (`job-proof` bucket) | |
| `useMeasurements` | `project_measurements`, `measurement_areas` | `['measurements', projectId]` | CRUD | |
| `useMaterialRequests` | `material_requests` | `['material-requests']` | CRUD | |
| `useMediaFiles` | `media_files` | `['media-files', filters]` | SELECT + signed URLs | |
| `useNotifications` | `notifications` | `['notifications', userId]` | SELECT + Realtime + mark_read | |
| `useTasks` | `tasks` | `['tasks']` | CRUD | Mission Control |
| `useServiceCatalog` | `service_catalog` | `['service_catalog', itemType?]` | CRUD + Storage `media/catalog/...` | `{useServiceCatalog, useCreateCatalogItem, useUpdateCatalogItem, useDeleteCatalogItem, uploadCatalogImage, deleteCatalogImage, getCatalogSignedUrls}` |
| `usePartnerPipeline` | `partners` | `['partners-pipeline']` | UPDATE status | |
| `useCollaboratorProjects` | `projects` (via RLS de `project_members`) | `['collab-projects']` | SELECT | |
| `useCollaboratorSchedule` | `appointments`, `appointment_assignees` | `['collab-schedule']` | SELECT | |
| `useCollaboratorUpload` | Edge fn `collaborator-upload` | — | POST multipart | |
| `useReferralProfile` | `referral_profiles`, `referrals`, `referral_rewards` | `['referral']` | CRUD + leaderboard | |
| `useEstimatesList` | `proposals` (status=draft/sent) | `['estimates']` | SELECT | |
| `useAutomationFlows` | `automation_sequences`, `automation_drips` | `['automation', ...]` | CRUD | |
| `useNodeOverrides` | `system_node_overrides`, `system_node_arrows`, `system_node_notes` | `['mindmap']` | CRUD | |
| `usePerformanceData` | `weekly_reviews`, `weekly_review_projects` + `view_financial_metrics` | `['performance']` | SELECT | |
| `useWeeklyReviews` | `weekly_reviews` | `['weekly-reviews']` | CRUD snapshot | |
| `useFeedData` (em `hooks/admin/`) | `feed_posts`, `feed_post_images`, `feed_comments`, `feed_folders` | `['feed-*']` | CRUD | |
| `useDashboardData` (em `hooks/admin/`) | RPC `get_dashboard_metrics` | `['dashboard-metrics']` | RPC | |
| `usePartnersData` (em `hooks/admin/`) | `partners`, `partner_users` | `['partners']` | CRUD | |
| `useAdminData` (em `hooks/admin/`) | múltiplas | `['admin-*']` | utilities | |

⚠️ Cada hook deve ser inspecionado individualmente antes de modificar — assinaturas exatas variam. Use `code--view src/hooks/<file>` para detalhes.

---

## SEÇÃO 10 — COMPONENTES CRÍTICOS

### 10.1 `src/components/admin/`

| Componente | Props chave | Hooks | Comportamento |
|---|---|---|---|
| `AdminLayout.tsx` | `{children}` | `useAuth` | Wrapper com `AdminSidebar` + `MobileBottomNav` |
| `AdminSidebar.tsx` | — | — | Nav vertical "Tools" inclui Mission Control, Projects, Leads, etc. |
| `AdminPWAHead.tsx` | — | — | Manifest para iOS PWA standalone (rota `/admin`) |
| `MobileBottomNav.tsx` | — | router | Nav inferior global (mobile + desktop) com FAB central |
| `AddressAutocomplete.tsx` | `{value, onChange, onSelect}` | Google Places API | Atualiza address+city+zip em conjunto |
| `LeadControlModal.tsx` | `{leadId, open, onClose}` | `useLeadPipeline`, `useLeadFollowUp`, `useLeadNRA` | Edita lead, registra follow-ups, anexa notas |
| `LeadPipelineStatus.tsx` | `{status, onChange}` | `useLeadPipeline` | Mostra estágio atual + transições válidas |
| `LeadSignalBadge.tsx` | `{lead}` | — | Pinta badge por NRA severity |
| `LeadFollowUpAlert.tsx` | `{lead}` | — | Alerta visual se overdue |
| `NewLeadDialog.tsx` | `{open, onClose}` | `useLeadCapture` | Cria lead manualmente no admin |
| `NewJobDialog.tsx` | `{open, onClose, leadId?}` | `useLeadConversion` | Minimalist: só "Services" obrigatório |
| `NewEstimateDialog.tsx` | `{open, onClose, projectId}` | — | Cria appointment tipo estimate |
| `NewPartnerDialog.tsx` | `{open, onClose}` | — | CRUD partner |
| `InvitePartnerDialog.tsx` | `{partnerId}` | edge fn (via supabase.functions.invoke) | Invita user para `partner_users` |
| `PartnerControlModal.tsx` | `{partnerId}` | — | CRUD + pipeline partner |
| `PartnerDetailPanel.tsx` | `{partnerId}` | — | Side sheet com summary |
| `PartnerPipelineBoard.tsx` | — | `usePartnersData` | Kanban 6 estágios |
| `PartnerListItem.tsx` | `{partner}` | — | Row para list view |
| `JobCostEditor.tsx` | `{projectId}` | `useJobCosts`, `useJobCostItems` | Edita custos com cálculo automático de margem |
| `JobMarginDisplay.tsx` | `{margin, minMargin}` | — | Gauge visual com cores (red < min, amber, green) |
| `JobChecklist.tsx` | `{projectId}` | — | Checklist de etapas |
| `JobProofUploader.tsx` | `{projectId}` | `useJobProof` | Upload before/after para `job-proof` bucket |
| `ProposalGenerator.tsx` | `{projectId, mode}` | `useProposalGeneration`, `useProposalValidation` | Toggle Tiers/Direct, valida margem antes de salvar |
| `QuickQuoteSheet.tsx` | `{leadId}` | — | 3-step: cria Customer + Project + Proposal |
| `ProjectChatPanel.tsx` | `{projectId}` | Realtime channel | Chat interno por projeto |
| `ProjectDocumentsManager.tsx` | `{projectId}` | `useProjectDocuments` | Upload to `project-documents` bucket, organizar por folder |
| `ImageUploader.tsx` | `{onUpload, accept}` | — | Wrapper genérico c/ HEIC convert |
| `DragDropGrid.tsx` | `{items, onReorder}` | `@dnd-kit` | Reordenação visual |
| `DataTable.tsx` | `{columns, data}` | — | Wrapper de tabela |
| `StatsCards.tsx` | `{metrics}` | — | KPIs |
| `TensionMetricsCards.tsx` | — | `useDashboardData` | Cards de SLA breaches |
| `ActionableAlertsSection.tsx` | — | `useDashboardData` | Lista de alerts críticos |
| `dashboard/MissionControl.tsx` | — | `useDashboardData`, `useTasks` | Lista unificada de SLA + tasks manuais |
| `dashboard/MetricCard.tsx` | `{title, value, ...}` | — | Card padrão |
| `dashboard/AgendaSection.tsx` | — | `useCollaboratorSchedule` adaptado | Próximos appointments |
| `dashboard/PriorityTasksList.tsx` | — | — | 🗑️ LEGADO (removido do Dashboard) |
| `dashboard/NewTaskDialog.tsx` | `{open, onClose}` | `useTasks` | Cria task manual |
| `automations/SequenceDetail.tsx` | `{sequenceId}` | `useAutomationFlows` | Edita sequence + drips |
| `automations/DripEditor.tsx` | `{drip}` | — | Form para drip individual |
| `automations/StageFlowList.tsx` | — | `useAutomationFlows` | Lista por estágio |
| `feed/*` (FeedPostCard, FeedPostForm, FeedFolderGrid, FeedImageCarousel, FeedCommentSection, FeedFiltersSheet, CreateFolderDialog) | varia | `useFeedData` | CRUD do Company Feed com upload `feed-media` |
| `gallery/*` (FolderHubGrid, GalleryFeedPanel, GalleryPublicPanel, MediaQuickUpload, QuickFolderDialog) | varia | `useMediaFiles`, `useFeedData` | Hub de galeria interna + pública |
| `job-detail/JobFinancialHeader.tsx` | `{projectId}` | `useJobCosts` | Header com valores financeiros |
| `job-detail/InvoicesPaymentsSection.tsx` | `{projectId}` | `useInvoices`, `usePayments` | Inline invoice creation |
| `payments/*` | varia | `usePayments` | Hub Income/Payroll/Expense |
| `performance/*` | varia | `usePerformanceData` | Charts (recharts) |
| `projects/*` | varia | `useProjectsHub` | Pipeline cards, ProjectDetailPanel side sheet |
| `proposals/ProposalPipelineBoard.tsx` | — | `useProposals` | 5-stage Kanban |
| `settings/BrandingSettings.tsx` | — | `useCompanySettings` | Logo upload (signed URL via `media/branding/`), cores, trade_name, tagline, contato |
| `settings/GeneralSettings.tsx` | — | `useCompanySettings` | Margem mínima, labor rate/model |
| `settings/TeamSettings.tsx` | — | edge fn `invite-team-member` | Lista members + convite |
| `settings/InviteTeamMemberDialog.tsx` | `{open, onClose}` | edge fn | Form de convite |

### 10.2 `src/components/collaborator/`

| Componente | Props | Comportamento |
|---|---|---|
| `CollaboratorLayout.tsx` | — | `<Outlet>` + bottom nav 4 abas (Home/Schedule/Chat/Profile) |

### 10.3 `src/components/partner/`

| Componente | Props | Hooks | Comportamento |
|---|---|---|---|
| `NewReferralSheet.tsx` | `{open, onClose}` | `supabase.from('leads').insert` | Partner cria lead — RLS força defaults via `enforce_partner_lead_defaults` |
| `PartnerLeadCard.tsx` | `{lead}` | — | Card de lead indicado |
| `PartnerProfileTab.tsx` | — | partner self_update | Edita próprio perfil |
| `PartnerStageBar.tsx` | `{stage}` | — | Indicador visual |

### 10.4 `src/components/portal/`

| Componente | Props | Comportamento |
|---|---|---|
| `ChangeRequestDialog.tsx` | `{proposalId, customerId, organizationId}` | INSERT em `proposal_change_requests` (RLS anon permite) |

### 10.5 `src/components/proposal/`

| Componente | Props | Comportamento |
|---|---|---|
| `SignatureDialog.tsx` | `{proposalId, organizationId, onSigned}` | Canvas de assinatura → Blob → upload em `proposal-signatures` bucket → INSERT em `proposal_signatures` (RLS anon permite com check via share_token) |

---

## SEÇÃO 11 — STORAGE BUCKETS

| Bucket | Public | Estrutura de paths | Limite tamanho/MIME (configurado) |
|---|---|---|---|
| `gallery` | ✅ | livre | nenhum |
| `job-proof` | ✅ | livre (geralmente `{projectId}/{before|after}-{ts}.{ext}`) | nenhum |
| `feed-media` | ✅ | livre | nenhum |
| `media` | ❌ | `branding/...`, `catalog/{itemId}/...`, `projects/{projectId}/{folderType}/...` | nenhum (limite imposto pela edge fn `collaborator-upload` = 10MB) |
| `project-documents` | ❌ | livre | nenhum |
| `proposal-signatures` | ❌ | `{proposalId}/{ts}.png` ⚠️ VERIFICAR convenção exata | nenhum |

### 11.1 Policies (`storage.objects`)

| Policy | Bucket | Comando | Quem | Condição |
|---|---|---|---|---|
| `Gallery images are publicly accessible` | gallery | SELECT | public | `bucket_id='gallery'` |
| `Admins can upload gallery images` | gallery | INSERT | public | admin role |
| `Admins can update gallery images` | gallery | UPDATE | public | admin role |
| `Admins can delete gallery images` | gallery | DELETE | public | admin role |
| `Job proof images are publicly accessible` | job-proof | SELECT | public | sempre |
| `Authenticated users can upload job proof images` | job-proof | INSERT | public | `auth.uid() IS NOT NULL` |
| `Authenticated users can update job proof images` | job-proof | UPDATE | public | mesma |
| `Authenticated users can delete job proof images` | job-proof | DELETE | public | mesma |
| `feed_media_public_read` | feed-media | SELECT | public | sempre |
| `feed_media_admin_insert/update/delete` | feed-media | I/U/D | public | admin role |
| `Public read access to branding assets` | media | SELECT | public | `(storage.foldername(name))[1] = 'branding'` |
| `media_anon_read` | media | SELECT | anon | sempre — ⚠️ leitura anon de TODO o bucket privado, contradiz "is_public=false" |
| `media_authenticated_read` | media | SELECT | authenticated | sempre |
| `media_admin_upload/update/delete` | media | I/U/D | authenticated | admin role |
| `catalog_authenticated_read` | media | SELECT | authenticated | `(storage.foldername(name))[1] = 'catalog'` |
| `catalog_admin_upload/update/delete` | media | I/U/D | authenticated | admin role + folder=catalog |
| `project_docs_authenticated_read` | project-documents | SELECT | authenticated | `auth.uid() IS NOT NULL` |
| `project_docs_admin_insert/update/delete` | project-documents | I/U/D | authenticated | admin role |
| `proposal_signatures_anon_read` | proposal-signatures | SELECT | anon | sempre |
| `proposal_signatures_admin_read` | proposal-signatures | SELECT | authenticated | sempre |
| `proposal_signatures_anon_upload` | proposal-signatures | INSERT | anon/authenticated | sempre |

⚠️ **Nota de segurança:** `media_anon_read` permite anon ler todo o bucket `media` apesar de `is_public=false`. Isso vaza signed URLs e arquivos privados para qualquer um que descubra o nome. **REVISAR.**

---

## SEÇÃO 12 — `company_settings` (Singleton)

### 12.1 Campos

| Campo | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| singleton_key | bool | true (garante 1 row) |
| organization_id | uuid | nullable ⚠️ |
| company_name | text | 'AXO Floors' |
| trade_name | text | 'AXO Floors' |
| tagline | text | nullable |
| primary_color | text | '#d97706' |
| secondary_color | text | '#1e3a5f' |
| logo_url | text | nullable (storage path em `media/branding/...`) |
| phone, email, website | text | nullable |
| default_margin_min_percent | numeric | 30 (💰 base de `validate_proposal_margin`) |
| default_labor_rate | numeric | 3.50 (💰 base de cálculos `sqft` mode) |
| labor_pricing_model | enum `labor_pricing_model` | 'sqft' (ou 'daily') |
| referral_commission_percent | numeric | 7 |
| created_at, updated_at | timestamptz | now() |

### 12.2 RLS

- `Authenticated users can view company settings` (SELECT public): qualquer logado
- `company_settings_public_read_for_proposals` (SELECT anon): qualquer um (pra portais públicos)
- `Admins can insert/update`: só admin role
- ❌ DELETE bloqueado

### 12.3 Quem lê

- `useCompanySettings` (hook React)
- `getCompanySettings()` / `getCompanySettingsWithDefaults()` (utilities não-reativos)
- `ProposalGenerator` (margem mínima)
- `PublicProposal`, `PublicInvoice`, `PublicPortal` (branding)
- Triggers `axo_validate_lead_transition`, `validate_proposal_margin`, `compute_project_next_action` (margem mínima)

### 12.4 Quem edita

- `src/components/admin/settings/BrandingSettings.tsx` (logo + cores + trade_name + tagline + contato)
- `src/components/admin/settings/GeneralSettings.tsx` (margem mínima, labor rate, labor model)

### 12.5 Logo (`logo_url`)

- Armazenado como **storage path** (ex: `branding/logo-1234.png`) no bucket `media`
- `resolveLogoUrl(path)` em `useCompanySettings.ts` → cria signed URL com TTL = 3600s
- Se já vier como URL completa, retorna as-is
- Refresh: cada render que chamar `resolveLogoUrl` gera novo signed URL ⚠️ não cacheado — pode causar latência

### 12.6 `default_labor_rate`

- Multiplicado por `square_footage` quando `labor_pricing_model='sqft'`
- Usado pelo `JobCostEditor` e por preview de orçamento no QuickQuoteSheet
- Quando `labor_pricing_model='daily'`, ignora-se em favor de `labor_entries.daily_rate * days_worked`

---

## SEÇÃO 13 — INTEGRAÇÕES EXTERNAS

### 13.1 Facebook Conversions API 💰
- **Pixel ID:** `403151700983838` (hardcoded em `facebook-conversions/index.ts`)
- **Endpoint:** `https://graph.facebook.com/v18.0/{pixelId}/events`
- **Quando dispara:** chamado pelo frontend em conversões (lead capture, quiz, etc.) ⚠️ VERIFICAR todos os call sites com `rg "facebook-conversions"`
- **Eventos:** `Lead` (default), customizável via `event_name`
- **Hashing:** SHA-256 lowercase de email/phone/first_name/last_name
- **PII enviada hashed:** em (email), ph (phone), fn (first), ln (last) + IP, UA, fbc, fbp
- **Custom data:** `currency=USD`, `value`, `content_category` (default 'flooring')

### 13.2 Notion
- **API:** `https://api.notion.com/v1/pages` v2022-06-28
- **Database ID:** secret `NOTION_DATABASE_ID` ⚠️ estrutura exata da DB precisa ser verificada no dashboard Notion
- **Propriedades enviadas:** Name, Email, Phone, Source, Services, Created At, Budget, Room Size, City, Zip Code, Priority, Status, Notes
- **Quando dispara:** `send-to-notion` é chamado pelos formulários públicos (Quiz, Contact, Floor Diagnostic, Project Wizard) — `mem://integrations/notion-lead-sync`

### 13.3 Resend (email)
- **From padrão:** `AXO Floors <noreply@axo-floors.com>` (`send-follow-up`) ou `noreply@axofloorsnj.com` (`nightly-proof-reminder`) ⚠️ inconsistência
- **Templates:** **inline HTML** dentro das edge functions (não há templates no dashboard Resend)
- **Emails ativos:**
  - `send-follow-up` — 3 variantes (general / builder_partnership / realtor_partnership)
  - `send-notifications` — admin notification de novo lead
  - `nightly-proof-reminder` — daily summary de projetos sem AFTER photo
  - `invite-team-member` — convite via `auth.admin.inviteUserByEmail` (template gerenciado pelo Supabase Auth, **não** pela edge fn)

### 13.4 Twilio (SMS)
- **Usado em:** `send-notifications`
- **Secrets:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Quando:** novo lead chega e admin tem `adminPhone` cadastrado

### 13.5 Google Places (frontend)
- **Componente:** `src/components/admin/AddressAutocomplete.tsx`
- **Atualiza simultaneamente:** address + city + zip_code
- **Onde é usado:** `NewLeadDialog`, `NewPartnerDialog`, `ProjectDetail` (modo edit), appointments (forçado pela memória `mem://constraints/appointment-address-enforcement`)
- **API key:** ⚠️ VERIFICAR — Google Maps key deve estar no client (publishable, ok hardcoded ou em env build-time)

### 13.6 GoogleBusinessIntegration
- **Componente:** `src/components/shared/GoogleBusinessIntegration.tsx`
- **Função:** ⚠️ VERIFICAR — provavelmente exibe rating + link para deixar review (usado em `/review-request`)

### 13.7 SecurityHeaders
- **Componente:** `src/components/SecurityHeaders.tsx`
- Seta CSP, X-Content-Type-Options, Referrer-Policy via meta tags client-side
- Adiciona theme-color, msapplication-TileColor (#0C1C2E), format-detection (telephone=no)

---

## SEÇÃO 14 — SERVICE CATALOG

### 14.1 Tipos

```ts
type CatalogItemType = 'service' | 'material';
type PriceUnit = 'sqft' | 'unit' | 'step' | 'linear_ft';
```

| `price_unit` | Uso típico | Multiplicador |
|---|---|---|
| `sqft` | refinishing, install, vinyl plank | × `square_footage` |
| `unit` | items individuais, add-ons | × `quantity` |
| `step` | escadas (não sqft!) | × número de degraus |
| `linear_ft` | baseboards, handrails | × medição linear |

### 14.2 Estrutura de Tiers (Good/Better/Best)

Definida em `src/hooks/useProposalGeneration.ts`:

```ts
DEFAULT_TIER_MARGINS = { good: 30, better: 38, best: 45 };
TIER_TEMPLATES = [
  { id: 'good',   name: 'Good',   features: ['Sanding & prep', 'Standard polyurethane', '1 coat stain', '2 coats finish', 'Basic cleanup'] },
  { id: 'better', name: 'Better', features: ['Everything in Good', 'Premium polyurethane', '2 coats stain', '3 coats finish', 'Edge detail', 'Thorough cleanup'] },
  { id: 'best',   name: 'Best',   features: ['Everything in Better', 'Commercial-grade finish', 'Custom stain matching', '4 coats finish', 'Baseboard touch-up', 'Furniture moving', 'Premium cleanup'] },
];
```

### 14.3 Cálculo de preço (Tiers)

```
targetMargin = max(DEFAULT_TIER_MARGINS[tier], company_settings.default_margin_min_percent)
price = ceil( baseCost / (1 - targetMargin/100) )
```
onde `baseCost = job_costs.total_cost`.

### 14.4 Validação (BLOCKING)

`validateAllTiers` retorna `all_valid=false` se qualquer tier ficar abaixo da `minMargin`. `fetchProjectData` lança erro e **não persiste** a proposta. Direct mode (`flat_price`) exige a mesma checagem.

### 14.5 Como o catálogo alimenta o ProposalGenerator

⚠️ VERIFICAR — `useProposalGeneration` atual usa `job_costs` como base (não itera sobre `service_catalog`). O catálogo é editado em `/admin/catalog` (`AdminCatalog.tsx`) e usado pelo `QuickQuoteSheet` para sugerir line items, mas a proposta final pega `total_cost` agregado, não breakdown por catalog item. Em Direct mode, exibe `job_cost_items` como linha breakdown.

---

## SEÇÃO 15 — DÉBITOS TÉCNICOS E INCONSISTÊNCIAS

### 15.1 Rotas

- 🗑️ `/admin/jobs` redireciona para `/admin/projects` — manter ou remover?
- ⚠️ `/admin/jobs/:projectId/documents` usa `/admin/jobs/...` mas hub é `/admin/projects` — path inconsistente
- ⚠️ `/partner/dashboard` **não tem `<ProtectedRoute>`** — auth manual, risco se não validado bem na página

### 15.2 Banco

- ⚠️ **Todas as foreign keys aparecem como ausentes** na introspecção `information_schema.referential_constraints`. Memória `mem://docs/system-audit-baseline` afirma que existem. Conferir se foram dropadas em migration recente — se sim, integridade depende 100% da aplicação.
- ⚠️ Triggers não retornaram em `information_schema.triggers` ⚠️ VERIFICAR via `pg_trigger`
- ⚠️ Indexes não inspecionados ⚠️ VERIFICAR `pg_indexes`
- ⚠️ `validate_lead_transition` é stub (retorna sempre `true`) — função efetiva é o trigger `axo_validate_lead_transition`. Função RPC pode ser removida se ninguém chama
- ⚠️ `job_costs` RLS sem `WITH CHECK` — INSERT/UPDATE técnicamente bloqueado para non-admins (só admin via `has_role`? não, é tenant via projects join — verificar comportamento real)
- ⚠️ `media_anon_read` permite anon ler todo o bucket `media` apesar de `is_public=false` 💰 RISCO

### 15.3 UI vs Backend desencontrados

- 💰 **Job completion:** memória diz "badge não-bloqueante" mas trigger `enforce_job_proof_on_completion` ainda existe e bloqueia transição → completed sem AFTER photo. UI pode mostrar badge enquanto banco rejeita silenciosamente.

### 15.4 Idiomas misturados no código

- Comentários, mensagens de erro e logs em português; UI pública e admin tem mistura PT/EN. Memória `mem://constraints/target-audience-language` diz que público é EN; admin pode permanecer PT.
- Erros de trigger em PT (ex: "Pipeline bloqueado: ... → ... não permitido") — usuário admin lê em PT, mas se vazar para portal público fica estranho.

### 15.5 Features parciais

- `automation_drips`/`automation_sequences`: tabelas + UI existem, **sem cron** consumindo
- `tasks` (Mission Control): tabela ⚠️ schema completo não confirmado
- `supply_connections`: tabela + função `supply_has_access` + RLS prontos, **sem UI completa** para criar/gerenciar
- `system_node_*` (mindmap): persistência por overrides funciona, mas é feature lateral

### 15.6 Resend inconsistência

- `send-follow-up` usa `noreply@axo-floors.com`
- `nightly-proof-reminder` usa `noreply@axofloorsnj.com`
- Padronizar um dos dois

### 15.7 Hooks duplicados / sobrepostos

- `useEstimatesList` vs `useProposals` — `useEstimatesList` filtra `proposals` por status draft/sent. Pode ser mesclado.
- `useDashboardData` (em `hooks/admin/`) chama RPC `get_dashboard_metrics` (SSOT). Outros hooks que duplicam contagens (e.g. `useProjectsHub`) deveriam consumir essa RPC ou viewfinanceiro

### 15.8 Logo URL (cache)

- `resolveLogoUrl` cria signed URL a cada chamada (TTL 3600s) sem memoização — re-renders em components que exibem logo geram chamadas repetidas ao Storage API.

---

## SEÇÃO 16 — FLUXOS E2E

### Fluxo A — Lead público pelo Quiz vira projeto pago 💰

1. **Cliente abre `/quiz`** → componente `Quiz.tsx`
2. Submete → INSERT `quiz_responses` (RLS: anyone insert) + INSERT `leads` (RLS `leads_public_insert`) com `status='cold_lead'`
3. **Trigger `validate_lead_insert`** (BEFORE INSERT) força defaults se non-admin
4. **Frontend chama edge fns:**
   - `send-to-notion` → cria página no Notion
   - `send-notifications` → email Resend para admin + SMS Twilio (se configurado)
   - `facebook-conversions` → POST CAPI evento `Lead` (PII hashed)
5. **Admin vê o lead no `/admin/leads`** ou `/admin/intake` ou Mission Control alert
6. Admin avança pipeline: `cold_lead` → `warm_lead` → `estimate_requested` → `estimate_scheduled`
7. Em algum ponto admin clica "Convert to Project" → RPC `convert_lead_to_project(lead_id, project_type)`:
   - Cria `customers` (se não existe) e `projects`
   - Cria `job_costs` zerado
   - Vincula `leads.converted_to_project_id` e `customer_id`
   - Audit `LEAD_CONVERTED`
8. Admin preenche custos via `JobCostEditor` (`material_costs`, `labor_entries`, `job_cost_items`) → triggers recalculam `job_costs.material_cost/labor_cost`
9. **Generated columns** atualizam `total_cost`, `margin_percent`, `profit_amount`
10. Admin tenta avançar lead `estimate_scheduled → in_draft`: trigger `axo_validate_lead_transition` checa `margin_percent >= company_settings.default_margin_min_percent`. Se OK, transição permitida
11. Admin abre `ProposalGenerator` → escolhe Tiers ou Direct
    - `useProposalGeneration.fetchProjectData` valida margem (frontend) + RPC `validate_proposal_margin` (backend) — bloqueia se < min, audit `PROPOSAL_BLOCKED`
    - Se OK: INSERT `proposals` com `share_token` opcional
12. Admin envia link `/proposal/:token` para cliente (WhatsApp, email, etc.)
13. Cliente abre → `proposals_public_mark_viewed` UPDATE `viewed_at`
14. Cliente assina via `SignatureDialog`:
    - Upload PNG canvas para bucket `proposal-signatures` (anon insert)
    - INSERT `proposal_signatures` (anon insert via share_token check)
    - UPDATE `proposals.status='accepted'`, `selected_tier`, `accepted_at` (trigger `enforce_proposal_acceptance` valida)
15. Admin avança lead `proposal_sent → in_production`: trigger valida que existe proposta accepted vinculada
16. Trabalho executado: collaborator faz uploads via edge fn `collaborator-upload` → `media_files` com `folder_type='before_after|job_progress'`
17. Admin cria `invoices` no `JobDetail` (inline) com `share_token`. Cliente recebe link `/invoice/:token`, marca `viewed_at` ao abrir
18. Cliente paga: admin INSERT `payments` com `category='received'`
19. Admin avança projeto para `completed`: trigger `enforce_job_proof_on_completion` exige AFTER photo (em `job_proof.after_image_url`)
20. Lead `in_production → completed` (terminal)
21. `nightly-proof-reminder` para de listar este projeto
22. Aparece em `/admin/performance` (filtro só `completed`) e em snapshots `weekly_reviews`

### Fluxo B — Admin cria lead manual no intake até proposta enviada

1. Admin em `/admin/intake` clica "+" → `NewLeadDialog`
2. INSERT `leads` (RLS tenant_all + `validate_lead_insert` permite admin)
3. Restante idêntico ao Fluxo A do passo 6 em diante

### Fluxo C — Collaborator recebe projeto, faz upload, projeto é completado

1. Admin cria projeto e adiciona collaborator em `project_members`
2. Collaborator faz login em `/auth` (genérico), `<ProtectedRoute requireAdmin={false}>` permite
3. Vai para `/collaborator` → vê projetos via RLS `projects_collaborator_read`
4. Abre `/collaborator/project/:projectId` → `CollaboratorProjectDetail`
5. Faz upload via `useCollaboratorUpload` → POST multipart para edge fn `collaborator-upload`:
   - Edge fn valida JWT, project membership, MIME, size
   - Upload para `media/projects/{projectId}/{folderType}/{ts}-{rand}.{ext}` via service role
   - INSERT `media_files` com `source_type='collaborator'`, `visibility='internal'`
   - Audit `COLLABORATOR_UPLOAD`
6. Upload aparece no admin dashboard como "field upload" via `get_dashboard_metrics` → `recentFieldUploads` (lê `audit_log` últimas 24h)
7. Collaborator pode abrir `/collaborator/chat` → INSERT `chat_messages` (RLS valida membership). Trigger `notify_on_chat_message` cria `notifications` para admins + outros members
8. Quando AFTER photo é uploaded em `job_proof`, admin pode mover projeto para `completed` (trigger `enforce_job_proof_on_completion` permite)

### Fluxo D — Partner indica lead, lead converte, partner vê comissão

1. Admin convida partner via `InvitePartnerDialog` → edge fn `invite-team-member` (cria auth.user + `user_roles` opcional). Depois admin chama RPC `link_partner_user(partner_id, user_id)` para vincular em `partner_users`
2. Partner faz login em `/partner/auth` (custom)
3. Vai para `/partner/dashboard` → `PartnerDashboard` valida inline `partner_users`
4. Partner abre `NewReferralSheet` → INSERT em `leads`:
   - RLS `leads_partner_insert` força `organization_id = get_partner_org_for_user()` E `referred_by_partner_id = get_partner_id_for_user()`
   - Trigger `enforce_partner_lead_defaults` força `lead_source='partner_referral'`, `status='cold_lead'`, `priority='medium'`
5. Admin processa lead normalmente (Fluxo A passos 5+)
6. Quando lead converte: `convert_lead_to_project` cria projeto e (futuramente) `projects.referred_by_partner_id` é setado a partir do lead ⚠️ VERIFICAR se isso é automático
7. Quando projeto completa, partner vê em `/partner/dashboard`:
   - SELECT `leads WHERE referred_by_partner_id = get_partner_id_for_user()` (RLS `leads_partner_read_own_referrals`)
   - Calcula commission = `projects.actual_cost × company_settings.referral_commission_percent / 100` ⚠️ VERIFICAR se há cálculo persistido

### Fluxo E — Admin publica foto no feed → galeria pública

1. Admin em `/admin/gallery` ou `/admin/feed/:postId/edit` → `FeedPostForm`
2. Upload imagens para `feed-media` bucket (admin-only INSERT)
3. INSERT `feed_posts` com `status='published'` + `visibility='public'`
4. INSERT `feed_post_images` linkando ao post
5. Públicos abrem `/gallery`:
   - `gallery_projects` SELECT public_read mostra portfólio "oficial"
   - Em paralelo, `feed_posts` com `visibility='public' AND status='published'` aparecem no Company Feed via RLS `feed_posts_public_read`
6. Para link compartilhável de post não-público: gera `share_token` (uuid) → URL `/shared/:token` → RLS `feed_posts_shared_read` permite

---

## SEÇÃO 17 — VARIÁVEIS DE AMBIENTE E SECRETS

### 17.1 `.env` (publishable — frontend)

| Variável | Uso |
|---|---|
| `VITE_SUPABASE_PROJECT_ID` | `dcfmrqrbsfxvqhihpamd` (referência) |
| `VITE_SUPABASE_URL` | URL do Supabase, usada por `src/integrations/supabase/client.ts` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key, usada pelo client SDK |

> ⚠️ Não há `.env` real editável — esses valores são auto-gerenciados pelo Lovable.

### 17.2 Supabase Secrets (runtime para Edge Functions)

| Secret | Onde é usado | Tipo |
|---|---|---|
| `SUPABASE_URL` | todas edge fns | infra |
| `SUPABASE_ANON_KEY` | edge fns (anon client) + cron `nightly-proof-reminder` (Bearer header) | infra |
| `SUPABASE_PUBLISHABLE_KEY` | infra | infra |
| `SUPABASE_SERVICE_ROLE_KEY` | `invite-team-member`, `collaborator-upload`, `nightly-proof-reminder` | 💰 sensível |
| `SUPABASE_DB_URL` | infra | infra |
| `SUPABASE_JWKS` | infra | infra |
| `RESEND_API_KEY` | `send-follow-up`, `send-notifications`, `nightly-proof-reminder` | externo |
| `TWILIO_ACCOUNT_SID` | `send-notifications` | externo |
| `TWILIO_AUTH_TOKEN` | `send-notifications` | externo |
| `TWILIO_PHONE_NUMBER` | `send-notifications` | externo |
| `NOTION_API_KEY` | `send-to-notion` | externo |
| `NOTION_DATABASE_ID` | `send-to-notion` | externo |
| `FACEBOOK_ACCESS_TOKEN` | `facebook-conversions` | externo (CAPI) |
| `LOVABLE_API_KEY` | infra (managed pelo Lovable, rotaciona via tool dedicada) | infra |

### 17.3 `supabase/config.toml`

```toml
project_id = "dcfmrqrbsfxvqhihpamd"

[functions.collaborator-upload]
verify_jwt = false

[functions.invite-team-member]
verify_jwt = false
```

Outras edge fns rodam com `verify_jwt = true` por default.

### 17.4 Constantes hardcoded no código

| Constante | Local | Valor |
|---|---|---|
| `AXO_ORG_ID` | `src/lib/constants.ts` | `a0000000-0000-0000-0000-000000000001` (tenant singleton) |
| Facebook Pixel ID | `supabase/functions/facebook-conversions/index.ts` | `403151700983838` |
| Phone footer | múltiplas pages | `(732) 351-8653` |
| MAX_FILE_SIZE collaborator upload | `supabase/functions/collaborator-upload/index.ts` | 10 MB |
| Proposal validity default | `useProposalGeneration.ts` | now() + 30 dias |
| Cron nightly proof | `cron.job` | `0 22 * * *` |
| Cron SLA engine | `cron.job` | `0 * * * *` (hourly) |

---

## GAPS IDENTIFICADOS

Itens que o Lovable não conseguiu confirmar com 100% de certeza apenas pelo codebase + introspecção atual. Recomenda-se confirmação humana antes de tomar decisões irreversíveis.

1. **Foreign Keys ausentes:** Nenhuma FK retornou na introspecção das tabelas listadas. Memória `mem://docs/system-audit-baseline` afirma o oposto. Rodar `SELECT conname, conrelid::regclass, confrelid::regclass FROM pg_constraint WHERE contype='f';` para confirmar.

2. **Triggers exatos:** `information_schema.triggers` retornou vazio. Confirmar via `SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE NOT tgisinternal;`. Os triggers descritos foram inferidos das funções existentes + memórias + comportamento documentado.

3. **Indexes:** Não inspecionados — rodar `SELECT * FROM pg_indexes WHERE schemaname='public' ORDER BY tablename;`.

4. **Schema completo de `tasks`:** Recuperação parcial. Conferir todas as colunas + RLS via `\d public.tasks` no psql.

5. **Estrutura interna do Notion DB:** Só visível dentro do dashboard Notion. Propriedades enviadas pelo `send-to-notion` precisam matchar exatamente os property names no Notion.

6. **`projects.referred_by_partner_id` propagação:** Não confirmado se `convert_lead_to_project` copia `leads.referred_by_partner_id` para `projects.referred_by_partner_id`. Olhando o código da função, **não copia** — só lead permanece com a referência. Partner dashboard provavelmente faz join via `lead.converted_to_project_id`.

7. **Cálculo persistido de comissão de partner:** Não há tabela `partner_commissions`. Cálculo pode ser apenas runtime em `PartnerDashboard`. ⚠️ Auditoria fiscal inviável sem persistência.

8. **Lost reason:** Sem campo dedicado em `leads`. Atualmente vai para `notes` ou `follow_up_actions[]`.

9. **`media_anon_read` policy:** Permite anon ler bucket `media` inteiro. Verificar se foi intencional (provavelmente pra signed URLs públicos de catálogo). 💰 Revisar urgência.

10. **UI vs trigger discrepância:** `enforce_job_proof_on_completion` (banco) bloqueia, mas memória diz que UI virou só badge. Frontend deve estar pegando exception silenciosamente ou nunca tenta UPDATE direto pra `completed` sem prova.

11. **Rota partner sem ProtectedRoute:** `/partner/dashboard` faz auth manual. Verificar `PartnerDashboard.tsx` para garantir que redireciona se `partner_users` não bate.

12. **Emails templates:** Tudo inline em edge fns. Não há template engine — copy mudanças exigem deploy de edge function.

13. **Quem gera `share_token` em proposals/invoices:** ⚠️ confirmar se é gerado automaticamente em INSERT (default) ou só quando admin clica "Generate share link". Olhando `useProposalGeneration`, **não gera** automaticamente — admin precisa setar manualmente em algum hook não inspecionado nesta auditoria.

14. **`automation_drips/sequences` execução:** Sem cron consumindo. UI permite criar sequences mas nada dispara o envio. Precisa worker ou trigger dedicado.

15. **`labor_pricing_model='daily'` impact:** Não confirmado completamente como o modo `daily` afeta cálculos no QuickQuote/JobCostEditor. Hook `useCompanySettings` expõe a config mas o uso real precisa ser auditado nos componentes de pricing.

16. **`profile.role` (text)** vs `user_roles.role` (enum app_role) vs `organization_members.role` (enum org_member_role): TRÊS sources de truth para "role". Confirmar qual prevalece em cada decisão de UI.

17. **`SecurityHeaders` via meta tag:** Setar CSP via meta tag tem limitações — nem todos os headers funcionam (ex: `Frame-Options`). Verificar se Lovable envia headers HTTP reais via edge.

---

**FIM DO MASTER DOSSIER 2026.**  
Última atualização: 2026-04-28. Re-gerar sempre que houver mudanças estruturais no schema, novas edge functions, ou novas rotas.
