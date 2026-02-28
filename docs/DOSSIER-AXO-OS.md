# DOSSIER TÉCNICO: AXO OS (FloorPro OS)

> **Gerado em**: 2026-02-28  
> **Propósito**: Knowledge base para agentes externos (Antigravity, Claude Code)  
> **Status**: ✅ ATIVO  

---

## 1. SYSTEM IDENTITY

| Item | Valor |
|------|-------|
| **Nome** | AXO OS (transicionando para FloorPro OS) |
| **Domínio** | Gestão operacional de empresa de pisos (hardwood flooring) |
| **Stack** | React 18 + Vite + TypeScript + Tailwind CSS + Lovable Cloud (Supabase) |
| **UI Library** | shadcn/ui + Radix UI + Lucide Icons |
| **State** | TanStack React Query (server state) + React Context (auth, language) |
| **Filosofia** | **Dominância Operacional** — o sistema é um enforcer, não um observador. Backend é autoridade final. |
| **Publicado** | https://axofloorsnj.lovable.app |

---

## 2. ROUTE MAP

### 2.1 Rotas Públicas (17)

| Rota | Página |
|------|--------|
| `/` | Landing page |
| `/hardwood-flooring` | Serviço: Hardwood |
| `/sanding-and-refinish` | Serviço: Sanding & Refinish |
| `/vinyl-plank-flooring` | Serviço: Vinyl Plank |
| `/staircase` | Serviço: Staircase |
| `/base-boards` | Serviço: Baseboards |
| `/gallery` | Galeria de projetos |
| `/stain-gallery` | Galeria de stains |
| `/contact` | Formulário de contato |
| `/about` | Sobre a empresa |
| `/campaign` | Landing de campanha |
| `/quiz` | Quiz de lead capture |
| `/thank-you` | Pós-conversão |
| `/referral-program` | Programa de indicação |
| `/builders` | Página para builders |
| `/realtors` | Página para realtors |
| `/builder-offer` | Oferta para builders |
| `/floor-diagnostic` | Diagnóstico de piso |
| `/shared/:token` | Post compartilhado (public) |

### 2.2 Rotas Admin (16) — Protegidas por `ProtectedRoute` + RBAC

| Rota | Módulo |
|------|--------|
| `/admin` | Dashboard executivo (read-only) |
| `/admin/dashboard` | Alias do dashboard |
| `/admin/leads` | Pipeline de leads |
| `/admin/jobs` | Gestão de projetos/jobs |
| `/admin/projects/:projectId` | Detalhe do projeto |
| `/admin/jobs/:projectId/documents` | Documentos do projeto |
| `/admin/measurements` | Medições |
| `/admin/catalog` | Catálogo de serviços e materiais |
| `/admin/schedule` | Agendamentos |
| `/admin/performance` | Performance financeira |
| `/admin/partners` | Gestão de parceiros |
| `/admin/feed` | Feed da empresa |
| `/admin/feed/:postId` | Detalhe do post |
| `/admin/feed/:postId/edit` | Edição do post |
| `/admin/intake` | Intake de leads |
| `/admin/settings` | Configurações (geral, branding, equipe, galeria) |
| `/admin/help` | Central de ajuda |

### 2.3 Rotas Collaborator (2)

| Rota | Módulo |
|------|--------|
| `/collaborator` | Dashboard do colaborador |
| `/collaborator/project/:projectId` | Detalhe do projeto (read + upload) |

### 2.4 Auth

| Rota | Módulo |
|------|--------|
| `/auth` | Login/Signup |

---

## 3. DATABASE SCHEMA

### 3.1 Tabelas Principais

```
leads ──────────┬──► customers
                │
                └──► projects ──┬──► job_costs (1:1)
                                ├──► job_proof (1:N)
                                ├──► job_cost_items (via job_costs)
                                ├──► project_measurements ──► measurement_areas
                                ├──► project_documents
                                ├──► project_comments
                                ├──► project_members
                                ├──► proposals
                                └──► appointments

company_settings (singleton — unique on singleton_key=true)
user_roles ──► auth.users
profiles ──► auth.users (via user_id)
audit_log (standalone, append-only)
partners (standalone)

gallery_projects ──► gallery_folders
feed_posts ──► feed_folders
feed_post_images ──► feed_posts
feed_comments ──► feed_posts
media_files ──► projects | feed_posts

service_catalog (standalone — services + materials)
quiz_responses (standalone, public insert)
```

