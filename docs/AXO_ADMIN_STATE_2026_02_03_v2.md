# CHECKPOINT OFICIAL: AXO_ADMIN_STATE_2026_02_03_v2

> **Data**: 2026-02-03  
> **Versão**: v2 (Atualizado após sessão de refinamento)  
> **Status**: ✅ CHECKPOINT ATIVO  

---

## 📋 RESUMO DAS MUDANÇAS DESTA SESSÃO

### Alterações Realizadas em 2026-02-03

1. **Dashboard Executivo Refinado**
   - ❌ Removido: Card "Bloqueados por JobProof" da seção Execução
   - ✅ Motivo: JobProof é enforcement server-side, não precisa de alerta preventivo
   - ✅ Resultado: Seção Execução agora com 2 cards (grid 2 colunas)

2. **Filosofia de Alertas Consolidada**
   - Dashboard exibe apenas bloqueios que impedem ação imediata
   - Alertas preventivos eliminados (anti-fadiga de alertas)
   - Enforcement real permanece no backend (triggers)

3. **Footer do Dashboard Atualizado**
   - Removida referência a `job_proof` nas fontes de dados
   - Fontes atuais: `leads`, `projects`, `job_costs`, `company_settings`

---

## PARTE 1 — ARQUITETURA DO /ADMIN

### 1.1 Mapa de Rotas

| Rota | Função | View Type | Entidades |
|------|--------|-----------|-----------|
| `/admin` | Dashboard executivo | Read-only | `leads`, `projects`, `job_costs`, `company_settings` |
| `/admin/leads` | Pipeline linear + gestão | Read/Write | `leads`, `customers`, `projects`, `job_costs`, `job_proof` |
| `/admin/gallery` | Galeria de projetos | Read/Write | `gallery_projects`, `gallery_folders` |
| `/auth` | Autenticação | Read/Write | `profiles`, `user_roles` |

### 1.2 Dashboard — 6 Blocos Operacionais

| Bloco | Conteúdo | Cores Semânticas |
|-------|----------|------------------|
| **Alertas Críticos** | Leads bloqueados, stalled >48h | 🔴 Vermelho |
| **Dinheiro no Pipeline** | Leads ativos, receita estimada, pipeline velocity | 🟢/🟡 |
| **Funil de Leads** | Conversão 30 dias por estágio | Neutral |
| **Saúde de Margem** | Média de margem, projetos abaixo do mínimo | 🟢/🔴 |
| **Execução** | Jobs em produção, prontos para concluir | 🟢/🟡 |
| **Captação** | Top sources, taxas de conversão | Neutral |

---

## PARTE 2 — REGRAS DE NEGÓCIO ATIVAS

### 2.1 Pipeline Linear (6 Estágios)

```
new_lead → appt_scheduled → proposal → in_production → completed/lost
```

| Transição | Requisito | Enforcement |
|-----------|-----------|-------------|
| → appt_scheduled | Nenhum | Linear |
| → proposal | `converted_to_project_id` + margem calculada | Backend |
| → in_production | `follow_up_actions.length > 0` | Backend |
| → completed | JobProof (before + after) | Backend TRIGGER |
| → lost | `follow_up_actions.length > 0` | Backend |

### 2.2 Gates de Bloqueio (Server-Side)

| Gate | Função Backend | Trigger/Function |
|------|----------------|------------------|
| **Margem Mínima** | `validate_proposal_margin()` | Function |
| **Follow-up Obrigatório** | `validate_lead_transition()` | Function |
| **JobProof Obrigatório** | `enforce_job_proof_on_completion` | BEFORE UPDATE Trigger |
| **Pipeline Linear** | `validate_lead_transition()` | Function |

### 2.3 Campos Calculados (Generated Columns)

Tabela `job_costs`:
- `total_cost` = `labor_cost + material_cost + additional_costs`
- `margin_percent` = `((estimated_revenue - total_cost) / estimated_revenue) * 100`
- `profit_amount` = `estimated_revenue - total_cost`

---

## PARTE 3 — NON-NEGOTIABLES (STATUS ATUAL)

| # | Requisito | Status | Backend | Frontend |
|---|-----------|--------|---------|----------|
| 1 | Margem visível antes do close | ✅ | `job_costs`, `calculate_job_margin()` | `JobMarginDisplay.tsx` |
| 2 | Proposta Good/Better/Best | ✅ | `validate_proposal_margin()` | `ProposalGenerator.tsx` |
| 3 | Follow-up forçado | ✅ | Trigger `set_follow_up_on_quoted` | `LeadFollowUpAlert.tsx` |
| 4 | JobProof obrigatório | ✅ | Trigger `enforce_job_proof_on_completion` | `JobProofUploader.tsx` |

---

## PARTE 4 — MODELO DE DADOS

### 4.1 Tabelas Ativas

```
leads ──────────┬──► customers
                │
                └──► projects ──┬──► job_costs (1:1)
                                │
                                └──► job_proof (1:N)

company_settings (singleton)
user_roles ──► auth.users
profiles ──► auth.users
gallery_projects ──► gallery_folders
audit_log (standalone)
```

