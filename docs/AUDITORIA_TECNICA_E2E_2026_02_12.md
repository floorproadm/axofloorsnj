# AUDITORIA TÉCNICA COMPLETA E2E — AXO FLOORS

> **Data**: 2026-02-12  
> **Tipo**: Forense — Estritamente factual  
> **Base**: Código-fonte, schema de banco, edge functions deployadas, configurações ativas

---

## PARTE 1 — MAPA COMPLETO DE ROTAS

### 1.1 Rotas Públicas

| Caminho | Arquivo | Componentes | Entidades DB | RPC/Direto |
|---------|---------|-------------|-------------|------------|
| `/` | `src/pages/Index.tsx` | Hero, Portfolio, ReviewsSection, ContactSection, GoogleBusinessIntegration, SEOHead | Nenhuma leitura direta | N/A |
| `/hardwood-flooring` | `src/pages/HardwoodFlooring.tsx` | Página de serviço | Nenhuma | N/A |
| `/sanding-and-refinish` | `src/pages/SandingRefinish.tsx` | Página de serviço | Nenhuma | N/A |
| `/vinyl-plank-flooring` | `src/pages/VinylPlankFlooring.tsx` | Página de serviço | Nenhuma | N/A |
| `/staircase` | `src/pages/Staircase.tsx` | Página de serviço | Nenhuma | N/A |
| `/base-boards` | `src/pages/BaseBoards.tsx` | Página de serviço | Nenhuma | N/A |
| `/gallery` | `src/pages/Gallery.tsx` | Galeria pública | `gallery_projects`, `gallery_folders` | Direto (SELECT) |
| `/stain-gallery` | `src/pages/StainGallery.tsx` | Galeria de stains | Nenhuma (assets estáticos) | N/A |
| `/contact` | `src/pages/Contact.tsx` | ContactForm | `leads` (INSERT) | Direto + Edge Functions |
| `/about` | `src/pages/About.tsx` | Página institucional | Nenhuma | N/A |
| `/campaign` | `src/pages/Campaign.tsx` | Landing page | Nenhuma | N/A |
| `/quiz` | `src/pages/Quiz.tsx` | Formulário qualificador | `quiz_responses` (INSERT), `leads` (INSERT) | Direto |
| `/thank-you` | `src/pages/ThankYou.tsx` | Pós-conversão | Nenhuma | N/A |
| `/referral-program` | `src/pages/ReferralProgram.tsx` | Página de referral | Nenhuma | N/A |
| `/builders` | `src/pages/Builders.tsx` | B2B landing | Nenhuma | N/A |
| `/realtors` | `src/pages/Realtors.tsx` | B2B landing | Nenhuma | N/A |
| `/builder-offer` | `src/pages/BuilderPartnerships.tsx` | B2B landing | Nenhuma | N/A |
| `/sales2026` | `src/pages/Sales2026.tsx` | Processo de vendas visual | Nenhuma | N/A |
| `/floor-diagnostic` | `src/pages/FloorDiagnostic.tsx` | Quiz qualificador | `leads` (INSERT) | Direto |
| `/auth` | `src/pages/Auth.tsx` | Login/Signup | `auth.users`, `profiles` | Auth SDK |

### 1.2 Rotas Autenticadas (Admin)

| Caminho | Arquivo | Guarda | Componentes | Entidades DB | RPC |
|---------|---------|--------|-------------|-------------|-----|
| `/admin` | `src/pages/admin/Dashboard.tsx` | `ProtectedRoute` | AdminLayout, TensionMetricsCards | `leads`, `projects`, `job_costs`, `job_proof`, `company_settings` | Nenhum (SELECT direto) |
| `/admin/dashboard` | `src/pages/admin/Dashboard.tsx` | `ProtectedRoute` | Mesmo acima | Mesmo acima | Nenhum |
| `/admin/leads` | `src/pages/admin/LeadsManager.tsx` | `ProtectedRoute` | LinearPipeline, LeadControlModal | `leads`, `projects`, `job_costs`, `job_proof`, `customers` | `transition_lead_status`, `convert_lead_to_project`, `get_lead_nra`, `validate_project_completion` |
| `/admin/gallery` | `src/pages/admin/GalleryManager.tsx` | `ProtectedRoute` | ImageUploader, DragDropGrid | `gallery_projects`, `gallery_folders` | Nenhum |
| `/admin/intake` | `src/pages/admin/Intake.tsx` | `ProtectedRoute` | Formulário manual + analytics de fontes | `leads` | Nenhum |
| `/admin/settings` | `src/pages/admin/Settings.tsx` | `ProtectedRoute` | Formulário company_settings | `company_settings` | Nenhum |