### 3.2 Detalhamento por Tabela

#### `leads`
| Campo | Tipo | Nota |
|-------|------|------|
| id | uuid PK | |
| name, phone | text NOT NULL | |
| email, address, city, zip_code, location | text | nullable |
| status | text | Default: `cold_lead`. Controlado pelo pipeline |
| priority | text | `low` / `medium` / `high` |
| lead_source | text | Default: `website` |
| services | jsonb | Array de serviços solicitados |
| budget | numeric | |
| follow_up_required | boolean | Set by trigger `set_follow_up_on_quoted` |
| follow_up_actions | jsonb | Array de ações de follow-up |
| follow_up_date | timestamptz | |
| next_action_date | date | Usado pelo SLA Engine |
| status_changed_at | timestamptz | Atualizado automaticamente |
| last_contacted_at | timestamptz | |
| converted_to_project_id | uuid FK → projects | Preenchido na conversão |
| customer_id | uuid FK → customers | |
| referred_by_partner_id | uuid FK → partners | |
| assigned_to, message, notes, room_size | text | |

#### `projects`
| Campo | Tipo | Nota |
|-------|------|------|
| id | uuid PK | |
| customer_name, customer_email, customer_phone | text NOT NULL | |
| project_type | text NOT NULL | |
| project_status | text | Default: `pending` |
| customer_id | uuid FK → customers | |
| address, city, zip_code | text | |
| square_footage, estimated_cost, actual_cost | numeric | |
| start_date, completion_date | date | |
| team_lead | text | |
| team_members | text[] | |
| work_schedule | text | Default: `8:00 AM - 5:00 PM` |
| requires_progress_photos | boolean | Default: true |
| referred_by_partner_id | uuid FK → partners | |
| notes | text | |

#### `job_costs` (1:1 com projects)
| Campo | Tipo | Nota |
|-------|------|------|
| project_id | uuid FK → projects | UNIQUE |
| labor_cost, material_cost, additional_costs | numeric | Default: 0 |
| estimated_revenue | numeric | Default: 0 |
| total_cost | numeric | **GENERATED**: labor + material + additional |
| margin_percent | numeric | **GENERATED**: ((revenue - total_cost) / revenue) * 100 |
| profit_amount | numeric | **GENERATED**: revenue - total_cost |

#### `job_cost_items` (N:1 com job_costs)
| Campo | Tipo | Nota |
|-------|------|------|
| job_cost_id | uuid FK → job_costs | |
| category | text | Default: `other` |
| description | text | |
| amount | numeric | Default: 0 |

#### `job_proof` (N:1 com projects)
| Campo | Tipo | Nota |
|-------|------|------|
| project_id | uuid FK → projects | |
| before_image_url | text | Gate para conclusão |
| after_image_url | text | Gate para conclusão |

#### `proposals`
| Campo | Tipo | Nota |
|-------|------|------|
| project_id | uuid FK → projects | |
| customer_id | uuid FK → customers | |
| proposal_number | text NOT NULL | |
| status | text | Default: `draft`. Values: draft, sent, accepted, rejected |
| good_price, better_price, best_price | numeric | Tiers Good/Better/Best |
| margin_good, margin_better, margin_best | numeric | |
| selected_tier | text | |
| valid_until | date | |
| sent_at, accepted_at | timestamptz | |
| pdf_document_id | uuid FK → project_documents | |

#### `customers`
| Campo | Tipo | Nota |
|-------|------|------|
| id | uuid PK | |
| full_name | text NOT NULL | |
| email, phone, address, city, zip_code, notes | text | |

#### `company_settings` (SINGLETON)
| Campo | Tipo | Nota |
|-------|------|------|
| singleton_key | boolean | UNIQUE, always `true` |
| company_name | text | Default: `AXO Floors` |
| trade_name | text | |
| default_margin_min_percent | numeric | Default: 30 |
| labor_pricing_model | enum | `sqft` ou `daily` |
| default_labor_rate | numeric | Default: 3.50 |
| logo_url, primary_color, secondary_color | text | |

