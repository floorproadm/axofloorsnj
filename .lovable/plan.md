

# Reorganizar Payments & Invoices — Integrar Payroll como Custo

## Problema Atual
- **Payments** tem apenas 2 opções: Income e Expense (labor/material/other)
- **Payroll** (folha de pagamento) fica isolado em Crews & Fleet
- O usuário precisa ver tudo junto: ganhos, gastos operacionais e custos de mão de obra (payroll) num único hub financeiro

## Proposta de Organização

O sistema financeiro passa a ter **3 categorias claras**:

```text
┌─────────────────────────────────────────────┐
│  PAYMENTS & INVOICES                        │
│                                             │
│  New Payment → 3 opções:                    │
│  ┌──────────────────┐                       │
│  │ 💰 Record Income │ Pagamento recebido    │
│  │ 📦 Record Expense│ Material / Other      │
│  │ 👷 Record Payroll│ Custo de mão de obra  │
│  └──────────────────┘                       │
│                                             │
│  Category pills:                            │
│  [All] [Income] [Payroll] [Material] [Other]│
│                                             │
│  Payroll entries from Crews & Fleet         │
│  aparecem automaticamente aqui também       │
└─────────────────────────────────────────────┘
```

## Mudanças Técnicas

### 1. PaymentActionSheet — Adicionar 3a opção "Record Payroll"
- Novo botão com ícone `Hammer` e descrição "Crew wages, daily rates, sub payments"
- Ao clicar, abre `NewPaymentDialog` com `defaultCategory = "labor"`
- Renomear "Record Expense" para focar em material/other

### 2. Category Pills em Payments.tsx
- Renomear "Received" → "Income"
- Renomear "Labor" → "Payroll"
- Manter "Material" e "Other"
- O filtro continua usando os mesmos valores do DB (`received`, `labor`, `material`, `other`)

### 3. MonthlyOverview — Renomear labels
- "Labor" → "Payroll" no display (o valor no DB continua `labor`)

### 4. NewPaymentDialog — Melhorar UX para Payroll
- Quando `defaultCategory = "labor"`:
  - Mostrar campo de **Payment Method** (cash, check, zelle, etc.) — hoje só aparece para income
  - Placeholder do description: "e.g. Crew wages week 1, John daily rate..."

### 5. Crews & Fleet Payroll — Referência cruzada
- Entries de payroll criadas em Crews & Fleet já usam `category: "labor"` na tabela `payments`
- Portanto, já aparecem automaticamente em Payments — sem mudança de dados necessária
- Adicionar um link sutil no Payroll tab de Crews que diga "View all in Payments →"

## O Que NÃO Muda
- Schema do banco (a coluna `category` já suporta `labor`)
- Hooks `usePayments` / `useCreatePayment`
- KPIs (payroll já é contado em "Total Out")
- Chart financeiro (payroll já aparece como Expenses)

## Resumo dos Arquivos
1. `src/components/admin/payments/PaymentActionSheet.tsx` — adicionar 3a opção Payroll
2. `src/pages/admin/Payments.tsx` — renomear labels nos pills
3. `src/components/admin/payments/MonthlyOverview.tsx` — renomear "Labor" → "Payroll"
4. `src/components/admin/payments/NewPaymentDialog.tsx` — mostrar payment method para labor
5. `src/pages/admin/CrewsVans.tsx` — link "View all in Payments →" no tab Payroll

