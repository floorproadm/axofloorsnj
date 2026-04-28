# ADMIN COMPLETE MAP — 2026
> Mapa técnico exaustivo do painel `/admin/*` do AXO OS.
> Documento auto-suficiente, derivado de leitura raw dos 10 arquivos principais + `MASTER_DOSSIER_2026.md`.
> Convenções: 💰 CRÍTICO (receita) · ⚠️ VERIFICAR · 🗑️ LEGADO · 🐞 BUG.

---

## 1. SHELL ADMIN

### 1.1 Componentes do shell
| Camada | Arquivo | Função |
|---|---|---|
| Router | `src/App.tsx` | `BrowserRouter` + `Routes`. Todas as rotas `/admin/*` são wrap-adas em `<ProtectedRoute>` |
| Guard | `src/components/shared/ProtectedRoute.tsx` | Verifica `useAuth()` + RPC `has_role(user_id, 'admin')`. Redireciona p/ `/admin/auth` se falhar |
| Layout | `src/components/admin/AdminLayout.tsx` | `SidebarProvider` + `AdminSidebar` + header c/ breadcrumbs + slot |
| PWA Head | `src/components/admin/AdminPWAHead.tsx` | Injeta `admin-manifest.json` + `admin-sw.js` no `<head>` quando rota começa com `/admin` |
| Bottom Nav | `src/components/admin/MobileBottomNav.tsx` | Bottom dock c/ FAB central (mobile + desktop, conforme memória `global-bottom-nav-system`) |
| Security Headers | `src/components/SecurityHeaders.tsx` | CSP, X-Frame-Options |

### 1.2 Sequência de boot
```
main.tsx
  └── <App>
       └── QueryClientProvider
            └── AuthProvider                  (Supabase session)
                 └── LanguageProvider         (pt | en)
                      └── TooltipProvider
                           └── BrowserRouter
                                ├── SecurityHeaders
                                ├── ScrollToTop
                                └── Routes
                                     └── /admin/* → ProtectedRoute → Page → AdminLayout
```

### 1.3 ProtectedRoute — fluxo real
```ts
useAuth() → user, loading
useEffect: supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' })
loading || checkingRole  → spinner
!user                    → <Navigate to="/admin/auth"/>
requireAdmin && !isAdmin → <Navigate to="/admin/auth"/>
default                  → children
```
Estado interno: `isAdmin: boolean | null` + `checkingRole: boolean`. Cancela request se desmontar.

### 1.4 PWA standalone (memória `admin-pwa-standalone`)
- `public/admin-manifest.json` — `start_url: /admin`, `display: standalone`, `scope: /admin/`
- `public/admin-sw.js` — service worker dedicado
- `/admin/auth` é a saída forçada para evitar que iOS PWA abra link externo

### 1.5 Status do alegado "bug /mission-control fora do guard"
🐞 **NÃO REPRODUZIDO** — `App.tsx` linhas 175–179:
```tsx
<Route path="/admin/mission-control" element={
  <ProtectedRoute>
    <AdminMissionControl />
  </ProtectedRoute>
} />
```
A rota **está** dentro de `ProtectedRoute`. Se um agente externo viu o oposto, é leitura desatualizada. Manter monitoramento.

---

## 2. NAVEGAÇÃO

### 2.1 AdminSidebar — todos os paths
Fonte: `src/components/admin/AdminSidebar.tsx`.

**Top (sem label)**
| Título | URL | Ícone |
|---|---|---|
| Home | `/admin/dashboard` | `LayoutDashboard` |
| Schedule | `/admin/schedule` | `CalendarDays` |
| Projects | `/admin/projects` | `FolderKanban` |
| Pagamentos | `/admin/payments` | `DollarSign` |
| Performance | `/admin/performance` | `BarChart3` |

**Tools**
| Título | URL | Ícone |
|---|---|---|
| Mission Control | `/admin/mission-control` | `Target` |
| Captação | `/admin/intake` | `Inbox` |
| Leads & Vendas | `/admin/leads` | `Users` |
| Medições | `/admin/measurements` | `Ruler` |
| Propostas | `/admin/proposals` | `FileText` |

**Manage**
| Título | URL | Ícone |
|---|---|---|
| Partners | `/admin/partners` | `Handshake` |
| Crews & Fleet | `/admin/crews` | `Truck` |
| Catálogo | `/admin/catalog` | `BookOpen` |
| Gallery | `/admin/gallery` | `Images` |
| Automations | `/admin/automations` | `Zap` |

**Footer**
| Título | URL | Ícone |
|---|---|---|
| Ajuda | `/admin/help` | `HelpCircle` |
| Settings | `/admin/settings` | `Settings` |

⚠️ **Itens com rota mas sem entrada no sidebar**: `weekly-review`, `labor-payroll`, `jobs/:jobId`, `leads/:leadId`, `projects/:projectId`, `feed/:postId`, `feed/:postId/edit`. Acessados via deep-link / botões internos.

