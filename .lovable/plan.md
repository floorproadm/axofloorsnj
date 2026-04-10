

# Alinhamento AXO OS ↔ Notion: Gestão de Projetos como Cockpit Operacional

## O que você descreveu vs o que existe hoje

Seu Notion funciona como um **cockpit de página única** para "Gestão de Projetos" — tudo visível num scroll vertical com blocos colapsáveis. O AXO OS atual tem a funcionalidade espalhada em **12+ páginas separadas** (Jobs, Payments, Performance, Measurements, Crews, Weekly Review, etc.), sem uma visão unificada estilo cockpit.

### Mapeamento: Notion Bloco → AXO OS Atual

| Bloco Notion | AXO OS Status |
|---|---|
| Quick Actions | Não existe como hub centralizado |
| Approved Proposals → Projects | Não existe (proposals e jobs são páginas separadas) |
| Project Stage Pipeline (Kanban) | ✅ Existe em `/admin/jobs` (Board view) |
| Tasks | Parcial — tasks existem mas não no contexto de projetos |
| Measurements & Site Data | ✅ Existe em `/admin/measurements` (separado) |
| Materials & Costs | ✅ Existe dentro de cada job detail |
| Workforce Compensation (Crews + Payroll) | ✅ Existe em `/admin/crews` (separado) |
| Weekly Review & KPIs | ✅ Existe em `/admin/weekly-review` (separado) |
| Documentation & Media | Parcial — dentro de job detail |
| Issues & Warranty | ❌ Não existe |
| Invoices & Payments | ✅ Existe em `/admin/payments` (separado) |

### O problema central
O Notion agrega tudo numa página com views embutidas. O AXO OS fragmenta em rotas separadas, forçando o usuário a navegar constantemente.

---

## Plano de Implementação

### Fase 1: Criar página "Gestão de Projetos" (cockpit unificado)

Criar uma nova rota `/admin/projects` que funciona como o cockpit do Notion — uma página vertical com seções colapsáveis, cada uma mostrando uma view compacta dos dados relevantes.

**Arquivo novo:** `src/pages/admin/ProjectsHub.tsx`

**Estrutura da página (scroll vertical, seções toggle):**

1. **Quick Actions** — Grid de botões: New Job, New Measurement, Register Materials, New Invoice, Partners, Crews
2. **Approved Proposals → Projects** — Lista de proposals com status `accepted` que ainda não têm `project_id` vinculado ou projetos pendentes de ação
3. **Project Stage Pipeline** — Kanban compacto (reutilizar lógica do JobsManager Board view) com colunas: Planning | In Progress | Completed | Awaiting Payment | Paid
4. **Tasks** — Mini-lista de tasks abertas filtradas por projetos ativos
5. **Measurements & Site Data** — Tabela compacta das últimas medições com link pro detalhe
6. **Materials & Costs** — Tabela agregada de custos materiais recentes (últimas entradas)
7. **Workforce Compensation** — Mini-view de Crews + Labor entries recentes
8. **Weekly Review & KPIs** — Snapshot da semana atual com semáforo de margem
9. **Documentation & Media** — Grid de mídias recentes dos projetos
10. **Project Flow Guide** — Callout colapsável com o runbook do ciclo operacional

**Cada seção:**
- Header com título + ícone + toggle collapse
- Conteúdo compacto (max 5-8 items, com "Ver todos →" linkando pra página dedicada)
- Dados puxados dos hooks já existentes

### Fase 2: Ajustar navegação

- Adicionar "Projects" no sidebar (entre Jobs e Payments)
- A rota `/admin/projects` aponta pro cockpit
- Manter `/admin/jobs` como a view dedicada do pipeline (Board/List)
- Manter `/admin/jobs/:id` como detalhe operacional do job

### Fase 3: Issues & Warranty (novo módulo)

Criar tabela `issues_warranty` no banco:
- `id`, `project_id` (FK), `customer_id` (FK nullable), `organization_id`
- `title`, `description`, `severity` (low/medium/high/critical)
- `is_warranty_claim` (boolean), `warranty_expiry_date`
- `repair_cost`, `status` (open/in_progress/resolved/closed)
- `photos` (jsonb array), `resolution_notes`
- `created_at`, `updated_at`

Com RLS por organization_id.

---

## Arquivos a criar/modificar

| Ação | Arquivo |
|---|---|
| Criar | `src/pages/admin/ProjectsHub.tsx` |
| Criar | `src/hooks/useProjectsHub.ts` (dados agregados) |
| Modificar | `src/App.tsx` (nova rota) |
| Modificar | `src/components/admin/AdminSidebar.tsx` (nav item) |
| Migração | Tabela `issues_warranty` + RLS |

## Escopo recomendado

**Step 1** (este ciclo): Cockpit de Projetos (Fases 1 + 2) — a página hub com seções colapsáveis reusando hooks existentes.

**Step 2** (próximo ciclo): Issues & Warranty + refinamentos visuais.