### 1.3 Rota de Erro

| Caminho | Arquivo |
|---------|---------|
| `*` (catch-all) | `src/pages/NotFound.tsx` |

### 1.4 Rotas ÓRFÃS

| Arquivo | Status |
|---------|--------|
| `src/pages/ReviewManagement.tsx` | **ÓRFÃ** — Arquivo existe, NÃO declarado em App.tsx, inacessível via navegação |

### 1.5 Middleware / Guards

| Guard | Localização | Lógica |
|-------|-------------|--------|
| `ProtectedRoute` | `src/components/shared/ProtectedRoute.tsx` | Verifica `useAuth().user`. Se `null` → redirect `/auth`. Se `loading` → spinner. |

**Nota**: `ProtectedRoute` verifica apenas autenticação (user !== null). **NÃO verifica role admin**. Qualquer usuário autenticado acessa `/admin/*`.

---

## PARTE 2 — BANCO DE DADOS E ESTRUTURA REAL

### 2.1 Tabelas

#### `leads` — CORE

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| name | text | Não | — |
| phone | text | Não | — |
| email | text | Sim | — |
| status | text | Não | 'new'::text |
| priority | text | Não | 'medium'::text |
| lead_source | text | Não | 'website'::text |
| services | jsonb | Sim | '[]'::jsonb |
| budget | numeric | Sim | — |
| room_size | text | Sim | — |
| location | text | Sim | — |
| address | text | Sim | — |
| city | text | Sim | — |
| zip_code | text | Sim | — |
| message | text | Sim | — |
| notes | text | Sim | — |
| assigned_to | text | Sim | — |
| follow_up_date | timestamptz | Sim | — |
| follow_up_required | boolean | Sim | false |
| next_action_date | date | Sim | — |
| follow_up_actions | jsonb | Sim | '[]'::jsonb |
| last_contacted_at | timestamptz | Sim | — |
| customer_id | uuid | Sim | — |
| converted_to_project_id | uuid | Sim | — |
| created_at | timestamptz | Não | now() |
| updated_at | timestamptz | Não | now() |

- **PK**: id
- **FK**: customer_id → customers.id
- **Índices**: NÃO ENCONTRADO (além de PK)
- **Triggers ativos**: `axo_validate_lead_transition` (BEFORE UPDATE), `set_follow_up_on_quoted` (BEFORE UPDATE)
- **RLS**: SELECT para authenticated, INSERT público, ALL para admin
- **Campos calculados**: Nenhum
- **Classificação**: CORE

**Observação sobre status default**: O default no banco é `'new'::text`, mas o código frontend usa tanto `'new'` quanto `'new_lead'`. A função `normalizeStatus()` converte `'new'` → `'new_lead'` no front. O trigger `axo_validate_lead_transition` usa `'new_lead'`, `'appt_scheduled'`, `'proposal'`, `'in_production'`, `'completed'`, `'lost'`. **O ContactForm insere com status `'new'`**.

---

#### `customers` — CORE

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| full_name | text | Não | — |
| email | text | Sim | — |
| phone | text | Sim | — |
| address | text | Sim | — |
| city | text | Sim | — |
| zip_code | text | Sim | — |
| notes | text | Sim | — |
| created_at | timestamptz | Não | now() |
| updated_at | timestamptz | Não | now() |

- **PK**: id
- **FK**: Nenhum
- **Triggers**: NÃO ENCONTRADO
- **RLS**: SELECT para authenticated, ALL para admin
- **Classificação**: CORE

---

#### `projects` — CORE

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| customer_id | uuid | Sim | — |
| customer_name | text | Não | — |
| customer_email | text | Não | — |
| customer_phone | text | Não | — |
| project_type | text | Não | — |
| project_status | text | Não | 'pending'::text |
| address | text | Sim | — |
| city | text | Sim | — |
| zip_code | text | Sim | — |
| square_footage | numeric | Sim | — |
| estimated_cost | numeric | Sim | — |
| actual_cost | numeric | Sim | — |
| start_date | date | Sim | — |
| completion_date | date | Sim | — |
| notes | text | Sim | — |
| created_at | timestamptz | Não | now() |
| updated_at | timestamptz | Não | now() |

- **PK**: id
- **FK**: customer_id → customers.id
- **Triggers**: `enforce_job_proof_on_completion` (BEFORE UPDATE) — bloqueia conclusão sem JobProof
- **RLS**: SELECT para authenticated, ALL para admin
- **Classificação**: CORE