#### `service_catalog`
| Campo | Tipo | Nota |
|-------|------|------|
| item_type | text | `service` ou `material` |
| name | text NOT NULL | |
| category | text | Agrupamento livre |
| base_price | numeric | Default: 0 |
| price_unit | text | `sqft`, `unit`, `step`, `linear_ft` |
| default_material, default_finish | text | Apenas para services |
| is_active | boolean | Default: true |
| display_order | integer | |

#### `partners`
| Campo | Tipo | Nota |
|-------|------|------|
| company_name, contact_name | text NOT NULL | |
| partner_type | text | Default: `builder` |
| service_zone | text | Default: `core` |
| status | text | Default: `active` |
| total_referrals, total_converted | integer | |
| birthday, next_action_date | date | |
| next_action_note, notes | text | |

#### `appointments`
| Campo | Tipo | Nota |
|-------|------|------|
| customer_name, customer_phone | text NOT NULL | |
| appointment_type | text NOT NULL | |
| appointment_date | date | |
| appointment_time | time | |
| duration_hours | numeric | Default: 1 |
| status | text | Default: `scheduled` |
| customer_id | uuid FK → customers | |
| project_id | uuid FK → projects | |

#### Outras tabelas
- **project_measurements** / **measurement_areas**: Medições por projeto com áreas detalhadas
- **project_documents**: Documentos por projeto (proposals PDF, fotos, etc.)
- **project_comments**: Comentários internos por projeto
- **project_members**: Associação user↔project para portal do colaborador
- **media_files**: Mídia centralizada com visibility (internal/client/public)
- **feed_posts** / **feed_post_images** / **feed_comments** / **feed_folders**: Sistema de feed
- **gallery_projects** / **gallery_folders**: Galeria pública
- **quiz_responses**: Respostas do quiz de lead capture
- **audit_log**: Log de auditoria (append-only)
- **user_roles**: RBAC (admin, moderator, user)
- **profiles**: Perfil do usuário (full_name, email, avatar_url)

### 3.3 Views Materializadas

| View | Propósito |
|------|-----------|
| `view_pipeline_metrics` | Contagem por status, últimos 30d, dias médios |
| `view_financial_metrics` | Revenue, profit, margin média, jobs ativos/concluídos |
| `view_stage_aging` | Leads por estágio com dias no pipeline e overdue |
| `leads_followup_overdue` | Leads com next_action_date vencido |
| `leads_estimate_scheduled_stale` | Leads em estimate_scheduled há muitos dias |
| `projects_missing_progress_photos` | Projetos em produção sem fotos |

---

## 4. PIPELINE (10 Estágios)

```
cold_lead → warm_lead → estimate_requested → estimate_scheduled → in_draft → proposal_sent → [proposal_rejected → in_draft] → in_production → completed
                                                                                            └→ lost
```

### Transições Válidas

| De | Para | Gate |
|----|------|------|
| cold_lead | warm_lead | Nenhum |
| warm_lead | estimate_requested | Nenhum |
| estimate_requested | estimate_scheduled | Nenhum |
| estimate_scheduled | in_draft | Nenhum |
| in_draft | proposal_sent | `converted_to_project_id` + margem calculada |
| proposal_sent | in_production | Follow-up + proposal com status `accepted` |
| proposal_sent | proposal_rejected | Nenhum |
| proposal_rejected | in_draft | Nenhum |
| in_production | completed | JobProof (before + after images) — TRIGGER |
| in_production | lost | Follow-up registrado |

### RPCs de Pipeline

| Função | Propósito |
|--------|-----------|
| `transition_lead_status(p_lead_id, p_new_status)` | Executa transição com validação |
| `validate_lead_transition(p_lead_id, p_new_status)` | Valida sem executar |
| `convert_lead_to_project(p_lead_id, p_project_type)` | Cria customer + project + job_costs |

---

## 5. BUSINESS RULES

### 5.1 Margin Enforcement
- `validate_proposal_margin(p_project_id)` → bloqueia envio se margem < `company_settings.default_margin_min_percent`
- `calculate_job_margin(p_project_id)` → retorna margem calculada com status (healthy/warning/critical)
- Campos `margin_percent`, `total_cost`, `profit_amount` em `job_costs` são **GENERATED** — NÃO editáveis

### 5.2 Follow-up Obrigatório
- Trigger `set_follow_up_on_quoted`: quando lead vai para `proposal_sent`, seta `follow_up_required = true`
- Transição `proposal_sent → in_production` requer `follow_up_actions.length > 0`

