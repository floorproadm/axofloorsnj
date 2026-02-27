

# Partner Hub — Entidade Separada no AXO OS

## Problema Atual
Builders e Realtors entram pelo site como leads comuns e se misturam no Pipeline de Vendas com clientes finais. Nao existe gestao de relacionamento com parceiros, rastreio de indicacoes, nem visibilidade de performance por parceiro.

## Visao (baseada no flowchart)

```text
Partner Hub (Admin)
  |-- Cadastro rapido de Partner
  |-- BD de Partners (nome, empresa, zona, tipo)
  |-- Segmentacao por Service Zone
  |-- Gestao de relacionamento (status, ultimo contato, proxima acao)
  |-- Revisao mensal (Top Parceiros, Em Risco, Por Regiao)
  |
  |-- Partner indicou job?
       |-- Sim --> Criar Lead no CRM linkado ao Partner
       |-- Lead qualificado? --> Site Visit --> Proposal --> Project
       |-- Job Completed --> Referral Program --> Loop
```

## Solucao

### 1. Nova tabela `partners`

Campos:
- `id` (uuid, PK)
- `company_name` (text, NOT NULL) — nome da empresa
- `contact_name` (text, NOT NULL) — nome do contato principal
- `email` (text)
- `phone` (text)
- `partner_type` (text, default 'builder') — builder, realtor, gc, designer
- `service_zone` (text, default 'core') — core, north_ring, outer, ny
- `status` (text, default 'active') — active, inactive, prospect, churned
- `last_contacted_at` (timestamptz)
- `next_action_date` (date)
- `next_action_note` (text)
- `total_referrals` (integer, default 0)
- `total_converted` (integer, default 0)
- `notes` (text)
- `created_at`, `updated_at` (timestamptz)

RLS: admin full access, authenticated read.

### 2. Vincular leads a partners

Adicionar coluna `referred_by_partner_id` (uuid, nullable) na tabela `leads`. Quando um partner indica um job, o lead criado fica linkado ao partner.

### 3. Nova pagina `/admin/partners`

**Layout**: AdminLayout com titulo "Parceiros"

**Blocos**:
- **Stats Bar**: Total Partners, Indicacoes este mes, Taxa de conversao, Partners em risco (sem contato 30d+)
- **Filtros**: Por tipo (Builder/Realtor/GC), por zona, por status
- **Lista/Grid de Partners**: Cards ou tabela com nome, empresa, zona, status, ultimo contato, total indicacoes
- **Quick Actions**: Novo Partner, Registrar Indicacao (cria lead linkado), Registrar Contato

**Modais**:
- `NewPartnerDialog` — formulario de cadastro rapido
- `PartnerDetailModal` — detalhes, historico de indicacoes, timeline de contatos, acoes

### 4. Sidebar

Adicionar "Partners" no grupo MANAGE, com icone `Handshake`:
```text
MANAGE
  Leads
  Partners  <-- novo
  Catalog
  Feed
```

### 5. Rota

Adicionar `/admin/partners` no App.tsx com ProtectedRoute.

## Arquivos a criar
- `supabase/migrations/` — tabela partners + coluna referred_by_partner_id em leads
- `src/pages/admin/Partners.tsx` — pagina principal
- `src/components/admin/NewPartnerDialog.tsx` — modal de cadastro
- `src/components/admin/PartnerDetailModal.tsx` — modal de detalhes
- `src/hooks/admin/usePartnersData.ts` — hook de dados

## Arquivos a modificar
- `src/App.tsx` — nova rota
- `src/components/admin/AdminSidebar.tsx` — item no grupo MANAGE
- `src/components/admin/MobileBottomNav.tsx` — quick action "Novo Partner"
- `src/components/admin/NewLeadDialog.tsx` — campo opcional "Indicado por Partner" (select)

## O que NAO muda
- Pipeline de Vendas permanece focado em leads/clientes
- Tabela `leads` continua como esta (apenas ganha coluna de referencia)
- Paginas publicas `/builders` e `/realtors` continuam funcionando normalmente

## Fase 1 (este PR)
- Tabela + pagina + CRUD basico + sidebar
- Vinculo lead <-> partner

## Fase 2 (futuro)
- Dashboard de performance por partner
- Comissoes e referral tracking automatico
- Views mensais (Top Parceiros, Em Risco)
- Integracao com Notion para sync

## Detalhes Tecnicos

### Service Zones
```typescript
const SERVICE_ZONES = {
  core: "Core (Central NJ)",
  north_ring: "North Ring",
  outer: "Outer NJ",
  ny: "New York",
};
```

### Partner Types
```typescript
const PARTNER_TYPES = {
  builder: "Builder",
  realtor: "Realtor",
  gc: "General Contractor",
  designer: "Designer",
};
```

### Partner Statuses
```typescript
const PARTNER_STATUSES = {
  prospect: "Prospect",
  active: "Ativo",
  inactive: "Inativo",
  churned: "Perdido",
};
```
