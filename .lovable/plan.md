## Suporte a pagamento por Diária OU SqFt no Timesheet

Hoje o módulo "Minhas Horas" só registra **diárias**. Vamos adicionar um segundo modelo de pagamento — **por sqft** — escolhido pelo colaborador em cada lançamento, com a rate definida no projeto. Diária e SqFt podem coexistir no mesmo dia/projeto como lançamentos separados.

---

### 1. Database (migration)

**`labor_entries` — adicionar:**
- `pay_mode text not null default 'daily'` → `'daily' | 'sqft'`
- `sqft_worked numeric` → quantidade de sqft (nullable, só usado quando `pay_mode='sqft'`)
- `sqft_rate numeric` → rate aplicada na hora do lançamento (snapshot, vem do projeto)
- CHECK: se `pay_mode='daily'` exige `daily_rate` e `days_worked`; se `'sqft'` exige `sqft_rate` e `sqft_worked`

**`total_cost` (coluna gerada):** atualizar fórmula para
- `daily` → `daily_rate * days_worked`
- `sqft` → `sqft_rate * sqft_worked`

**`projects` — adicionar:**
- `labor_sqft_rate numeric` → rate padrão por sqft daquele projeto (admin define quando o install é negociado assim). Nullable.

Trigger `sync_labor_entries_to_job_costs` mantém-se igual (já soma `total_cost` aprovado).

---

### 2. Admin: definir SqFt rate no projeto

No **ProjectDetailPanel** (ou seção Financial do job detail), adicionar campo:
- "Labor SqFt Rate" (input em $/sqft) — opcional, só preenchido quando o projeto será pago por sqft.
- Mostrar abaixo: "Colaboradores poderão lançar trabalho por sqft usando essa rate."

---

### 3. Collaborator: novo formulário com toggle

Em `CollaboratorTimesheet.tsx`, dentro do form "Novo lançamento":

```
[ Diária | SqFt ]   ← toggle (segmented control)

Se Diária (atual):
  - Data, Dias trabalhados (0.5, 1, 1.5...)
  - Mostra: rate $X/dia (do perfil) → total $Y

Se SqFt:
  - Data, SqFt trabalhado (numérico)
  - Mostra: rate $X/sqft (do projeto) → total $Y
  - Se projeto não tem sqft_rate: bloqueia com mensagem
    "Este projeto não está configurado para pagamento por sqft.
     Peça ao admin para definir a rate, ou lance como diária."
```

Histórico: cada card mostra badge `Diária` ou `SqFt` ao lado do valor, e o cálculo apropriado.

KPI strip vira 3 cards:
- Pendentes (count)
- Aprovado (total $ — soma daily + sqft)
- Este mês (total $ aprovado no mês corrente)

---

### 4. Admin: tela de Approvals

Em `TimesheetApprovals.tsx`, mostrar para cada entry pendente:
- Badge `Diária 1.0d × $X` ou `SqFt 250 × $0.80`
- Total calculado
- Resto do fluxo (aprovar / rejeitar com motivo) permanece igual

---

### 5. Hook `useTimesheet.ts`

`useSubmitTimesheet` aceita:
```ts
{
  project_id, work_date, notes?,
  pay_mode: 'daily' | 'sqft',
  days_worked?: number,    // se daily
  sqft_worked?: number,    // se sqft
}
```
- Se `daily`: busca `daily_rate` do profile (como hoje).
- Se `sqft`: busca `labor_sqft_rate` do projeto; falha se null.

Atualizar `TimesheetEntry` type com os novos campos.

---

### 6. Memory

Atualizar `mem://features/management/crews-and-payroll-hub` (ou criar `mem://features/timesheet-pay-modes`) registrando: "Timesheet suporta 2 modelos por lançamento: Diária (rate do perfil) e SqFt (rate por projeto). Coexistem no mesmo dia/projeto."

---

### Out of scope (não fazer agora)
- Lote/bulk approval
- Edição de entry aprovado
- Histórico paginado além dos 60 dias
- Relatórios cross-collaborator
- API pública (mantém roadmap dual-SaaS)