### 5.3 JobProof
- Trigger `enforce_job_proof_on_completion`: BEFORE UPDATE em projects, bloqueia `project_status = completed` se não houver `job_proof` com both images
- `validate_project_completion(p_project_id)` → verifica antes de tentar

### 5.4 Proposal Acceptance
- `validate_proposal_acceptance(p_proposal_id)` → valida antes de aceitar proposta
- Transição para `in_production` requer proposal com `status = accepted`

### 5.5 Lead Conversion
- `convert_lead_to_project(p_lead_id, p_project_type)` → cria customer, project, job_costs atomicamente
- Seta `leads.converted_to_project_id`

### 5.6 NRA (Next Recommended Action)
- `get_lead_nra(p_lead_id)` → retorna ação recomendada baseada no estado do lead
- `get_leads_nra_batch(p_lead_ids)` → batch para lista de leads

### 5.7 SLA Engine
- `run_sla_engine()` → CRON que auto-escala prioridades e registra no audit_log
- Leads parados além do threshold são escalados automaticamente

### 5.8 Cost Aggregation
- `job_cost_items` → itens detalhados que alimentam `job_costs` (labor, material, additional)
- Campos GENERATED calculam totais automaticamente

---

## 6. AUTH & RBAC

### Roles
| Role | Escopo |
|------|--------|
| `admin` | Acesso total ao /admin |
| `moderator` | Reservado (não implementado) |
| `user` | Acesso ao portal do colaborador |

### Funções
- `has_role(_user_id, _role)` → boolean, usada em todas as RLS policies
- Todas as tabelas admin usam: `USING (has_role(auth.uid(), 'admin'))`