**Nota sobre triggers**: A informação da lista de triggers (`<db-triggers>`) reporta "There are no triggers in the database", o que contradiz as funções `axo_validate_lead_transition`, `set_follow_up_on_quoted` e `enforce_job_proof_on_completion` que são definidas como trigger functions. **Status real dos triggers: INCERTO** — as funções existem mas a lista de triggers está vazia. Pode ser um problema de deploy ou de consulta.

---

#### `job_costs` — CORE

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| project_id | uuid | Não | — |
| labor_cost | numeric | Não | 0 |
| material_cost | numeric | Não | 0 |
| additional_costs | numeric | Não | 0 |
| estimated_revenue | numeric | Não | 0 |
| total_cost | numeric | Sim | — |
| margin_percent | numeric | Sim | — |
| profit_amount | numeric | Sim | — |
| created_at | timestamptz | Não | now() |
| updated_at | timestamptz | Não | now() |

- **PK**: id
- **FK**: project_id → projects.id (1:1)
- **Campos calculados**: A documentação indica `total_cost`, `margin_percent`, `profit_amount` como GENERATED. O schema do types.ts permite que sejam nulos e atualizáveis. **Status real: INCERTO** — podem ser generated columns ou campos normais calculados por trigger. O código (`useUpsertJobCost`) não envia estes campos no update, o que é consistente com GENERATED columns.
- **RLS**: SELECT para authenticated, ALL para admin
- **Classificação**: CORE

---

#### `job_proof` — CORE

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| project_id | uuid | Não | — |
| before_image_url | text | Sim | — |
| after_image_url | text | Sim | — |
| created_at | timestamptz | Não | now() |
| updated_at | timestamptz | Não | now() |

- **PK**: id
- **FK**: project_id → projects.id (1:N)
- **RLS**: SELECT para authenticated, ALL para admin
- **Storage**: Bucket `job-proof` (público)
- **Classificação**: CORE

---

#### `company_settings` — CORE

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| company_name | text | Não | 'AXO Floors'::text |
| default_margin_min_percent | numeric | Não | 30 |
| labor_pricing_model | enum (sqft/daily) | Não | 'sqft' |
| default_labor_rate | numeric | Não | 3.50 |
| created_at | timestamptz | Não | now() |
| updated_at | timestamptz | Não | now() |

- **PK**: id
- **Singleton**: Sim (por convenção, não por constraint)
- **RLS**: SELECT para authenticated, UPDATE e INSERT para admin, DELETE NÃO permitido
- **Classificação**: CORE

---

#### `appointments` — SUPORTE

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | Não | gen_random_uuid() |
| customer_id | uuid | Sim | — |
| project_id | uuid | Sim | — |
| customer_name | text | Não | — |
| customer_phone | text | Não | — |
| appointment_date | date | Não | — |
| appointment_time | time | Não | — |
| appointment_type | text | Não | — |
| duration_hours | numeric | Sim | 1 |
| location | text | Sim | — |
| notes | text | Sim | — |
| status | text | Não | 'scheduled'::text |
| reminder_sent | boolean | Sim | false |
| created_at | timestamptz | Não | now() |
| updated_at | timestamptz | Não | now() |

- **FK**: customer_id → customers.id, project_id → projects.id
- **RLS**: SELECT para todos, INSERT/UPDATE/DELETE para admin
- **Classificação**: SUPORTE — **NÃO REFERENCIADA no código frontend**. Nenhum componente lê ou escreve nesta tabela.

---

#### `profiles` — SUPORTE

| Campos principais | user_id (uuid), full_name, email, avatar_url |
|---|---|
- **RLS**: CRUD restrito a own user (auth.uid() = user_id)
- **Trigger**: `handle_new_user` cria perfil no signup via trigger na tabela `auth.users`
- **Classificação**: SUPORTE

---

#### `user_roles` — SUPORTE

| Campos | user_id (uuid), role (app_role enum), created_at |
|---|---|
- **RLS**: SELECT para own user, ALL para admin
- **Classificação**: SUPORTE (infraestrutura RBAC)

---

#### `audit_log` — SUPORTE

| Campos | user_id, operation_type, table_accessed, data_classification, access_timestamp |
|---|---|
- **RLS**: SELECT para authenticated, INSERT público (system)
- **Classificação**: SUPORTE

---

#### `quiz_responses` — SUPORTE

| Campos | name, email, phone, room_size, services, budget, city, zip_code, source |
|---|---|
- **RLS**: INSERT público, SELECT para authenticated
- **Classificação**: SUPORTE

---

#### `gallery_projects` — SUPORTE

| Campos | title, description, category, location, image_url, display_order, is_featured, parent_folder_id |
|---|---|
- **FK**: parent_folder_id → gallery_folders.id
- **RLS**: SELECT público, INSERT/UPDATE/DELETE para admin
- **Classificação**: SUPORTE