🐞 **Logo bug** — `AdminSidebar.tsx:51-62`: lê `logo_url` da `company_settings`, faz `createSignedUrl` no bucket `media`. Se path for absoluto/URL pública, o signing falha em silêncio. Mesmo bug em `BrandingSettings` (cf. seção 11).

### 2.2 MobileBottomNav (FAB)
Memória `global-bottom-nav-system`: dock fixo bottom em mobile **e** desktop. Botão central FAB para criação rápida (Lead/Job/Partner). Itens típicos: Home · Leads · [+] · Projects · More.

### 2.3 Redirects fixos
| De | Para |
|---|---|
| `/admin/jobs` | `/admin/projects` (App.tsx:169) |
| `/partner` | `/partner/dashboard` |

---

## 3. DASHBOARD

Arquivo: `src/pages/admin/Dashboard.tsx`. Hook único: `useDashboardData()`.

### 3.1 RPC `get_dashboard_metrics` 💰 CRÍTICO
Substitui 5 queries paralelas. Retorna shape:
```ts
{
  pipeline:  PipelineMetric[]   // status, total, last_30d, avg_days_in_pipeline
  financial: {
    active_jobs, completed_jobs,
    pipeline_value, total_profit, total_revenue,
    avg_margin_30d, conversion_rate_30d, avg_cycle_days
  }
  aging_top10: AgingLead[]       // lead_id, name, status, days_in_pipeline, action_overdue
  money: { activeLeadsCount, estimatedValueOpen }
  alerts: {
    proposalWithoutFollowUp[], newLeadsNoContact24h[], leadsStalled48h[]
  }
  slaBreaches: {
    followupOverdue: { count, items[] }
    estimateStale:   { count, items[] }
  }
  recentFieldUploads: RecentFieldUpload[]   // últimos uploads de campo
  recentSystemActions: SystemAction[]       // escalações automáticas SLA Engine
}
```
Cache: `refetchInterval: 60s`, `staleTime: 30s`.

### 3.2 Derivações em `useDashboardData`
- `funnelMetrics`: itera `pipeline[]` e mapeia para 10 buckets fixos (`cold_lead..lost`).
- `pipelineBottleneck`: stage cuja `total > 2× média` **e** `>= 5`.
- `criticalAlerts.hasNoCriticalIssues`: AND lógico (zero alertas + sem bottleneck).
- `marginHealth.hasData`: `completed_jobs > 0`.

### 3.3 Componentes da página Dashboard
- `MetricCard` (multiplo) — KPIs: leads ativos, valor aberto, margin, jobs ativos.
- `MissionControl` (resumo, com link para página dedicada).
- `AgendaSection` — próximos appointments.
- `ActionableAlertsSection` — alertas acionáveis.
- `TensionMetricsCards` — tensões (margens baixas, leads parados).
- `StatsCards` — pipeline counters.
- `PriorityTasksList` — tasks de Mission Control resumidas.

---

## 4. MISSION CONTROL

Arquivo: `src/pages/admin/MissionControl.tsx`. Componente core: `src/components/admin/dashboard/MissionControl.tsx`.

### 4.1 Origem das tarefas
Reusa `useDashboardData()` e monta lista `priorityTasks` em `useMemo`. Tipos:
| `type` | Origem | Cor | Link |
|---|---|---|---|
| `sla_auto_escalation` | `recentSystemActions.length` | risk | `/admin/leads` |
| `sla_followup` | `slaBreaches.followupOverdue.count` | blocked | `/admin/leads?status=proposal_sent` |
| `sla_estimate` | `slaBreaches.estimateStale.count` | risk | `/admin/leads?status=estimate_scheduled` |
| `field_upload` | `recentFieldUploads.length` | success | `/admin/jobs` |
| `follow_up` | `criticalAlerts.proposalWithoutFollowUp[]` | blocked | `/admin/leads?status=proposal_sent` |
| `new_lead` | `criticalAlerts.newLeadsNoContact24h[]` | risk | `/admin/leads?status=cold_lead` |
| `stalled` | `criticalAlerts.leadsStalled48h[]` | blocked | `/admin/leads` |

### 4.2 Tasks manuais — schema `tasks`
Hook: `src/hooks/useTasks.ts`. Tabela: `tasks` (multi-tenant, `organization_id` = `AXO_ORG_ID`).
```sql
tasks (
  id uuid pk,
  title text,
  description text,
  status text,                 -- 'todo' | 'in_progress' | 'done'
  priority text,               -- 'low' | 'medium' | 'high'
  assigned_to uuid,            -- profiles.user_id
  related_project_id uuid,
  related_lead_id uuid,
  related_partner_id uuid,
  due_date timestamptz,
  created_by uuid,
  completed_at timestamptz,
  organization_id uuid,
  created_at, updated_at
)
```
Joins manuais (sem FK formal): `profiles.user_id` → `assignee_name`; `partners.id` → `partner_name`.
Auto-set: ao mudar status para `done`, seta `completed_at = now()`; revertendo, zera.

