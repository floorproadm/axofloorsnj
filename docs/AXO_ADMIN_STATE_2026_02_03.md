# CHECKPOINT OFICIAL: AXO_ADMIN_STATE_2026_02_03

> **Data**: 2026-02-03  
> **Tipo**: Estado Real do Sistema  
> **Status**: ✅ CHECKPOINT ATIVO  

---

## ⚠️ REGRAS DE USO DESTE DOCUMENTO

1. **Este checkpoint representa o estado REAL do sistema**
2. **Nenhuma lógica, trigger, validação ou fluxo descrito aqui deve ser recriado ou duplicado**
3. **Qualquer próximo prompt deve assumir este checkpoint como fonte da verdade**
4. **Antes de implementar qualquer funcionalidade, verificar se já existe aqui**

---

## PARTE 1 — MAPA DO /ADMIN

| Rota | Função Principal | Entidade Central |
|------|------------------|------------------|
| `/admin` | Dashboard com alertas de tensão e métricas | `leads`, `projects`, `job_proof` |
| `/admin/leads` | Gerenciamento de leads e pipeline linear | `leads`, `customers`, `projects`, `job_costs`, `job_proof` |
| `/admin/gallery` | Gerenciamento de galeria de projetos | `gallery_projects`, `gallery_folders` |
| `/auth` | Autenticação e recuperação de senha | `profiles`, `user_roles` |

---

## PARTE 2 — REGRAS DE NEGÓCIO ATIVAS

### 2.1 Lead Pipeline Linear

| Aspecto | Detalhe |
|---------|---------|
| **Nome** | Pipeline de 6 estágios obrigatório |
| **Onde aplicada** | Backend (`validate_lead_transition`), Frontend (`useLeadPipeline.ts`) |
| **Ação BLOQUEADA** | Transições que pulam etapas |
| **Condição que libera** | Seguir ordem: `new_lead` → `appt_scheduled` → `proposal` → `in_production` → `completed`/`lost` |

### 2.2 Bloqueio de Proposta sem Margem

| Aspecto | Detalhe |
|---------|---------|
| **Nome** | Gate de margem mínima para proposta |
| **Onde aplicada** | Backend (`validate_proposal_margin`), Frontend (`useProposalValidation.ts`) |
| **Ação BLOQUEADA** | Gerar/enviar proposta |
| **Condição que libera** | `margin_percent` >= `company_settings.default_margin_min_percent` |

### 2.3 Follow-up Obrigatório

| Aspecto | Detalhe |
|---------|---------|
| **Nome** | Follow-up forçado para leads em "proposal" |
| **Onde aplicada** | Backend (trigger `set_follow_up_on_quoted`), Frontend (`useLeadFollowUp.ts`) |
| **Ação BLOQUEADA** | Transição para `in_production` ou `lost` |
| **Condição que libera** | `follow_up_actions` contém pelo menos 1 registro |

### 2.4 JobProof Obrigatório

| Aspecto | Detalhe |
|---------|---------|
| **Nome** | Bloqueio de conclusão sem prova visual |
| **Onde aplicada** | Backend (trigger `enforce_job_proof_on_completion`), Frontend (`useJobProof.ts`) |
| **Ação BLOQUEADA** | `project_status = 'completed'` |
| **Condição que libera** | Existir `before_image_url` E `after_image_url` em `job_proof` |

### 2.5 Cálculo Automático de Custos

| Aspecto | Detalhe |
|---------|---------|
| **Nome** | Campos computados em job_costs |
| **Onde aplicada** | Backend (colunas `GENERATED ALWAYS AS`) |
| **Campos calculados** | `total_cost`, `margin_percent`, `profit_amount` |
| **Input necessário** | `labor_cost`, `material_cost`, `additional_costs`, `estimated_revenue` |

### 2.6 Singleton de Company Settings

| Aspecto | Detalhe |
|---------|---------|
| **Nome** | Única linha de configurações |
| **Onde aplicada** | Backend (constraint UNIQUE) |
| **Campos críticos** | `default_margin_min_percent`, `default_labor_rate`, `labor_pricing_model` |

### 2.7 Audit Log

| Aspecto | Detalhe |
|---------|---------|
| **Nome** | Registro de eventos bloqueados |
| **Onde aplicada** | Backend (functions de validação) |
| **Eventos registrados** | `PROPOSAL_BLOCKED`, `COMPLETION_BLOCKED` |