---

#### `gallery_folders` — SUPORTE

| Campos | name, description, cover_image_url, display_order |
|---|---|
- **RLS**: SELECT público, INSERT/UPDATE/DELETE para admin
- **Classificação**: SUPORTE

---

## PARTE 3 — REGRAS DE NEGÓCIO IMPLEMENTADAS

### 3.1 Validações Server-Side (Funções SQL)

| # | Nome | Tipo | Evento | Condição | Ação | Bloqueia |
|---|------|------|--------|----------|------|----------|
| 1 | `axo_validate_lead_transition()` | Trigger function | BEFORE UPDATE em `leads` (status change) | Verifica pipeline linear: new_lead→appt_scheduled→proposal→in_production→completed/lost | Permite transição se válida | RAISE EXCEPTION se sequência inválida, se falta projeto para proposal, se margem < mínimo, se falta follow-up para sair de proposal |
| 2 | `set_follow_up_on_quoted()` | Trigger function | BEFORE UPDATE em `leads` (status → quoted/proposal) | Status muda para 'quoted' | Define `follow_up_required = TRUE`, `next_action_date = +2 dias` | Não bloqueia |
| 3 | `enforce_job_proof_on_completion()` | Trigger function | BEFORE UPDATE em `projects` (status → completed) | `project_status` muda para 'completed' | Chama `validate_project_completion()` | RAISE EXCEPTION se falta before/after image |
| 4 | `validate_proposal_margin()` | RPC (SECURITY DEFINER) | Chamada explícita | Verifica `margin_percent >= default_margin_min_percent` | Retorna can_send + error_message | Loga tentativa bloqueada em audit_log |
| 5 | `validate_lead_transition()` | RPC (SECURITY DEFINER) | Chamada explícita (read-only validation) | Pipeline linear com gates | Retorna can_transition + error | NÃO bloqueia (apenas validação) |
| 6 | `validate_project_completion()` | RPC (SECURITY DEFINER) | Chamada explícita | Verifica existência de before + after images em job_proof | Retorna can_complete | Loga em audit_log |
| 7 | `convert_lead_to_project()` | RPC (SECURITY DEFINER) | Chamada explícita | Lead não convertido, lock FOR UPDATE | Cria customer (se não existe), project, job_costs (zerados), linka lead | RAISE EXCEPTION se já convertido |
| 8 | `transition_lead_status()` | RPC (SECURITY DEFINER) | Chamada explícita | UPDATE direto no leads.status | Trigger `axo_validate_lead_transition` faz a validação | Bloqueia via trigger |
| 9 | `calculate_job_margin()` | RPC (SECURITY DEFINER) | Chamada explícita | Lê job_costs + company_settings | Retorna margin_status | RAISE EXCEPTION se não encontrado |
| 10 | `get_lead_nra()` | RPC (SECURITY DEFINER, STABLE) | Chamada explícita | Árvore de decisão baseada em status e dados do lead | Retorna JSONB com action, label, severity | Não bloqueia |
| 11 | `has_role()` | Function (SECURITY DEFINER, STABLE) | Usada em RLS policies | Verifica user_roles | Retorna boolean | Bloqueia acesso via RLS |

### 3.2 Validações Client-Side Críticas

| # | Nome | Localização | Enforçado no servidor? |
|---|------|-------------|----------------------|
| 1 | `validateMargin()` | `src/hooks/useJobCosts.ts` | SIM — `validate_proposal_margin` e trigger |
| 2 | `normalizeStatus()` | `src/hooks/useLeadPipeline.ts` | NÃO — mapeamento legacy apenas no front |
| 3 | Validação de formulário | `src/utils/validation.ts` | NÃO ENFORÇADA NO SERVIDOR — sanitização e validação apenas no front |
| 4 | Rate limiting | `src/utils/validation.ts` | NÃO ENFORÇADA NO SERVIDOR — implementado com Map() in-memory no browser |

### 3.3 Gates de Permissão (RLS)

| Gate | Tabelas | Condição |
|------|---------|----------|
| Admin write | leads, projects, job_costs, job_proof, customers, appointments, gallery_* | `has_role(auth.uid(), 'admin')` |
| Authenticated read | leads, projects, job_costs, job_proof, customers, audit_log, quiz_responses | `auth.uid() IS NOT NULL` |
| Public insert | leads, quiz_responses | `true` (sem restrição) |
| Public read | gallery_projects, gallery_folders | `true` |

---

## PARTE 4 — FLUXOS OPERACIONAIS E2E REAIS

### 4.1 Captação → Lead → Pipeline

