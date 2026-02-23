

# Consolidar Performance.tsx na RPC Unica

## Problema Atual

A pagina `/admin/performance` faz 3 queries diretas confirmadas no Network:
- `GET /rest/v1/projects` (7 colunas)
- `GET /rest/v1/leads` (4 colunas)
- `GET /rest/v1/job_costs` (5 colunas)

Isso viola a arquitetura consolidada onde Dashboard e AdminLayout ja consomem exclusivamente `get_dashboard_metrics`.

## Analise de Gap

Performance.tsx calcula 9 metricas. Veja o mapeamento:

| Metrica Performance | Disponivel na RPC? | Campo |
|---|---|---|
| totalRevenue | Sim | `financial.total_revenue` |
| totalProfit | Sim | `financial.total_profit` |
| avgMargin | Sim | `financial.avg_margin_30d` |
| completedCount | Sim | `financial.completed_jobs` |
| inProductionCount | Sim | `financial.active_jobs` |
| totalLeads | Sim | soma dos `pipeline[].total` |
| recentLeadsCount | Sim | soma dos `pipeline[].last_30d` |
| conversionRate | NAO | precisa de `converted_to_project_id` |
| avgCycleTime | NAO | precisa de `start_date` e `completion_date` |

2 metricas estao faltando na RPC: **conversionRate** e **avgCycleTime**.

## Plano de Execucao

### Passo 1: Estender a RPC `get_dashboard_metrics`

Adicionar 2 campos ao bloco `financial` da RPC via migration SQL:

```text
conversion_rate_30d: percentual de leads dos ultimos 30 dias que tem converted_to_project_id != NULL
avg_cycle_days: media de dias entre start_date e completion_date dos projetos completed
```

Isso mantem TUDO no Postgres, zero calculo no frontend.

### Passo 2: Atualizar tipos no `useDashboardData`

Adicionar os 2 novos campos na interface `FinancialMetric`:
- `conversion_rate_30d: number | null`
- `avg_cycle_days: number | null`

Expor via um novo bloco `performanceMetrics` no retorno do hook:

```text
performanceMetrics: {
  totalRevenue, totalProfit, avgMargin,
  completedCount, inProductionCount,
  totalLeads, recentLeadsCount,
  conversionRate, avgCycleTime
}
```

### Passo 3: Reescrever Performance.tsx

- Remover os 3 `useQuery` diretos (projects, leads, job_costs)
- Remover o `useMemo` de calculo
- Importar `useDashboardData()`
- Consumir `performanceMetrics` e `isLoading`
- Manter os mesmos 6 cards visuais (zero mudanca visual)

### Resultado no Network

Ao acessar `/admin/performance`:

| Request | Esperado |
|---|---|
| `get_dashboard_metrics` | 200 (cache compartilhado) |
| `projects` | ZERO |
| `leads` | ZERO |
| `job_costs` | ZERO |

## Detalhes Tecnicos

### SQL da Migration (RPC atualizada)

No bloco `v_financial`, adicionar:

```text
-- Conversion rate (30d)
conversion_rate_30d = leads convertidos nos ultimos 30d / total leads nos ultimos 30d * 100

-- Average cycle time
avg_cycle_days = media de (completion_date - start_date) dos projetos com status 'completed'
  que tenham ambas as datas preenchidas
```

### Arquivos Modificados

1. **Migration SQL** - Atualizar funcao `get_dashboard_metrics` com 2 novos campos
2. **`src/hooks/admin/useDashboardData.ts`** - Adicionar `conversion_rate_30d` e `avg_cycle_days` na interface + expor `performanceMetrics`
3. **`src/pages/admin/Performance.tsx`** - Remover 3 queries, consumir `useDashboardData()`

### Impacto

- Zero breaking changes no Dashboard ou AdminLayout (campos novos sao aditivos)
- Performance visual identica (mesmos 6 cards)
- 3 queries eliminadas do Network
- Cache compartilhado: se usuario ja visitou Dashboard, Performance carrega instantaneamente