### 4.3 Status do guard
✅ Página **está** sob `ProtectedRoute` (App.tsx:175-179). O comentário do briefing está desatualizado.

---

## 5. LEADS MANAGER

Arquivo: `src/pages/admin/LeadsManager.tsx` + `src/pages/admin/components/LinearPipeline.tsx`.

### 5.1 Arquitetura
- Página é wrapper fino. Lê `?status=` da URL → normaliza via `normalizeStatus()` de `useLeadPipeline.ts` → passa como `statusFilter` para `LinearPipeline`.
- Stages válidos para sales (`SALES_STAGES`): `cold_lead`, `warm_lead`, `estimate_requested`, `estimate_scheduled`, `in_draft`, `proposal_sent`, `proposal_rejected` (7 cols visíveis no Sales view; pipeline DB tem 10).

### 5.2 Views (LinearPipeline)
1. **Kanban** — drag/drop entre estágios; cada coluna mostra count + valor estimado.
2. **Lista densa** — tabela tabular fonts, status dot, NRA badge.
3. **Mission/aging** — agrupa por `days_in_pipeline`.

### 5.3 Pipeline DB — 10 estágios canônicos
```
cold_lead → warm_lead → estimate_requested → estimate_scheduled
  → in_draft → proposal_sent
       ├─→ proposal_rejected
       └─→ in_production → completed
                 (lost em qualquer ponto)
```

### 5.4 Gates de transição (RPC `transition_lead_status`)
Documentados em `MASTER_DOSSIER_2026.md` §6. Resumo:
| De → Para | Gate |
|---|---|
| `cold_lead → warm_lead` | contato registrado (`last_contact_at not null`) |
| `warm_lead → estimate_requested` | endereço obrigatório (memória `appointment-address-enforcement`) |
| `estimate_requested → estimate_scheduled` | appointment criado |
| `estimate_scheduled → in_draft` | medição (`project_measurements`) existe |
| `in_draft → proposal_sent` | RPC `validate_proposal_margin` aprova (margin ≥ `company_settings.default_margin_min_percent`) 💰 CRÍTICO |
| `proposal_sent → in_production` | proposal `accepted` + projeto criado via `convert_lead_to_project` |
| `* → lost` | livre |

### 5.5 LeadDetail (`src/pages/admin/LeadDetail.tsx`) — tabs
- Visão geral / NRA
- Atividades / timeline
- Notas + anexos (memória `lead-notes-attachments`)
- Conversão → projeto (`useLeadConversion.convertLeadToProject`)
- Source / canal

### 5.6 QuickQuoteSheet
`src/components/admin/QuickQuoteSheet.tsx`. 3 passos: cria Customer + Project + Proposal numa transação (memória `quick-quote-lead-automation`).

---

## 6. PROJECTS HUB

Arquivo: `src/pages/admin/ProjectsHub.tsx`. Hook: `useProjectsHub()`.

### 6.1 Query principal — joins
```sql
projects
  ├─ job_costs (estimated_revenue, total_cost, margin_percent)   -- LEFT join
  ├─ partners as referred_by_partner_id (contact_name, company_name)
  └─ project_members (user_id, role)
       └─ profiles (full_name, avatar_url)   -- fetched separately, no FK
```
Profiles fetch: `userIds` deduplicados → `IN` query → Map → injetado em cada `members[]`.

### 6.2 Outras queries do hub
| Query Key | Tabela | Limit |
|---|---|---|
| `hub-pending-proposals` | `proposals` (status=accepted) | 20 |
| `hub-measurements` | `project_measurements` | 8 |
| `hub-material-costs` | `material_costs` | 8 |
| `hub-labor-entries` | `labor_entries` | 8 |
| `hub-weekly-review` | `weekly_reviews` (org=AXO_ORG_ID) | 1 (último) |

### 6.3 Pipeline counts (derivado)
```ts
pending     = projects.where(status='pending')
in_progress = status in ('in_production','in_progress')
completed   = status='completed'
```

### 6.4 Risk score (memória `operational-risk-scoring`)
0–4+ baseado em: margin abaixo do mínimo, lead sem contato, sem fotos, dias estagnado.
```
score = (margin < min ? 1 : 0)
      + (no_contact_24h ? 1 : 0)
      + (no_photos ? 1 : 0)
      + (stagnant_7d ? 1 : 0)
      + (over_budget ? 1 : 0)
```

### 6.5 ProjectDetailPanel
Side sheet (memória `projects-hub-cockpit`). Aciona em click em card; mostra resumo + ação "Open Full Details" → `/admin/projects/:projectId` → `ProjectDetail.tsx` (página completa com fallback para projetos sem endereço, edição inline; memória `sidebar-detail-management-pattern`).

---

## 7. JOB DETAIL (1146 linhas) 💰 CRÍTICO

Arquivo: `src/pages/admin/JobDetail.tsx`. Layout: Linear/Notion dark, "Read-first / Edit-by-section" (memória `job-detail-notion-layout`).

