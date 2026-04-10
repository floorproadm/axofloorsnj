

# Simplificação Radical — "Notion-like" Experience

## O Problema
O app está cheio de gates, validações obrigatórias, progress bars, e 7 abas separadas. Para um crew de hardwood flooring, isso é overengineering. No Notion, você abre, escreve, e pronto. Precisamos dessa mesma fluidez.

## Status: ✅ Implementado

### Alinhamento com Modelo Notion (Abril 2026)

Novas tabelas criadas:
- **material_costs** — registros individuais de compra por projeto (description, supplier, amount, receipt_url, is_paid)
- **labor_entries** — custo de mão de obra por job/dia (worker_name, role, daily_rate, days_worked, total_cost calculado)
- **weekly_reviews** — entidade persistente para governança semanal (notes, action_items, status open/closed)
- **weekly_review_projects** — tabela de junção projects ↔ weekly reviews

Triggers de sincronização:
- material_costs → job_costs.material_cost (auto-sync)
- labor_entries → job_costs.labor_cost (auto-sync)
- compute_project_next_action() — calcula next_action inteligente

Colunas adicionadas em projects:
- next_action (orientação automática)
- next_action_date

### JobDetail — Seções adicionadas
- **Next Action Banner** no topo (quando existe orientação)
- **Materials** — seção colapsável com lista + inline add/delete
- **Labor** — seção colapsável com worker name, daily rate, days worked

### WeeklyReview — Persistência
- Save Notes + Close Week (snapshot semanal persistido)
- Histórico de semanas anteriores clicável

### JobCostEditor — Read-only auto-calculado
- Material e Labor mostram totais auto-calculados das novas tabelas
- Apenas Additional Costs e Revenue são editáveis manualmente