---

## PARTE 3 — NON-NEGOTIABLES (ESTADO REAL)

### ✅ 1. Margem Visível Antes do Close
- **Status**: IMPLEMENTADO
- **Backend**: `job_costs` (colunas geradas), `calculate_job_margin()`, `validate_proposal_margin()`
- **Frontend**: `useJobCosts.ts`, `JobMarginDisplay.tsx`, `useProposalValidation.ts`
- **Entidade**: `projects` → `job_costs` → `company_settings`

### ✅ 2. Proposta Good/Better/Best
- **Status**: IMPLEMENTADO
- **Backend**: `validate_proposal_margin()` bloqueia se margem < mínimo
- **Frontend**: `useProposalGeneration.ts`, `ProposalGenerator.tsx`
- **Tiers**: Good (30%), Better (38%), Best (45%) — configuráveis
- **Entidade**: `projects` → `job_costs`

### ✅ 3. Follow-up Forçado
- **Status**: IMPLEMENTADO
- **Backend**: Trigger `set_follow_up_on_quoted`, `validate_lead_transition()`
- **Frontend**: `useLeadFollowUp.ts`, `LeadFollowUpAlert.tsx`
- **Campo**: `leads.follow_up_actions` (JSONB array)
- **Entidade**: `leads`

### ✅ 4. JobProof Obrigatório
- **Status**: IMPLEMENTADO
- **Backend**: Trigger `enforce_job_proof_on_completion`, `validate_project_completion()`
- **Frontend**: `useJobProof.ts`, `JobProofUploader.tsx`
- **Storage**: Bucket `job-proof`
- **Entidade**: `projects` → `job_proof`

---

## PARTE 4 — FLUXOS CRÍTICOS

### Fluxo 1: Lead → Projeto

```
[new_lead] → [appt_scheduled] → [proposal] → [in_production] → [completed/lost]
```

| Passo | Obrigatório | Sistema força/bloqueia |
|-------|-------------|------------------------|
| Criar lead | ✅ | - |
| Agendar visita | ✅ | Transição linear obrigatória |
| Associar projeto | ✅ Manual | `converted_to_project_id` deve existir para `proposal` |
| Calcular margem | ✅ | Gate de margem bloqueia proposta |

**⚠️ IMPORTANTE**: Conversão Lead → Project é **MANUAL**. Não existe UI de conversão automática.

### Fluxo 2: Projeto → Proposta

| Passo | Obrigatório | Sistema força/bloqueia |
|-------|-------------|------------------------|
| Criar projeto | ✅ | - |
| Inserir custos em `job_costs` | ✅ | Campos calculados automaticamente |
| Verificar margem | ✅ | `validate_proposal_margin()` bloqueia se < mínimo |
| Gerar proposta 3-tier | ✅ | `ProposalGenerator` aplica % por tier |

**⚠️ IMPORTANTE**: Propostas são geradas em memória. **NÃO são persistidas** no banco.

### Fluxo 3: Proposta → Follow-up

| Passo | Obrigatório | Sistema força/bloqueia |
|-------|-------------|------------------------|
| Lead entra em `proposal` | ✅ | Trigger seta `follow_up_required = true` |
| Registrar follow-up | ✅ | `addFollowUpAction()` adiciona ao JSONB |
| Transição para `in_production`/`lost` | ✅ | Bloqueado se `follow_up_actions` vazio |

### Fluxo 4: Projeto → Completed

| Passo | Obrigatório | Sistema força/bloqueia |
|-------|-------------|------------------------|
| Projeto em `in_progress` | ✅ | - |
| Upload foto BEFORE | ✅ | `JobProofUploader` |
| Upload foto AFTER | ✅ | `JobProofUploader` |
| Marcar como `completed` | ✅ | Trigger **BLOQUEIA** sem JobProof |

**⚠️ TRIGGER INCONTORNÁVEL**: Não existe bypass. Sem before+after, projeto NÃO pode ser completed.

---

## PARTE 5 — MODELO DE DADOS

### Tabelas Ativas no /admin