### 7.1 Hooks consumidos (14)
1. `useJobCosts` — header financeiro
2. `useJobCostItems` — linhas de custo
3. `useMaterialCosts` — materiais
4. `useLaborEntries` — labor
5. `useMeasurements` — sqft / steps
6. `useJobProof` — uploads de prova de execução
7. `useInvoices` — invoices vinculadas
8. `usePayments` — recebimentos
9. `useProposals` — propostas do projeto
10. `useProjectDocuments` — biblioteca de docs
11. `useProjectActivity` — timeline
12. `useProjectSignals` — signals NRA / risk
13. `useTasks` — tasks do projeto
14. `useNotifications` — feed de eventos

### 7.2 Tabs (5)
| Tab | Conteúdo |
|---|---|
| Overview | Header (`JobFinancialHeader`), Next Action banner, signals |
| Financials | `JobCostEditor`, `JobMarginDisplay`, `InvoicesPaymentsSection` |
| Documents | Sidebar com Uploads/Proposals (memória `documents-sidebar-organization`) |
| Field | `JobProofUploader`, `JobChecklist`, fotos por etapa |
| Activity | Comentários (`project_comments`), chat (`ProjectChatPanel`) |

### 7.3 Cadeia financeira 💰 CRÍTICO
```
material_costs ─┐
                ├─► trigger DB ─► job_costs.total_cost
labor_entries ──┘                       │
                                        ├─► margin_percent = (revenue - cost)/revenue * 100
                                        └─► used by validate_proposal_margin
proposals.selected_tier.price ─► job_costs.estimated_revenue
invoices ─► payments ─► aging
```

### 7.4 ProposalGenerator flow
Componente: `src/components/admin/ProposalGenerator.tsx`. Steps:
1. Lê `job_costs.total_cost` + `company_settings.default_margin_min_percent`.
2. Calcula tiers G/B/B: `price = ceil(cost / (1 - tierMargin/100))`.
3. Toggle Tiers/Direct (memória `proposals-tiers-vs-direct-mode`).
4. Pré-validação client-side; envio chama `validateProposalMargin(projectId)` (`useProposalValidation.ts`).
5. Se `can_send=false`: BLOQUEIA + audit log automático.
6. Cria `proposals` row + `proposal_signatures` placeholder.
7. Gera token público para `/proposal/:token`.

### 7.5 Pipeline livre vs gates
Memória `linear-pipeline-enforcement`: stages `Planning, In Progress, Completed, Awaiting Payment, Paid` com **transições livres** (filosofia operational dominance). Gates DURO somente em proposal margin.

### 7.6 Inline invoice creation
Memória `inline-invoice-creation`: invoice criada de dentro do JobDetail; segue padrão 30/40/30 (`invoicing-governance-standard`).

---

## 8. PROPOSALS (1042 linhas)

Arquivo: `src/pages/admin/Proposals.tsx`. Board: `src/components/admin/proposals/ProposalPipelineBoard.tsx`.

### 8.1 Kanban — 5 colunas
```
draft → sent → viewed → accepted | rejected
                                  └── (rejected fica em coluna separada, reativável)
```

### 8.2 Anatomia ProposalCard
- Header: `proposal_number`, customer_name, project_type
- Tier badge (Good/Better/Best) ou "Direct" com line items breakdown
- Preço selecionado (`selected_tier ? *_price : direct_total`)
- Margin chip (verde/âmbar/vermelho vs `default_margin_min_percent`)
- Status footer: dias desde envio, viewed_at, signed_at
- Realtime view tracking (memória `invoicing-governance-standard` → mesma stack)

### 8.3 ProposalGenerator — steps detalhados
1. Selecionar projeto (com `job_costs` validado)
2. Modo: Tiers (G/B/B) | Direct (preço único + line items)
3. Margem alvo por tier (default constants + override de company)
4. Preview PDF
5. Validação: `canSendProposal()` → booleano
6. Envio: cria row + signature placeholder + envia email/WhatsApp opcional
7. Token público gerado

### 8.4 Schema `proposal_signatures`
```sql
proposal_signatures (
  id uuid pk,
  proposal_id uuid fk,
  signer_name text,
  signer_email text,
  signature_data text,        -- base64 canvas
  signed_at timestamptz,
  ip_address inet,
  user_agent text,
  status text                 -- 'pending' | 'signed' | 'declined'
)
```
Trigger: ao `signed_at IS NOT NULL` → atualiza `proposals.status = 'accepted'` + audit log.

### 8.5 Toggle Tiers/Direct
Memória `proposals-tiers-vs-direct-mode`. Direct mode mostra um `direct_total` único + breakdown; Tiers mostra G/B/B com toggle de `selected_tier`.

---

## 9. PAYMENTS (506 linhas)

Arquivo: `src/pages/admin/Payments.tsx`. Hook: `usePayments()`.