### Padrão RLS
```sql
-- Admin: full access
CREATE POLICY "table_admin_all" ON table FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Authenticated: read-only
CREATE POLICY "table_authenticated_read" ON table FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

### ProtectedRoute (Frontend)
- Verifica `useAuth()` para autenticação
- Chama `has_role` RPC para verificar role admin
- `requireAdmin={false}` para portal do colaborador

---

## 7. KEY HOOKS

| Hook | Propósito |
|------|-----------|
| `useLeadPipeline` | Transições de status, validação, normalização legacy |
| `useLeadConversion` | Conversão lead → project via RPC |
| `useLeadFollowUp` | Gestão de follow-up actions |
| `useLeadNRA` | Next Recommended Action |
| `useJobCosts` | CRUD de custos do projeto |
| `useJobCostItems` | Itens detalhados de custo |
| `useJobProof` | Upload before/after images |
| `useProposalGeneration` | Gera tiers Good/Better/Best |
| `useProposals` | CRUD de propostas |
| `useProposalValidation` | Valida margem antes do envio |
| `useDashboardData` | Métricas do dashboard |
| `useAdminData` | Dados gerais do admin |
| `usePartnersData` | CRUD de parceiros |
| `useFeedData` | CRUD do feed |
| `useCompanySettings` | Singleton de configurações |
| `useServiceCatalog` | CRUD do catálogo (services + materials) |
| `useMeasurements` | Medições por projeto |
| `useMediaFiles` | Gestão de mídia |
| `useProjectDocuments` | Documentos por projeto |
| `usePerformanceData` | Dados financeiros |
| `useCollaboratorProjects` | Projetos do colaborador |
| `useCollaboratorUpload` | Upload pelo colaborador |
| `useLeadCapture` | Captura de leads (público) |

---

## 8. KEY COMPONENTS

| Componente | Local | Função |
|------------|-------|--------|
| `AdminLayout` | `components/admin/` | Layout com sidebar + mobile nav |
| `AdminSidebar` | `components/admin/` | Navegação lateral |
| `TensionMetricsCards` | `components/admin/` | Cards de tensão no dashboard |
| `LinearPipeline` | `pages/admin/components/` | Pipeline visual 10 estágios |
| `LeadControlModal` | `components/admin/` | Centro de controle por lead |
| `JobMarginDisplay` | `components/admin/` | Exibe margem calculada |
| `ProposalGenerator` | `components/admin/` | Gera Good/Better/Best |
| `JobProofUploader` | `components/admin/` | Upload before/after |
| `LeadFollowUpAlert` | `components/admin/` | Alerta de follow-up pendente |
| `ProjectPerformanceList` | `components/admin/performance/` | Lista com métricas financeiras |
| `ItemizedCostEditor` | `components/admin/performance/` | Editor de custos detalhados |
| `ProtectedRoute` | `components/shared/` | Guard de rota com RBAC |

---

## 9. STORAGE BUCKETS

| Bucket | Visibilidade | Uso |
|--------|-------------|-----|
| `gallery` | Public | Galeria pública de projetos |
| `feed-media` | Public | Imagens do feed |
| `project-files` | Private | Documentos de projetos |
| `job-proof` | Private | Fotos before/after |
| `collaborator-uploads` | Private | Uploads de colaboradores |

---

## 10. EDGE FUNCTIONS

| Função | Propósito |
|--------|-----------|
| `send-notifications` | Envio de notificações |
| `send-follow-up` | Envio de follow-up automático |
| `send-to-notion` | Integração com Notion |
| `facebook-conversions` | API de conversões Facebook |
| `invite-team-member` | Convite de membros da equipe |
| `collaborator-upload` | Upload via portal do colaborador |

---

## 11. SECRETS CONFIGURADOS

| Secret | Uso |
|--------|-----|
| `FACEBOOK_ACCESS_TOKEN` | Facebook Conversions API |
| `NOTION_API_KEY` | Integração Notion |
| `NOTION_DATABASE_ID` | Database ID do Notion |
| `RESEND_API_KEY` | Envio de emails (Resend) |
| `TWILIO_ACCOUNT_SID` | SMS via Twilio |
| `TWILIO_AUTH_TOKEN` | Auth Twilio |
| `TWILIO_PHONE_NUMBER` | Número de envio Twilio |

---

## 12. GAPS (O que NÃO existe)

- ❌ Envio real de propostas (email/WhatsApp/DocuSign)
- ❌ Calendário visual de agendamentos (dados existem, UI básica)
- ❌ Página dedicada de gestão de clientes
- ❌ Drag-and-drop no pipeline
- ❌ Filtros avançados na lista de leads
- ❌ Notificações push
- ❌ Relatórios exportáveis (PDF)
- ❌ Portal do cliente (CX read-only)
- ❌ Operational Score (Score de Comando)
- ❌ Integração catálogo → medições (select automático de serviço/material)

---

## 13. ROADMAP

### Fase 1 — Quick Wins
- Integrar catálogo de serviços com medições (auto-fill material/finish)
- Filtros avançados na lista de leads

### Fase 2 — Core Features
- Conversão Lead → Project com UI dedicada
- Ações em massa (bulk actions) em leads

### Fase 3 — Financeiro V1
- Receita por período na Performance
- Margens por tipo de serviço
- Alertas de baixa margem

### Fase 4 — CX Controlado
- Portal do cliente (read-only via share token)
- Notificações automáticas para clientes
- Envio real de propostas

---

## 14. REGRAS CRÍTICAS PARA AGENTES EXTERNOS

1. **Pipeline é LINEAR** — 10 estágios, sem pular etapas
2. **JobProof é INCONTORNÁVEL** — Trigger server-side, sem bypass
3. **Margem mínima bloqueia proposta** — `validate_proposal_margin()`
4. **Follow-up obrigatório** — Sem registro, não avança para produção
5. **RBAC ativo** — `has_role()` em todas as RLS policies
6. **company_settings é SINGLETON** — Única linha, `singleton_key = true`
7. **job_costs tem campos GENERATED** — `total_cost`, `margin_percent`, `profit_amount` NÃO são editáveis
8. **Dashboard é READ-ONLY** — Zero ações, apenas visualização
9. **Backend é autoridade final** — UI guia, triggers decidem
10. **NÃO editar**: `client.ts`, `types.ts`, `.env`, `config.toml` — auto-gerados

### Tabelas READ-ONLY (sem DELETE policy)
- `audit_log` — append-only
- `quiz_responses` — apenas insert público
- `company_settings` — sem delete
- `profiles` — sem delete

### Padrão de Naming
- Hooks: `use[Entidade]` (ex: `useJobCosts`)
- Componentes admin: `src/components/admin/`
- Páginas admin: `src/pages/admin/`
- Types compartilhados: `src/types/`

---

**FIM DO DOSSIER**