### 4.2 Campos Críticos

| Tabela | Campo | Tipo | Uso |
|--------|-------|------|-----|
| `leads` | `status` | enum | Pipeline stage |
| `leads` | `follow_up_actions` | JSONB[] | Histórico de follow-ups |
| `leads` | `converted_to_project_id` | UUID | Link para projeto |
| `projects` | `project_status` | enum | Status do projeto |
| `job_costs` | `margin_percent` | GENERATED | Cálculo automático |
| `job_proof` | `before_image_url` | TEXT | Gate de conclusão |
| `job_proof` | `after_image_url` | TEXT | Gate de conclusão |
| `company_settings` | `default_margin_min_percent` | NUMERIC | Threshold de margem |

---

## PARTE 5 — FILOSOFIA DE ALERTAS

### Princípio Anti-Fadiga

> **Alertas existem para desbloqueio imediato, não para lembretes preventivos.**

| Tipo | Exibir? | Motivo |
|------|---------|--------|
| Lead sem resposta >48h | ✅ SIM | Ação necessária agora |
| Proposta sem follow-up | ✅ SIM | Bloqueia transição |
| Projeto em produção sem JobProof | ❌ NÃO | Trigger bloqueia no momento certo |
| Margem abaixo do mínimo | ✅ SIM | Bloqueia envio de proposta |

### Cores Semânticas

| Estado | Cor | CSS Variable |
|--------|-----|--------------|
| Bloqueado | Vermelho | `--state-blocked` |
| Risco | Âmbar | `--state-risk` |
| OK | Verde | `--state-success` |

---

## PARTE 6 — HOOKS E COMPONENTES

### 6.1 Hooks Principais

| Hook | Função | Dependências |
|------|--------|--------------|
| `useDashboardData` | Métricas do dashboard | leads, projects, job_costs |
| `useLeadPipeline` | Transições de status | leads, validate_lead_transition |
| `useLeadFollowUp` | Gestão de follow-ups | leads.follow_up_actions |
| `useJobCosts` | CRUD de custos | job_costs |
| `useJobProof` | Upload before/after | job_proof, storage |
| `useProposalGeneration` | Gera 3 tiers | job_costs, company_settings |
| `useProposalValidation` | Valida margem | validate_proposal_margin |
| `useCompanySettings` | Singleton settings | company_settings |

### 6.2 Componentes Chave

| Componente | Localização | Função |
|------------|-------------|--------|
| `TensionMetricsCards` | Dashboard | Cards de tensão operacional |
| `LinearPipeline` | Leads | Pipeline vertical 6 estágios |
| `LeadControlModal` | Leads | Centro de controle por lead |
| `JobMarginDisplay` | Modal | Exibe margem calculada |
| `ProposalGenerator` | Modal | Gera Good/Better/Best |
| `JobProofUploader` | Modal | Upload before/after |
| `LeadFollowUpAlert` | Modal | Indica follow-up pendente |

---

## PARTE 7 — O QUE NÃO EXISTE

### Funcionalidades Ausentes

- ❌ Conversão automática Lead → Project (UI)
- ❌ Envio real de propostas (email, WhatsApp, DocuSign)
- ❌ Calendário de agendamentos (appointments sem UI)
- ❌ Página de gestão de clientes
- ❌ Drag-and-drop no pipeline
- ❌ Filtros avançados na lista de leads
- ❌ UI para company_settings
- ❌ UI para job_costs diretamente

### Suposições ERRADAS a Evitar

| ❌ Errado | ✅ Correto |
|-----------|------------|
| Propostas são persistidas | Geradas em memória |
| Status pode ser qualquer valor | Pipeline linear rigoroso |
| Completed sem JobProof | Trigger bloqueia server-side |
| job_costs.margin_percent editável | Campo GENERATED |
| company_settings múltiplas linhas | Singleton |
| Pipeline é Kanban arrastável | Linear vertical |

---

## PARTE 8 — REGRAS CRÍTICAS PARA CONTINUIDADE

### 10 Mandamentos do AXO OS

1. **Pipeline é LINEAR** — new_lead → appt_scheduled → proposal → in_production → completed/lost

2. **JobProof é INCONTORNÁVEL** — Trigger server-side, sem bypass

3. **Margem mínima bloqueia proposta** — validate_proposal_margin()

4. **Follow-up obrigatório para proposal** — Sem ele, não avança

5. **RBAC ativo** — user_roles + has_role()

6. **Dados centralizados em customers** — Use customer_id

7. **company_settings é SINGLETON** — Única linha

8. **job_costs tem campos GENERATED** — Não edite manualmente

9. **Dashboard é READ-ONLY** — Zero ações permitidas

10. **Backend é autoridade final** — UI apenas guia, triggers decidem

---

## ASSINATURA DO CHECKPOINT

```
Checkpoint: AXO_ADMIN_STATE_2026_02_03_v2
Gerado em: 2026-02-03
Sessão: Refinamento de Dashboard + Remoção JobProof Alert
Status: ATIVO
Substitui: AXO_ADMIN_STATE_2026_02_03.md
```

---

**FIM DO CHECKPOINT v2**