### 9.1 3 Categorias (memória `payments/hub-governance-ux`)
| Categoria | Origem |
|---|---|
| **Income** | `payments` linkados a `invoices` (recebimentos de cliente) |
| **Payroll** | `labor_entries` (labor) — também na página LaborPayroll |
| **Expense** | `material_costs` + outras despesas |

### 9.2 Summary cards
- Total Recebido (mês) — `sum(payments.amount)` filtrado por `received_at`
- A Receber (open) — `invoices.balance_due`
- Payroll devido — `labor_entries.where(is_paid=false).sum(total_cost)`
- Materiais não pagos — `material_costs.where(is_paid=false).sum(amount)`

### 9.3 PaymentDialog — campos
| Campo | Tipo | Notas |
|---|---|---|
| invoice_id | select | filtra invoices `unpaid/partial` |
| amount | number | ≤ `balance_due` |
| method | enum | cash/check/zelle/credit_card/ach |
| reference | text | nº cheque, transação, etc. |
| received_at | date | default hoje |
| notes | textarea | opcional |

### 9.4 Query usePayments
```sql
payments
  ├─ invoices (invoice_number, project_id, balance_due)
  └─ projects (customer_name)
order by received_at desc
```

---

## 10. LABOR PAYROLL

Arquivo: `src/pages/admin/LaborPayroll.tsx`. Hook: `useLaborEntries()`.

### 10.1 Views (2)
1. **Por trabalhador** — agrupado por `worker_name`, soma `total_cost`, % pago.
2. **Por projeto** — agrupado por `project_id`, mostra labor cost vs revenue.

### 10.2 Schema `labor_entries`
```sql
labor_entries (
  id uuid pk,
  project_id uuid fk,
  worker_name text,
  role text,                  -- 'installer'|'sander'|'helper'|...
  daily_rate numeric,
  days_worked numeric,
  total_cost numeric,         -- = daily_rate * days_worked (trigger)
  work_date date,
  is_paid boolean default false,
  paid_at timestamptz,
  payment_method text,
  organization_id uuid,
  created_at
)
```
Trigger DB: `total_cost := daily_rate * days_worked` antes do insert/update; também recalcula `job_costs.total_cost` do projeto.

### 10.3 Payroll summary
- Total devido (sum onde `is_paid=false`)
- Total pago (mês corrente)
- Por worker: total + nº dias + % pagamento

### 10.4 Mark as paid flow
1. Usuário marca uma ou múltiplas entries.
2. Update batch: `is_paid=true`, `paid_at=now()`, `payment_method=...`.
3. Trigger não recalcula `job_costs` (custo já está computado).
4. Invalida `hub-labor-entries` query.

---

## 11. SETTINGS

Arquivo: `src/pages/admin/Settings.tsx`. 4 sections via vertical sidebar.

### 11.1 Tabs
| ID | Componente | Descrição |
|---|---|---|
| `general` | `GeneralSettings` | company_settings (margem mínima, budgets, defaults) |
| `branding` | `BrandingSettings` | logo, cores, marca |
| `team` | `TeamSettings` | invites + roles via `invite-team-member` edge fn |
| `language` | inline `LanguageSettings` | toggle pt/en (`useLanguage`) |

### 11.2 GeneralSettings — campos
- `default_margin_min_percent` (gate de proposals 💰)
- `min_budget_refinishing` (default $1,800 — memória `minimum-project-budgets`)
- `min_budget_installation` (default $3,500)
- `default_invoice_schedule` (30/40/30)
- `company_name`, `company_address`, `company_phone`, `company_email`

### 11.3 BrandingSettings — `resolveLogoUrl` 🐞 BUG
Mesmo defeito do AdminSidebar: usa `supabase.storage.from('media').createSignedUrl(path, 3600)` assumindo que `logo_url` é **sempre** path relativo. Se o upload salvou URL pública (público bucket ou link externo), o signing falha sem fallback. **Correção sugerida**: detectar prefixo `http(s)://` e retornar como-está.

### 11.4 TeamSettings
- Lista membros via `organization_members` join `profiles`
- Convite chama edge function `invite-team-member` (requer SMTP custom — memória `team-invitation-system`)
- Roles: `admin`, `manager`, `collaborator` (via `user_roles` + `organization_members`)

### 11.5 company_settings — singleton
Tabela com **uma única row por organização**. Lookup: `.limit(1).maybeSingle()`. RLS: somente admin escreve.

---

## 12. PERFORMANCE

Arquivo: `src/pages/admin/Performance.tsx`. Hook: `usePerformanceData()`.

### 12.1 Filtro core
**SOMENTE projetos com `project_status = 'completed'`** (memória `performance-monitoring-hub`). Excluí em-andamento para não distorcer médias.

### 12.2 Charts (recharts)
- Revenue/profit por mês — BarChart
- Margin trend — LineChart
- Jobs completos por tipo (Install vs Refinish vs Stairs) — PieChart
- Top customers — table