```
[Público] ContactForm / Quiz / FloorDiagnostic / LeadMagnet
    ↓ INSERT leads (status='new', source=*)
    ↓ Edge functions: send-to-notion, send-notifications, send-follow-up, facebook-conversions
    ↓
[Admin] /admin/intake (visualização de fontes + inserção manual)
    ↓
[Admin] /admin/leads (LinearPipeline)
```

**Status**: FLUXO FUNCIONAL

### 4.2 Lead → Conversão → Job

```
Lead (status=new_lead ou appt_scheduled)
    ↓ Admin clica "Criar Projeto" no modal
    ↓ RPC: convert_lead_to_project()
    ↓   → Cria customer (se não existe)
    ↓   → Cria project (status=pending)
    ↓   → Cria job_costs (zerado)
    ↓   → Atualiza lead.converted_to_project_id
    ↓
Lead agora aparece na aba "Jobs" (LinearPipeline filtra por converted_to_project_id)
    ↓ NRA muda para "Preencher custos do projeto"
```

**Status**: FLUXO FUNCIONAL  
**Nota**: Após conversão, o modal permanece aberto e NRA atualiza automaticamente.

### 4.3 Job → Custos → Proposta

```
Lead com projeto linkado
    ↓ NRA: "Preencher custos"
    ↓ [PROBLEMA: UI para preencher custos NÃO está implementada no modal]
    ↓ Se custos preenchidos → NRA: "Avançar para Proposta"
    ↓ Admin clica avançar → RPC transition_lead_status('proposal')
    ↓ Trigger valida: converted_to_project_id NOT NULL + margin >= min
    ↓ Trigger set_follow_up_on_quoted ativa follow_up_required
```

**Status**: FLUXO PARCIAL  
**Lacuna**: O modal de lead não contém UI para editar `job_costs`. O NRA indica "Preencher custos" mas o botão abre o formulário de conversão, não um editor de custos. O hook `useUpsertJobCost` existe mas não é chamado no `LeadControlModal`.

### 4.4 Proposta → Follow-up → Fechamento

```
Lead (status=proposal)
    ↓ NRA: "Registrar follow-up obrigatório"
    ↓ Admin adiciona follow-up via FollowUpForm
    ↓   → Appends to leads.follow_up_actions (JSONB array)
    ↓ NRA muda para: "Fechar como Won ou Lost"
    ↓ Admin avança → RPC transition_lead_status('in_production' ou 'lost')
    ↓ Trigger valida: follow_up_actions.length > 0
```

**Status**: FLUXO FUNCIONAL

### 4.5 Job → JobProof → Completed

```
Lead (status=in_production, com converted_to_project_id)
    ↓ NRA: "Enviar fotos before & after"
    ↓ JobProofUploader aparece no modal
    ↓   → Upload para storage bucket 'job-proof'
    ↓   → INSERT em job_proof
    ↓ NRA muda para: "Finalizar job"
    ↓ Admin clica → RPC transition_lead_status('completed')
    ↓ Trigger enforce_job_proof_on_completion valida
```

**Status**: FLUXO FUNCIONAL (condicionado ao status real dos triggers — ver Parte 2)

### 4.6 Geração de Proposta 3-Tiers

```
useProposalGeneration.fetchProjectData(projectId)
    ↓ Lê project, job_costs, company_settings
    ↓ Calcula Good (30%) / Better (38%) / Best (45%)
    ↓ Valida todas as tiers >= min_margin
    ↓ Retorna ProposalData com tiers
```

**Status**: IMPLEMENTADO PORÉM NÃO INTEGRADO — O hook `useProposalGeneration` existe e é funcional. O componente `ProposalGenerator` existe. **Nenhum dos dois é invocado a partir do LeadControlModal ou qualquer rota acessível**.

---

## PARTE 5 — ARQUITETURA FRONT-END

### 5.1 Estrutura de Pastas

```
src/
├── assets/              # Imagens estáticas
├── components/
│   ├── admin/           # Componentes do admin
│   ├── sales/           # Componentes do Sales2026
│   ├── shared/          # Componentes reutilizáveis (Header, Footer, etc)
│   └── ui/              # shadcn/ui components
├── contexts/            # AuthContext
├── hooks/
│   ├── admin/           # useAdminData, useDashboardData, useAdminAuth, useGalleryData, useLeadsExport
│   └── [root]           # useJobCosts, useJobProof, useLeadPipeline, etc
├── integrations/
│   └── supabase/        # client.ts, types.ts (auto-generated)
├── lib/                 # utils.ts (cn helper)
├── pages/
│   ├── admin/
│   │   └── components/  # LinearPipeline, KanbanBoard, etc
│   └── [root]           # Páginas públicas
├── types/               # proposal.ts
└── utils/               # validation.ts, heicConverter.ts, security-monitoring.ts
```

