## Contexto

Análise E2E do MaidPad cruzada com o estado atual do AXO OS. A maioria dos pontos da proposta original já existe no AXO em versão mais robusta (pipeline 10 estágios, automation engine, invoice gen, reviews, RBAC, etc.). Após filtragem, 3 gaps reais valem implementação:

1. **Despesas recorrentes** — hoje `payments` (categoria expense) é one-shot
2. **Day Notes no Schedule** — notas livres por data, não atreladas a appointment
3. **Partner Balance consolidado** — visão de saldo/recorrência por parceiro B2B (não por cliente final, dado o ciclo high-ticket do AXO)

Tudo dentro da filosofia atual: precisão > hype, sem rebuild de features existentes, RLS multi-tenant por `organization_id`.

---

## 1. Despesas Recorrentes

### Objetivo
Permitir cadastrar overheads que se repetem (aluguel, seguros, software, gasolina mensal) sem precisar lançar manualmente todo mês.

### Mudanças

**Schema** (`payments` table — já existe, só adicionar colunas):
- `recurrence` text — null | `weekly` | `biweekly` | `monthly` | `quarterly` | `yearly`
- `recurrence_parent_id` uuid — aponta para o registro "template" da série
- `recurrence_next_date` date — próxima data de geração (null quando não é template)
- `recurrence_active` boolean default true

**Cron job (pg_cron + edge function `generate-recurring-expenses`)**
- Roda diariamente às 02:00
- Para cada `payments` onde `recurrence is not null AND recurrence_active AND recurrence_next_date <= today`:
  - INSERT nova linha de expense copiando campos, `recurrence_parent_id` = id do template
  - Avança `recurrence_next_date` conforme intervalo
- Idempotente (checa se já existe child com mesma data + parent)

**UI (`/admin/payments`)**
- Form de novo expense: dropdown "Recurrence" (One-time + 5 frequências)
- Badge "Recurring" + ícone repeat nas linhas que são template ou filhas
- Linha de template tem ação "Pause series" / "End series" / "Edit future occurrences"
- Filtro "Show recurring only"

### Por que vale
Refinishing tem custos fixos previsíveis (oficina, seguros, ferramentas). Eliminar lançamento manual = dados financeiros sempre completos = margem real correta.

---

## 2. Day Notes no Schedule

### Objetivo
Anotações soltas por data no calendário (ex: "Equipe folga", "Feriado", "Material chegando", "Não agendar tarde").

### Mudanças

**Nova tabela** `schedule_day_notes`:
- `note_date` date
- `content` text
- `color` text (amber/red/blue/green pra destaque visual)
- `created_by` uuid, `organization_id` uuid
- Unique (organization_id, note_date) — uma nota por dia

**RLS**: tenant by `organization_id` (mesmo padrão de `appointments`)

**UI (`src/pages/admin/Schedule.tsx`)**
- Em cada célula de dia (Day/Week/List views): se houver nota, mostra faixa fina no topo com texto truncado
- Click na faixa → popover edita/deleta
- Botão "+ Note" no header do dia quando hover (Week view)
- Cor da faixa = `color` da nota

### Por que vale
MaidPad usa pra comunicar exceções operacionais sem poluir o pipeline. Útil pro AXO em dias com restrições (folgas, weather, supply delays).

---

## 3. Partner Balance Consolidado (B2B)

### Objetivo
Para cada parceiro B2B (builder, designer, realtor, property manager), ver: total faturado lifetime, total recebido, saldo em aberto, aging, número de projetos abertos. Justificativa: parceiros são recorrentes (vs. cliente final que volta a cada 5-10 anos).

### Mudanças

**Nova RPC** `get_partner_balance(p_partner_id uuid)` retorna jsonb:
```
{
  partner: {...},
  totals: {
    lifetime_revenue, lifetime_received, open_balance,
    open_projects, completed_projects, avg_project_value
  },
  aging: { current, days_30, days_60, days_90_plus },
  recent_projects: [...],   // últimos 10 com status + invoice + balance
  open_invoices: [...]      // invoices não-pagas com aging
}
```

Lógica: agrega `invoices` + `payments` (categoria received) via `customers.referred_by_partner_id` ou via leads referidas pelo partner que viraram projeto.

**Schema check**: precisa garantir que `customers` ou `projects` tem coluna pra ligar ao parceiro originador. Se ainda não existir `customers.acquired_via_partner_id` (uuid → partners.id), criar e migrar dados de `leads.referred_by_partner_id → projects → customer`.

**UI**: nova aba "Balance" dentro do partner detail em `/admin/partners`:
- Header com 4 KPI cards (Lifetime Revenue, Received, Open Balance, Open Projects)
- Bar chart de aging (0-30 / 30-60 / 60-90 / 90+)
- Tabela de invoices abertas com link p/ invoice
- Tabela de projetos recentes
- CTA "Send statement" (futuro — gera PDF, fora de escopo agora)

### Por que vale
Parceiros B2B = núcleo da estratégia (referral booster, partner portal já existem). Hoje não há visão financeira consolidada deles → impossível identificar quais parceiros geram mais receita líquida e quais têm calote crônico.

---

## Detalhes técnicos

```text
Arquivos novos:
  supabase/functions/generate-recurring-expenses/index.ts
  src/components/admin/payments/RecurrenceSelect.tsx
  src/components/admin/schedule/DayNoteStrip.tsx
  src/components/admin/schedule/DayNotePopover.tsx
  src/hooks/useDayNotes.ts
  src/hooks/usePartnerBalance.ts
  src/components/admin/partners/PartnerBalanceTab.tsx

Arquivos editados:
  src/pages/admin/Payments.tsx          (form + filter recurrence)
  src/hooks/usePayments.ts              (suporte a recurrence)
  src/pages/admin/Schedule.tsx          (mount day notes nas views)
  src/pages/admin/Partners.tsx          (tab Balance no detail)

Migrations:
  payments: ADD COLUMN recurrence + 3 colunas
  schedule_day_notes: CREATE TABLE + GRANT + RLS + policies
  customers: ADD COLUMN acquired_via_partner_id (se não existir)
  RPC get_partner_balance(uuid)
  pg_cron: schedule diário p/ generate-recurring-expenses
```

## Fora de escopo (consciente)

- Pipeline de leads em 5 estágios (já temos 10, mais granular)
- Automações novas (engine já existe, full-featured)
- Check-in/check-out de execução (deferred — `labor_entries` resolve hoje)
- Dispatch map com GPS (no `deferred-operational-features` memory)
- Assinatura digital de contratos (proposals já têm signature dialog)
- Reviews/NPS (já existe `review_requests` + auto-trigger)
- Analytics expandido (Performance Hub já cobre)

---

Aprovar este plano vai implementar os 3 itens em sequência (recurring expenses → day notes → partner balance). Quer ajustar prioridade ou cortar algum?