### 12.3 weekly_reviews snapshots
Tabela `weekly_reviews` (memória `governance/persistent-weekly-governance`):
```sql
weekly_reviews (
  id, organization_id,
  week_start, week_end,
  total_revenue, total_profit, avg_margin,
  jobs_completed,
  status,                     -- 'open'|'closed'
  closed_by, closed_at
)
```
Snapshot é gerado pela ação "Close Week" (página `/admin/weekly-review`).

---

## 13. MÓDULOS SECUNDÁRIOS

| Página | Arquivo | Função |
|---|---|---|
| **Schedule** | `Schedule.tsx` | Day/List/Week views de appointments. `appointment_assignees` table (memória `schedule/appointment-management-logic`) |
| **Catalog** | `Catalog.tsx` | Service catalog: pricing por unit/step. Order: Install > Sanding > Stairs > Repair > Add-ons (memória `service-catalog-structure`) |
| **Partners** | `Partners.tsx` | Kanban 6 estágios B2B (memória `partners/management-ecosystem-standard`). Componentes: `PartnerPipelineBoard`, `PartnerDetailPanel`, `InvitePartnerDialog` |
| **Automations** | `Automations.tsx` | 30-day drips SMS/Email/WhatsApp. Componentes: `StageFlowList`, `SequenceDetail`, `DripEditor` |
| **Gallery** | `GalleryHub.tsx` + `GalleryManager.tsx` | Folders + media multi-tenant (memória `media-engine-content-ecosystem`) |
| **Measurements** | `MeasurementsManager.tsx` | sqft + steps; stairs ≠ sqft (memória `measurements-module-units`) |
| **Crews** | `CrewsVans.tsx` | Centraliza Fleet, Crews, Payroll (memória `management/crews-and-payroll-hub`) |
| **WeeklyReview** | `WeeklyReview.tsx` | Snapshot semanal → `weekly_reviews` |
| **Intake** | `Intake.tsx` | Hub central de captação, 4-col grid + canal performance (memória `leads/intake-central-hub`) |
| **Help** | `Help.tsx` | Documentação interna estática |

---

## 14. MAPA DE RELAÇÕES (ASCII)

```
                   ┌──────────────┐
                   │     LEAD     │  status: 10 stages
                   └──────┬───────┘
                          │ convert_lead_to_project (RPC)
                          ▼
              ┌───────────────────────┐
              │       CUSTOMER        │ (created or matched)
              └───────────┬───────────┘
                          │ 1:N
                          ▼
              ┌───────────────────────┐         ┌───────────────────────┐
              │        PROJECT        │◄────────┤   PROJECT_MEMBERS     │
              │ status: planning..paid│         └───────────────────────┘
              └───────────┬───────────┘
                          │ 1:1
                          ▼
              ┌───────────────────────┐
              │       JOB_COSTS       │  estimated_revenue, total_cost, margin_percent
              └────┬─────────┬────────┘
                   │         │ aggregated by triggers
                   │         ├─────────────────────────┐
                   │         ▼                         ▼
                   │  ┌──────────────┐         ┌──────────────┐
                   │  │MATERIAL_COSTS│         │LABOR_ENTRIES │
                   │  └──────────────┘         └──────────────┘
                   │
                   ▼
              ┌───────────────────────┐
              │       PROPOSALS       │ G/B/B or Direct, margin gate
              └───────────┬───────────┘
                          │ accepted
                          ▼
              ┌───────────────────────┐         ┌──────────────────────┐
              │       INVOICES        │────────►│PROPOSAL_SIGNATURES   │
              │ schedule 30/40/30     │         └──────────────────────┘
              └───────────┬───────────┘
                          │ 1:N
                          ▼
              ┌───────────────────────┐
              │       PAYMENTS        │  income side
              └───────────────────────┘

   Side branches:
   PROJECT ─► PROJECT_COMMENTS, PROJECT_MEASUREMENTS, JOB_PROOF, PROJECT_DOCUMENTS, TASKS, APPOINTMENTS
   LEAD    ─► LEAD_NOTES, APPOINTMENTS, AUDIT_LOG (sla escalations)
   PARTNER ─► PROJECTS.referred_by_partner_id, REFERRAL_COMMISSIONS
```

---

## 15. MATRIZ DE PERMISSÕES

| Recurso | Admin | Collaborator | Partner | Anon |
|---|---|---|---|---|
| `/admin/*` | ✅ | ❌ | ❌ | ❌ |
| `/collaborator/*` | ✅ | ✅ | ❌ | ❌ |
| `/partner/dashboard` | ✅ | ❌ | ✅ | ❌ |
| `leads` (CRUD) | ✅ | read próprios | own referrals | insert via form público |
| `projects` (CRUD) | ✅ | read assigned | read referred | ❌ |
| `job_costs` | ✅ | ❌ | ❌ | ❌ |
| `proposals` | ✅ | ❌ | ❌ | read via token |
| `invoices` | ✅ | ❌ | ❌ | read via token |
| `payments` | ✅ | ❌ | ❌ | ❌ |
| `material_costs` | ✅ | insert (request) | ❌ | ❌ |
| `labor_entries` | ✅ | ❌ | ❌ | ❌ |
| `tasks` | ✅ | assigned | ❌ | ❌ |
| `media (storage)` | ✅ | upload via edge fn | ❌ | ⚠️ read (bug do bucket) |
| `company_settings` | ✅ | read | ❌ | ❌ |
| `partners` | ✅ | ❌ | self | ❌ |
| `tasks status=done` | ✅ | assigned | ❌ | ❌ |