### 5.2 Classificação de Componentes

#### CORE REUTILIZÁVEL
| Componente | Uso |
|------------|-----|
| `AdminLayout` | Layout wrapper para todas as páginas admin |
| `AdminSidebar` | Navegação lateral admin |
| `ProtectedRoute` | Guard de autenticação |
| `Header` | Header público |
| `Footer` | Footer público |
| `SEOHead` | Meta tags |
| `ContactForm` | Formulário de contato com integração DB |

#### ESPECÍFICO DO NEGÓCIO
| Componente | Uso |
|------------|-----|
| `LinearPipeline` | Pipeline visual de leads/jobs |
| `LeadControlModal` | Centro de controle por lead |
| `JobProofUploader` | Upload before/after |
| `JobMarginDisplay` | Exibe margem calculada |
| `ProposalGenerator` | Gera propostas 3-tiers |
| `LeadFollowUpAlert` | Alerta de follow-up pendente |
| `LeadSignalBadge` | Badge NRA nos cards |
| `TensionMetricsCards` | Cards do dashboard |

#### NÃO REFERENCIADO
| Componente | Status |
|------------|--------|
| `ActionableAlertsSection` | **NÃO REFERENCIADO** — precisa verificar uso |
| `LeadPipelineStatus` | **NÃO REFERENCIADO** — precisa verificar uso |
| `StatsCards` | **NÃO REFERENCIADO** — precisa verificar uso |
| `DataTable` | **NÃO REFERENCIADO** — precisa verificar uso |
| `KanbanBoard` | Existe em `pages/admin/components/` — **NÃO REFERENCIADO em nenhuma rota ativa** |
| `AdvancedFilters` | Existe em `pages/admin/components/` — **NÃO REFERENCIADO** |
| `FollowUpSystem` | Existe em `pages/admin/components/` — **NÃO REFERENCIADO** |
| `LeadAlerts` | Existe em `pages/admin/components/` — **NÃO REFERENCIADO** |
| `RevenueProjection` | Existe em `pages/admin/components/` — **NÃO REFERENCIADO** |

### 5.3 Hooks

| Hook | Classificação | Uso Real |
|------|--------------|----------|
| `useAdminData` | CORE | Usado em LeadsManager |
| `useDashboardData` | CORE | Usado em Dashboard |
| `useLeadPipeline` | CORE | Usado em LeadControlModal |
| `useLeadFollowUp` | CORE | Usado em LeadControlModal |
| `useLeadConversion` | CORE | Usado em LeadControlModal |
| `useLeadNRA` / `useLeadNRABatch` | CORE | Usado em LinearPipeline e LeadControlModal |
| `useJobCost` / `useUpsertJobCost` | CORE | **IMPLEMENTADO PORÉM NÃO INTEGRADO no modal** |
| `useJobProof` | CORE | Usado em JobProofUploader |
| `useCompanySettings` | CORE | Usado em Settings e useMarginValidation |
| `useProposalGeneration` | CORE | **IMPLEMENTADO PORÉM NÃO INTEGRADO** |
| `useProposalValidation` | CORE | **NÃO REFERENCIADO** em nenhum componente montado |
| `useLeadCapture` | SUPORTE | Usado em LeadMagnetGate |
| `useAdminAuth` | SUPORTE | Precisa verificar |
| `useGalleryData` | SUPORTE | Precisa verificar |
| `useLeadsExport` | SUPORTE | Precisa verificar |

### 5.4 Contextos e Providers

| Provider | Localização | Escopo |
|----------|-------------|--------|
| `QueryClientProvider` | App.tsx (root) | React Query |
| `AuthProvider` | App.tsx (root) | Auth state |
| `TooltipProvider` | App.tsx (root) | Tooltips |
| `SidebarProvider` | AdminLayout (admin only) | Sidebar state |

---

## PARTE 6 — EDGE FUNCTIONS E INTEGRAÇÕES

### 6.1 Edge Functions

| Função | Chamada de | Secrets Usados | Tratamento de Erro |
|--------|-----------|---------------|-------------------|
| `send-to-notion` | ContactForm, LeadCapture, Quiz, FloorDiagnostic | NOTION_API_KEY, NOTION_DATABASE_ID | try/catch com console.warn, não falha o fluxo |
| `send-notifications` | LeadCapture | RESEND_API_KEY, TWILIO_* | try/catch com console.warn |
| `send-follow-up` | LeadCapture | RESEND_API_KEY | try/catch com console.warn |
| `facebook-conversions` | ContactForm | FACEBOOK_ACCESS_TOKEN | try/catch com console.error |
| `secure-form-handler` | NÃO ENCONTRADO no código frontend | — | **NÃO REFERENCIADO** |
| `security-monitor` | NÃO ENCONTRADO no código frontend | — | **NÃO REFERENCIADO** |
| `assign-admin-role` | NÃO ENCONTRADO no código frontend | — | **NÃO REFERENCIADO** |
| `create-admin-user` | NÃO ENCONTRADO no código frontend | — | **NÃO REFERENCIADO** |