| Tabela | Finalidade | Relacionamentos | Campos Críticos |
|--------|-----------|-----------------|-----------------|
| `leads` | Leads capturados | → `customers`, → `projects` | `status`, `follow_up_actions`, `converted_to_project_id` |
| `projects` | Projetos em execução | → `customers`, → `job_costs`, → `job_proof` | `project_status`, `customer_id` |
| `customers` | Dados de clientes | ← `leads`, ← `projects` | `email`, `phone`, `full_name` |
| `job_costs` | Custos e margem | → `projects` | `labor_cost`, `material_cost`, `margin_percent` (gerado) |
| `job_proof` | Fotos before/after | → `projects` | `before_image_url`, `after_image_url` |
| `company_settings` | Configurações globais | - | `default_margin_min_percent`, `labor_pricing_model` |
| `gallery_projects` | Galeria pública | → `gallery_folders` | `image_url`, `category` |
| `gallery_folders` | Organização galeria | ← `gallery_projects` | `name`, `cover_image_url` |
| `audit_log` | Log de eventos | - | `operation_type`, `table_accessed` |
| `profiles` | Perfis de usuário | → `auth.users` | `user_id`, `full_name` |
| `user_roles` | RBAC | → `auth.users` | `user_id`, `role` |

### Tabelas NÃO usadas ativamente

| Tabela | Status |
|--------|--------|
| `appointments` | Existe mas sem UI |
| `quiz_responses` | Dados absorvidos por `leads` |

---

## PARTE 6 — O QUE NÃO EXISTE

### Funcionalidades NÃO implementadas

- ❌ Conversão automática Lead → Project (botão/UI)
- ❌ Envio real de propostas (email, WhatsApp, DocuSign)
- ❌ Dashboard visual abrangente (apenas 3 cards de tensão)
- ❌ Calendário de agendamentos (UI para `appointments`)
- ❌ Página de gerenciamento de clientes (`customers`)
- ❌ Edição inline de leads/projetos
- ❌ Drag-and-drop no pipeline
- ❌ Filtros avançados (status, data, source)
- ❌ Botão de exportação CSV visível
- ❌ UI para editar `company_settings`
- ❌ UI para gerenciar `job_costs` diretamente
- ❌ Aba "Table" na página de leads (removida)

### Suposições ERRADAS que devem ser evitadas

| Suposição Errada | Realidade |
|------------------|-----------|
| "Propostas são salvas no banco" | São geradas em memória apenas |
| "Lead.status pode ser qualquer valor" | Pipeline linear obrigatório |
| "Posso marcar projeto como completed a qualquer momento" | Trigger bloqueia sem JobProof |
| "job_costs.margin_percent pode ser editado" | É campo GENERATED |
| "company_settings pode ter múltiplas linhas" | É singleton |
| "appointments é usado na UI" | Tabela existe mas sem uso |
| "Pipeline é Kanban arrastável" | É linear vertical |

---

## PARTE 7 — CHECKPOINT FINAL

### Classificação do Sistema

> **O /admin é um SISTEMA OPERACIONAL COM ENFORCEMENT**
> 
> Não é apenas dashboard informativo. Possui gates, bloqueios e validações server-side que impedem ações inválidas.

### 10 REGRAS CRÍTICAS PARA CONTINUIDADE

1. **Pipeline de leads é LINEAR e RIGOROSO** — Não pule etapas. Ordem: new_lead → appt_scheduled → proposal → in_production → completed/lost

2. **JobProof é MANDATÓRIO para completed** — Trigger server-side bloqueia. Não existe bypass.

3. **Propostas exigem margem mínima** — `validate_proposal_margin()` bloqueia se abaixo de `company_settings.default_margin_min_percent`

4. **Follow-up é FORÇADO para proposal** — Sem registro em `follow_up_actions`, não transiciona para in_production/lost

5. **RBAC é ativo** — Acesso admin baseado em `user_roles` e `has_role()`

6. **Dados de cliente centralizados** — Use `customer_id` para referenciar

7. **company_settings é SINGLETON** — Apenas 1 linha permitida

8. **job_costs tem campos CALCULADOS** — `total_cost`, `margin_percent`, `profit_amount` são gerados automaticamente

9. **appointments e quiz_responses não têm UI** — Tabelas existem mas não são gerenciadas

10. **Todas as validações são SERVER-SIDE** — UI apenas reflete e guia. Backend é a autoridade final.

---

## ASSINATURA DO CHECKPOINT

```
Checkpoint: AXO_ADMIN_STATE_2026_02_03
Gerado em: 2026-02-03
Status: ATIVO
Próximos prompts: DEVEM usar este documento como fonte da verdade
```

---

**FIM DO CHECKPOINT**