Mecanismos: `user_roles` (global) + `organization_members` (tenant) + RLS RESTRICTIVE em buckets sensíveis (memória `collaborator-portal-security`).

---

## 16. DATA FLOW GLOBAL

```
[ENTRADA]
  ├── Floor Diagnostic (/floor-diagnostic) ─► leads INSERT (status=cold_lead) ─► trigger send-to-notion
  ├── Project Wizard (/project-wizard)     ─► leads INSERT
  ├── Quick Quote (admin)                  ─► customers + projects + proposals (RPC)
  ├── Partner referral                     ─► leads (referred_by_partner_id)
  └── Manual lead                          ─► NewLeadDialog

[CONVERSÃO]
  Lead (cold→warm→...→in_draft)
    ├── transition_lead_status (RPC)         gates por stage
    ├── SLA Engine (pg_cron hourly: run_sla_engine)  escala priority em alertas
    └── convert_lead_to_project (RPC):
          ├── INSERT customers (or match)
          ├── INSERT projects (status=planning)
          ├── INSERT job_costs (defaults)
          └── audit_log entry

[OPERAÇÃO]
  Project
    ├── project_measurements   → atualiza job_costs.estimated_revenue
    ├── ProposalGenerator      → validate_proposal_margin (RPC) → BLOCK if low
    │                          → INSERT proposals + proposal_signatures
    │                          → token público /proposal/:token
    ├── PROPOSAL accepted      → trigger atualiza project_status='in_production'
    └── INSERT invoices (schedule 30/40/30) → token público /invoice/:token

[EXECUÇÃO]
  Project in_production
    ├── labor_entries INSERT   → trigger recalcula job_costs.total_cost / margin_percent
    ├── material_costs INSERT  → mesmo trigger
    ├── job_proof uploads      → bucket job-proof
    ├── collaborator-upload (edge fn)  → field uploads → field_upload tasks
    ├── project_comments       → realtime
    └── ProjectChatPanel       → channel postgres_changes

[FECHAMENTO]
  ├── INSERT payments (várias)        → invoices.balance_due decreases
  ├── status: in_production → completed  (livre, com badge "Missing Proof" se aplicável)
  ├── status: completed → awaiting_payment → paid
  └── Weekly Review "Close Week" → snapshot weekly_reviews

[EDGE FUNCTIONS]
  - send-to-notion           sync de leads p/ Notion (memória notion-lead-sync)
  - send-follow-up           SMS/Email follow-up
  - send-notifications       push de notifications
  - facebook-conversions     Facebook CAPI server-side
  - invite-team-member       SMTP custom
  - collaborator-upload      uploads campo
  - nightly-proof-reminder   cron: lembra fotos faltantes
```

---

## 17. GAPS E DÉBITOS TÉCNICOS (19 itens)

| # | Item | Severidade | Origem |
|---|---|---|---|
| 1 | Bucket `media` permite read anônimo apesar de privado | 🔴 ALTA | MASTER_DOSSIER §Storage |
| 2 | `resolveLogoUrl` falha quando `logo_url` é URL absoluta (BrandingSettings + AdminSidebar) | 🟡 MÉDIA | Seções 2 e 11 |
| 3 | UI badge "Missing Proof" mas trigger backend não força | 🟡 MÉDIA | MASTER_DOSSIER §Job |
| 4 | Páginas `weekly-review`, `labor-payroll` sem entrada na sidebar | 🟢 BAIXA | Seção 2 |
| 5 | `tasks` table acessada via `as any` (sem types fortes) | 🟢 BAIXA | useTasks |
| 6 | Sem FK formal `tasks.assigned_to → profiles.user_id` | 🟡 MÉDIA | useTasks |
| 7 | Sem FK `project_members.user_id → profiles.user_id` | 🟡 MÉDIA | useProjectsHub |
| 8 | `AXO_ORG_ID` hardcoded em queries (bloqueador multi-tenant) | 🔴 ALTA | useProjectsHub, useTasks |
| 9 | `Dashboard.tsx` retorna campos vazios (`leads:[]`, `projects:[]`, `companySettings:null`) — legado | 🗑️ LEGADO | useDashboardData |
| 10 | RPC `get_dashboard_metrics` não filtra por org | 🔴 ALTA | Multi-tenancy |
| 11 | `validate_proposal_margin` só valida margem; não valida budget mínimo | 🟡 MÉDIA | useProposalValidation |
| 12 | Sem retry/circuit breaker em edge fns externas (Notion, Facebook) | 🟡 MÉDIA | Edge fns |
| 13 | `proposal_signatures` permite múltiplas signed sem trigger único | 🟡 MÉDIA | Schema |
| 14 | `LinearPipeline` não persiste filtros entre navegações | 🟢 BAIXA | LeadsManager |
| 15 | Mission Control não permite criar task direto (só lista) | 🟡 MÉDIA | MissionControl page |
| 16 | Sem diff/audit em mudanças de `company_settings` | 🟡 MÉDIA | Settings |
| 17 | `useProjectsHub` faz N+1 em profiles (dois roundtrips em vez de view) | 🟢 BAIXA | useProjectsHub |
| 18 | Erros de RPC viram toast genérico (sem error code mapping) | 🟢 BAIXA | useLeadConversion |
| 19 | Performance só lê `completed`; jobs `paid` ficam fora de gráficos | ⚠️ VERIFICAR | Performance |