### 6.2 Retry Logic

NÃO ENCONTRADO em nenhuma edge function call. Todas usam fire-and-forget com try/catch.

### 6.3 APIs Externas

| Serviço | Via | Status |
|---------|-----|--------|
| Notion | Edge function `send-to-notion` | Ativo (secrets configurados) |
| Resend (email) | Edge functions `send-follow-up`, `send-notifications` | Ativo (secret configurado) |
| Twilio (SMS) | Edge function `send-notifications` | Ativo (secrets configurados) |
| Facebook CAPI | Edge function `facebook-conversions` | Ativo (secret configurado) |

### 6.4 Storage Buckets

| Bucket | Público | Uso |
|--------|---------|-----|
| `job-proof` | Sim | Upload de fotos before/after |

**Nota**: GalleryManager referencia bucket `gallery` no `ImageUploader`, mas este bucket **NÃO está listado nos buckets existentes**.

### 6.5 Variáveis de Ambiente

| Variável | Uso |
|----------|-----|
| VITE_SUPABASE_URL | Client config |
| VITE_SUPABASE_PUBLISHABLE_KEY | Client config |
| VITE_SUPABASE_PROJECT_ID | Client config |

---

## PARTE 7 — STATUS DOS NON-NEGOTIABLES

### 7.1 Margem visível antes do close

| Aspecto | Status |
|---------|--------|
| Backend: `calculate_job_margin()` | **IMPLEMENTADO** |
| Backend: `validate_proposal_margin()` | **IMPLEMENTADO** |
| Backend: Trigger bloqueia proposal se margem < mínimo | **IMPLEMENTADO** (em `axo_validate_lead_transition`) |
| Frontend: `JobMarginDisplay.tsx` | **IMPLEMENTADO** |
| Frontend: Integração no modal de lead | **NÃO IMPLEMENTADO** — `JobMarginDisplay` existe mas não é renderizado no `LeadControlModal` |
| **Veredicto** | **PARCIAL** — enforced no backend, não visível no modal |

### 7.2 Proposta Good/Better/Best

| Aspecto | Status |
|---------|--------|
| Backend: `validate_proposal_margin()` | **IMPLEMENTADO** |
| Frontend: `useProposalGeneration` | **IMPLEMENTADO** |
| Frontend: `ProposalGenerator.tsx` | **IMPLEMENTADO** |
| Frontend: Integração no fluxo | **NÃO IMPLEMENTADO** — componente existe, não é montado em nenhuma rota/modal acessível |
| **Veredicto** | **IMPLEMENTADO PORÉM NÃO INTEGRADO** |

### 7.3 Follow-up obrigatório

| Aspecto | Status |
|---------|--------|
| Backend: Trigger `set_follow_up_on_quoted()` | **IMPLEMENTADO** |
| Backend: Trigger `axo_validate_lead_transition` bloqueia saída de proposal sem follow-up | **IMPLEMENTADO** |
| Frontend: `LeadFollowUpAlert.tsx` | **IMPLEMENTADO** |
| Frontend: FollowUpForm no modal | **IMPLEMENTADO** |
| NRA: `record_follow_up` action | **IMPLEMENTADO** |
| **Veredicto** | **IMPLEMENTADO** |

### 7.4 JobProof obrigatório antes de concluir

| Aspecto | Status |
|---------|--------|
| Backend: `enforce_job_proof_on_completion()` trigger | **IMPLEMENTADO** (função existe) |
| Backend: `validate_project_completion()` | **IMPLEMENTADO** |
| Frontend: `JobProofUploader.tsx` | **IMPLEMENTADO** |
| Frontend: Integração no modal | **IMPLEMENTADO** (condicional ao NRA action) |
| NRA: `upload_photos` / `upload_before_photo` / `upload_after_photo` | **IMPLEMENTADO** |
| **Veredicto** | **IMPLEMENTADO** (condicionado ao deploy real do trigger) |

### 7.5 Pipeline com bloqueio de estágio

| Aspecto | Status |
|---------|--------|
| Backend: `axo_validate_lead_transition()` | **IMPLEMENTADO** |
| Backend: `transition_lead_status()` RPC | **IMPLEMENTADO** |
| Frontend: `VALID_TRANSITIONS` map | **IMPLEMENTADO** |
| Frontend: NRA-driven actions | **IMPLEMENTADO** |
| **Veredicto** | **IMPLEMENTADO** |

