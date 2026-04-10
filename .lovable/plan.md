

# Plano: Alinhar AXO OS com Modelo Notion

## Resumo

Trazer 4 melhorias estruturais do modelo Notion para o AXO OS: (1) Material Costs como entidade separada com supplier/receipt, (2) Labor Payroll linkado por projeto, (3) Weekly Review persistente no banco, (4) Next Action inteligente calculado por fórmula. Tudo sem perder o que já funciona.

## O que já temos e mantemos

- `job_costs` + `job_cost_items` (trigger de agregação) — continua como resumo financeiro
- `invoices` + `invoice_items` + `payments` — AR completo já existe
- `projects` como hub central — já é o "single pane of glass"
- Interface Notion-like no JobDetail — recém implementada
- RLS multi-tenant em tudo

## O que muda

### 1. Tabela `material_costs` (nova)
Registros individuais de compra de material por projeto — como no Notion.

```sql
CREATE TABLE public.material_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  description text NOT NULL DEFAULT '',
  supplier text,
  amount numeric NOT NULL DEFAULT 0,
  purchase_date date DEFAULT CURRENT_DATE,
  receipt_url text,
  is_paid boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
- RLS: org isolation via `organization_id = get_user_org_id()`
- Trigger: ao inserir/deletar, atualiza `job_costs.material_cost` automaticamente

### 2. Tabela `labor_entries` (nova)
Custo de mão de obra por job por dia — substitui a lógica espalhada em `payments` com `category='labor'`.

```sql
CREATE TABLE public.labor_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  worker_name text NOT NULL,
  role text DEFAULT 'helper',
  daily_rate numeric NOT NULL DEFAULT 0,
  days_worked numeric NOT NULL DEFAULT 1,
  total_cost numeric GENERATED ALWAYS AS (daily_rate * days_worked) STORED,
  work_date date DEFAULT CURRENT_DATE,
  is_paid boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);
```
- RLS: org isolation
- Trigger: ao inserir/deletar, atualiza `job_costs.labor_cost` automaticamente

### 3. Tabela `weekly_reviews` (nova)
Entidade persistente para governança semanal — não mais uma view volátil por data.

```sql
CREATE TABLE public.weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  total_revenue numeric DEFAULT 0,
  total_profit numeric DEFAULT 0,
  avg_margin numeric DEFAULT 0,
  jobs_completed integer DEFAULT 0,
  leads_won integer DEFAULT 0,
  notes text,
  action_items text,
  status text DEFAULT 'open', -- open | closed
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, week_start)
);
```
- RLS: org isolation
- Tabela de junção `weekly_review_projects` liga projects à semana

### 4. Coluna `next_action` em `projects` (alteração)
Campo calculado pelo backend que diz exatamente o que fazer.

```sql
ALTER TABLE projects
  ADD COLUMN next_action text,
  ADD COLUMN next_action_date date;
```
- Uma function `compute_project_next_action(project_id)` avalia: custos preenchidos? margem OK? fotos? pagamento pendente? — e grava a orientação.
- Trigger em `job_costs`, `labor_entries`, `material_costs`, `invoices`, `media_files` recalcula automaticamente.

## Arquivos a criar/editar

### Backend (Migrations)
1. Migration: criar `material_costs`, `labor_entries`, `weekly_reviews`, `weekly_review_projects`
2. Migration: adicionar `next_action` e `next_action_date` em `projects`
3. Migration: triggers de sincronização (material → job_costs, labor → job_costs, next_action)

### Frontend — Novos hooks
4. `src/hooks/useMaterialCosts.ts` — CRUD material_costs por projeto
5. `src/hooks/useLaborEntries.ts` — CRUD labor_entries por projeto
6. `src/hooks/useWeeklyReviews.ts` — CRUD weekly_reviews

### Frontend — Edições
7. **`src/pages/admin/JobDetail.tsx`** — Adicionar seções colapsáveis "Materials" e "Labor" dentro da página, cada uma com lista de registros + botão adicionar inline. Mostrar `next_action` no topo como banner de orientação.
8. **`src/pages/admin/WeeklyReview.tsx`** — Refatorar para usar `weekly_reviews` persistente. Botão "Close Week" que salva snapshot e marca como closed. Exibir histórico de semanas anteriores.
9. **`src/components/admin/JobCostEditor.tsx`** — Tornar read-only (auto-calculado). Mostra totais vindos das novas tabelas + permite override manual se necessário.

## O que NÃO muda
- Schema de `leads`, `proposals`, `invoices`, `customers` — intocados
- `job_cost_items` continua funcionando para quem já usa
- Interface Notion-like do JobDetail — apenas adiciona seções
- RLS e multi-tenant — padrão mantido
- QuickQuote e tiered pricing — intocados

## Ordem de execução
1. Migrations (tabelas + triggers + RLS)
2. Hooks novos (material, labor, weekly)
3. JobDetail: seções Material + Labor + Next Action banner
4. WeeklyReview: persistência + "Close Week"
5. JobCostEditor: modo read-only auto-calculado

