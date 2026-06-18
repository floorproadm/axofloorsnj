
# 🥇 One-Tap Invoice from Job

Eliminar 100% da digitação na criação de invoice quando o job já tem proposta aceita. Hoje, mesmo com proposal aprovado, o usuário precisa abrir formulário, escolher datas, digitar line items e preço. O sistema já tem tudo isso.

---

## 🎯 Comportamento alvo

Dentro do `JobDetail`, na seção **Invoices & Payments**, substituir o botão genérico `+ New Invoice` por um botão inteligente que muda conforme o contexto:

```text
┌─────────────────────────────────────────────────┐
│  💡 Generate Deposit Invoice  ·  $5,400 (30%)   │   ← contextual
└─────────────────────────────────────────────────┘
  ⌄ Custom invoice
```

### Lógica de detecção (em ordem)
1. Se **proposal aceito** existe e **nenhuma invoice** ainda → sugere **Deposit (30%)**
2. Se **deposit já pago** e job `in_progress` → sugere **Progress (40%)**
3. Se job `completed` e progress pago → sugere **Final (30%)**
4. Se todas as 3 fases já foram geradas → mostra apenas "Custom invoice"

### 1-tap action
Ao clicar no botão sugerido:
- Cria invoice com:
  - `amount` = % da proposta aceita
  - `due_date` = hoje + 7 dias (deposit) / hoje + 14 dias (progress/final)
  - `invoice_number` auto-gerado
  - `customer_id`, `project_id`, `property_id` herdados do job
  - 1 line item descritivo: `"Deposit — [Project Type] at [Address]"`
  - `status` = `draft`
- Toast com 2 ações: **"Send now"** (dispara email) e **"View"** (abre details sheet)
- Realtime: lista de invoices atualiza sem reload

### Fallback "Custom invoice"
Link discreto abaixo do botão sugerido abre o `InlineInvoiceForm` atual (não removemos — fica para casos avulsos).

---

## 📋 Checklist técnico

### 1. Hook novo `useSuggestedInvoice(projectId)`
- Lê `projects` (status, total_price), `proposals` (aceito mais recente, total), `invoices` (existentes por fase)
- Retorna: `{ phase: 'deposit'|'progress'|'final'|null, amount, percentage, label, dueInDays }`
- Usa `company_settings.default_payment_schedule` se existir, senão 30/40/30

### 2. Componente `SmartInvoiceCTA`
- Substitui o botão "+ New Invoice" em `InvoicesPaymentsSection`
- Renderiza botão primário com fase sugerida + valor formatado
- Link secundário "Custom invoice" abre o form atual

### 3. Função `createInvoiceFromPhase`
- Wrapper sobre `useCreateInvoice` que monta payload a partir do hook
- Após sucesso: toast com ação **Send now** que dispara `sendGmailEmail('invoice_sent', ...)` (lógica já existe em `handleSendInvoice`)

### 4. Marcação de fase
- Adicionar campo `phase` (TEXT: 'deposit'|'progress'|'final'|'custom') na tabela `invoices` para evitar duplicação de detecção
- Migration: `ALTER TABLE invoices ADD COLUMN phase TEXT`

### 5. (Opcional) Replicar CTA em outros lugares
- `ProjectDetailPanel` (side sheet do Pipeline) — mesmo componente
- Quick action no Dashboard quando job `awaiting_payment` aparece em Mission Control

---

## 🚫 O que **não** muda nesta fase
- `NewInvoiceDialog` global em `/admin/payments` (permanece para casos sem job)
- `InvoiceDetailsSheet` (assunto separado — simplificação fica para próxima rodada)
- Schema de `invoice_payment_schedule` (já existe e continua funcionando)
- Fluxo público `/invoice/:token`

---

## 📊 Impacto esperado
| Métrica | Antes | Depois |
|---|---|---|
| Toques pra criar deposit invoice | ~12 (abrir form, escolher proj, digitar items, datas, salvar) | **2** (botão + Send) |
| Tempo médio | 60-90s | ~5s |
| Erro humano (valor errado/data) | Frequente | Eliminado (calculado do proposal) |
| Invoices que saem no mesmo dia que proposal é assinado | Raro | Default |

---

## ❓ Decisões antes de implementar

1. **Percentuais**: usar 30/40/30 fixo, ou ler de `company_settings`? (recomendo: ler de settings com fallback 30/40/30)
2. **Auto-send**: após criar deposit, mandar email automaticamente ou exigir clique "Send now"? (recomendo: clique manual — controle)
3. **Onde colocar primeiro**: só `JobDetail`, ou já levar para `ProjectDetailPanel` (Pipeline side sheet) também?
