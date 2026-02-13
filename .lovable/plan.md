

# Plano: Adicionar Mais Stages ao Pipeline de Vendas

## Contexto Atual

O pipeline atual tem **6 stages** no banco de dados:
```text
new_lead -> appt_scheduled -> proposal -> in_production -> completed / lost
```

O **Pipeline de Vendas** (UI) exibe apenas 3 colunas: `new_lead`, `appt_scheduled`, `proposal`.
O **Pipeline Operacional** (Jobs) exibe: `pending`, `in_production`, `completed`.

A imagem de referencia mostra 7 colunas estilo CRM:
- Cold Leads, Warm Leads, Estimate Requested, Estimate Scheduled, In Draft, Proposal Sent, Proposal Rejected

---

## O Que Precisa Mudar (Escopo Completo)

### 1. Banco de Dados (Migration)

Atualmente o trigger `axo_validate_lead_transition` hardcoda as transicoes validas. Precisamos:

- **Adicionar novos valores de status** na tabela `leads` (o campo `status` e TEXT, nao enum, entao nao precisa ALTER TYPE)
- **Reescrever o trigger `axo_validate_lead_transition`** para aceitar os novos stages e a nova ordem
- **Atualizar a RPC `get_lead_nra`** para mapear os novos stages para acoes corretas
- **Atualizar `validate_lead_transition`** (a funcao RPC antiga que ainda usa `new/contacted/quoted/won/lost`)
- **Atualizar `set_follow_up_on_quoted`** para funcionar com o novo nome de stage equivalente
- **Atualizar `STATUS_MAP`** no frontend para compatibilidade com leads existentes

### 2. Novos Stages Propostos

Baseado na imagem de referencia, adaptado para o fluxo AXO:

| Stage Key | Label (UI) | Transicoes Permitidas |
|-----------|------------|----------------------|
| `cold_lead` | Cold Lead | -> `warm_lead` |
| `warm_lead` | Warm Lead | -> `estimate_requested` |
| `estimate_requested` | Estimate Requested | -> `estimate_scheduled` |
| `estimate_scheduled` | Estimate Scheduled | -> `in_draft` |
| `in_draft` | In Draft | -> `proposal_sent` |
| `proposal_sent` | Proposal Sent | -> `in_production`, `proposal_rejected` |
| `proposal_rejected` | Proposal Rejected | -> (terminal, ou reabrir para `in_draft`) |
| `in_production` | In Production | -> `completed`, `lost` |
| `completed` | Completed | (terminal) |
| `lost` | Lost | (terminal) |

### 3. Migracao de Dados

Leads existentes precisam ser mapeados:

| Status Atual | Novo Status |
|-------------|------------|
| `new_lead` | `cold_lead` |
| `appt_scheduled` | `estimate_scheduled` |
| `proposal` | `proposal_sent` |
| `in_production` | `in_production` (mantido) |
| `completed` | `completed` (mantido) |
| `lost` | `lost` (mantido) |

### 4. Frontend - Arquivos Afetados

| Arquivo | Mudanca |
|---------|--------|
| `src/hooks/useLeadPipeline.ts` | Reescrever `PIPELINE_STAGES`, `STAGE_LABELS`, `STAGE_CONFIG`, `VALID_TRANSITIONS`, `STATUS_MAP` |
| `src/components/admin/LeadPipelineStatus.tsx` | Funciona automaticamente (usa hook) |
| `src/pages/admin/components/LinearPipeline.tsx` | Atualizar `SALES_STAGES` para os novos 7 stages de vendas, ajustar grid para 7 colunas |
| `src/pages/admin/Dashboard.tsx` | Atualizar referencias aos stages no funil |
| `src/hooks/admin/useDashboardData.ts` | Atualizar `activeStatuses` |
| `src/hooks/useLeadNRA.ts` | Sem mudanca (chama RPC) |

### 5. Backend - Funcoes a Reescrever

| Funcao | Mudanca |
|--------|--------|
| `axo_validate_lead_transition()` | Reescrever com novos stages e gates |
| `get_lead_nra()` | Reescrever mapeamento de NRA por stage |
| `validate_lead_transition()` | Deprecar ou reescrever (funcao antiga com `new/contacted/quoted`) |
| `set_follow_up_on_quoted()` | Adaptar para `proposal_sent` |
| `convert_lead_to_project()` | Ajustar se necessario |

### 6. Gates de Negocio (Manter/Adaptar)

| Gate | Stage Atual | Novo Stage |
|------|------------|-----------|
| Projeto linkado + margem | `proposal` | `in_draft` (antes de criar proposta) |
| Follow-up obrigatorio | saindo de `proposal` | saindo de `proposal_sent` |
| Proposta aceita para producao | `proposal -> in_production` | `proposal_sent -> in_production` |
| JobProof obrigatorio | `in_production -> completed` | mantido |

---

## Ordem de Execucao

```text
PASSO 1: Migration - Atualizar dados existentes (UPDATE leads SET status = ...)
PASSO 2: Migration - Reescrever triggers e RPCs
PASSO 3: Frontend - useLeadPipeline.ts (stages, labels, config, transitions)
PASSO 4: Frontend - LinearPipeline.tsx (7 colunas, scroll horizontal)
PASSO 5: Frontend - Dashboard.tsx + useDashboardData.ts (referencias)
PASSO 6: Testar E2E
```

---

## Riscos e Consideracoes

1. **Leads existentes no Live**: Se houver leads em producao, a migracao precisa ser rodada tambem no ambiente Live antes de publicar
2. **Complexidade do trigger**: Mais stages = mais validacoes no trigger
3. **Layout**: 7 colunas nao cabem em desktop sem scroll horizontal - o layout Kanban com scroll ja esta preparado para isso
4. **`proposal_rejected`**: Decidir se e terminal (lead morre) ou se pode voltar para `in_draft` para retrabalho

---

## Pergunta Para Voce

Antes de implementar, preciso confirmar: os **nomes dos stages na imagem de referencia** (Cold Leads, Warm Leads, Estimate Requested, etc.) sao exatamente os que voce quer, ou prefere adaptar os nomes para portugues ou para outro vocabulario?