---

## 18. SPRINT READINESS — MULTI-TENANCY (FloorPro)

### 18.1 Bloqueadores `AXO_ORG_ID`
```
src/lib/constants.ts                        ← origem da const
src/hooks/useTasks.ts                       INSERT tasks
src/hooks/useProjectsHub.ts                 weekly_reviews lookup
src/hooks/useCompanySettings.ts             ⚠️ verificar
src/hooks/useWeeklyReviews.ts               ⚠️ verificar
RPC get_dashboard_metrics                   sem param org
RPC convert_lead_to_project                 ⚠️ verificar param
RPC transition_lead_status                  ⚠️ verificar param
RPC validate_proposal_margin                ⚠️ verificar param
RPC run_sla_engine                          itera só AXO org
```
Total estimado: ~15 ocorrências diretas + ~8 RPCs.

### 18.2 O que JÁ existe
- ✅ Tabela `organization_members` + helper `get_user_org_id()` (memória `multi-tenant-membership-rbac`)
- ✅ RLS por `organization_id` na maioria das tabelas core
- ✅ Buckets storage com prefix `org_id/...` em algumas (parcial)
- ✅ `AXO_ORG_ID` é constante única — fácil de identificar/substituir
- ✅ Roles `app_role` enum + `has_role(user_id, role)` SECURITY DEFINER
- ✅ Auth scoped portals (`/admin/auth`, `/auth`, `/partner/auth`)

### 18.3 5 Sprints sugeridos para FloorPro

**Sprint 1 — Foundation (1 semana)**
- Substituir `AXO_ORG_ID` por `useCurrentOrg()` hook (lê de `organization_members` do user)
- Atualizar `useTasks`, `useProjectsHub`, `useWeeklyReviews`, `useCompanySettings`
- Adicionar `org_id` param em todas as RPCs core

**Sprint 2 — RPC isolation (1 semana)**
- `get_dashboard_metrics(org_id uuid)` — filtrar internamente
- `run_sla_engine` — loopar todas orgs ativas
- `convert_lead_to_project` — derivar org do lead
- `validate_proposal_margin` — derivar do projeto

**Sprint 3 — Storage isolation (1 semana)**
- Refator de buckets para prefix obrigatório `org_id/`
- RLS RESTRICTIVE em buckets `media`, `gallery`, `job-proof`, `documents`
- Fixar bug bucket `media` anônimo (gap #1)
- Migration script para mover assets existentes

**Sprint 4 — Branding dinâmico (1 semana)**
- `BrandingSettings` por org (logo, cores, nome)
- Substituir literais "AXO" / "AXO OS" por `org.brand_name`
- Resolver bug `resolveLogoUrl` (gap #2)
- Theme injection runtime via CSS vars de `company_settings.brand_palette`

**Sprint 5 — Onboarding & billing (1–2 semanas)**
- Fluxo de signup de nova organização (`/signup-org`)
- Stripe billing por org (subscription)
- Trial 14 dias + paywall em features Pro
- Admin meta-painel cross-org (super-admin only)
- Dashboard FloorPro: lista de tenants, métricas agregadas

**Total estimado**: 5–6 semanas para FloorPro V1 white-label funcional.

---

## ⚠️ NOTA FINAL

Este documento foi gerado a partir de leitura raw dos arquivos:
- `src/App.tsx`, `src/components/admin/AdminSidebar.tsx`, `src/components/shared/ProtectedRoute.tsx`
- `src/pages/admin/{Dashboard,LeadsManager,ProjectsHub,JobDetail,Proposals,Payments,MissionControl,Settings,Performance,LaborPayroll}.tsx`
- `src/hooks/{useDashboardData,useTasks,useProjectsHub,useProposalValidation,useLeadConversion}.ts`
- `docs/MASTER_DOSSIER_2026.md`
- Memórias do projeto (`mem://`)

Itens marcados ⚠️ VERIFICAR exigem confirmação humana. Itens 🐞 BUG são reproduzíveis e prontos para fix. Itens 🔴 ALTA bloqueiam sprint multi-tenancy.