---

## PARTE 8 — DÍVIDA TÉCNICA DETECTADA

### 8.1 Problemas Estruturais

| # | Problema | Localização | Risco |
|---|---------|-------------|-------|
| 1 | **Status default inconsistente**: Banco usa `'new'`, trigger usa `'new_lead'`, front converte via `normalizeStatus()` | `leads.status`, `ContactForm`, trigger | Leads inseridos pelo ContactForm entram como `'new'`, trigger espera `'new_lead'` — pode causar bypass de validação |
| 2 | **ProtectedRoute não verifica role admin** | `ProtectedRoute.tsx` | Qualquer usuário autenticado (incluindo `user` role) pode acessar `/admin/*`. RLS protege dados, mas a UI é exposta |
| 3 | **Triggers reportados como inexistentes** | `<db-triggers>` | Lista de triggers vazia contradiz funções trigger existentes. Pode indicar que triggers não foram criados (só as funções) |
| 4 | **Bucket `gallery` referenciado mas não existe** | `GalleryManager.tsx` → `ImageUploader` | Upload de imagens da galeria falhará com erro de bucket não encontrado |
| 5 | **Componentes órfãos** | `KanbanBoard`, `AdvancedFilters`, `FollowUpSystem`, `LeadAlerts`, `RevenueProjection`, `ReviewManagement.tsx` | Código morto |
| 6 | **Hooks não integrados** | `useProposalValidation`, `useProposalGeneration` (parcial), `useUpsertJobCost` (no modal) | Funcionalidade implementada mas inacessível |
| 7 | **Edge functions não referenciadas** | `secure-form-handler`, `security-monitor`, `assign-admin-role`, `create-admin-user` | Código deployado sem uso, potencial superfície de ataque |
| 8 | **Rate limiting client-only** | `src/utils/validation.ts` | In-memory Map no browser, trivialmente bypassável |
| 9 | **Sem retry em edge functions** | Todos os calls a edge functions | Falhas silenciosas em notificações |
| 10 | **Hardcoded values** | `useProposalGeneration` — DEFAULT_TIER_MARGINS (30/38/45), NRA_STYLES com cores hardcoded | Não configurable via company_settings |
| 11 | **`useAdminData` calcula stats com status legacy** | `useAdminData.ts` linhas 110-115 | Filtra por `'new'`, `'contacted'`, `'qualified'`, `'converted'` que não são mais os status reais do pipeline |
| 12 | **`company_settings` não tem constraint de singleton** | Schema | Nada impede INSERT de múltiplas linhas. Queries usam `LIMIT 1` |
| 13 | **`appointments` tabela sem uso no frontend** | Inteira tabela | Dados nunca lidos/escritos pelo app |
| 14 | **Sem índices customizados** | `leads`, `projects`, `job_costs` | Queries por status, source, dates sem índice |

### 8.2 Segurança

| # | Problema |
|---|---------|
| 1 | `leads` INSERT público sem validação de campos no servidor (nome, telefone podem ser strings vazias de outro front) |
| 2 | Admin routes acessíveis por qualquer authenticated user (RLS protege dados, mas UI/UX expostos) |
| 3 | Storage bucket `job-proof` é público — qualquer pessoa com a URL pode ver as fotos |
| 4 | Edge functions `assign-admin-role` e `create-admin-user` deployadas sem proteção de acesso verificada no front |

---

## PARTE 9 — CLASSIFICAÇÃO TÉCNICA DO SISTEMA

### Classificação: **[X] Sistema operacional single-tenant**

| Critério | Evidência |
|----------|-----------|
| **Estrutura de dados** | Sem campo `tenant_id` em nenhuma tabela. `company_settings` é singleton. Dados compartilhados globalmente. |
| **Controle de tenant** | Inexistente. Uma única empresa (AXO Floors) opera o sistema. |
| **Isolamento de dados** | Todos os dados pertencem a uma entidade. Sem separação por organização. |
| **Autenticação** | Email/password via Supabase Auth. Sem SSO. Sem multi-org. |
| **Permissões** | RBAC com 3 roles (admin, moderator, user). Apenas `admin` tem write access operacional. `moderator` e `user` não possuem permissões específicas implementadas. |
| **Frontend** | Website público + painel admin integrado. Single deployment. |

---

**FIM DA AUDITORIA**

```
Gerado: 2026-02-12
Método: Análise forense de código + schema + configuração
Escopo: Código-fonte, banco de dados, edge functions, storage, RLS
```
