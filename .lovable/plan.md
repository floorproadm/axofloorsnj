

# Fase 1.3 — Views SQL Agregadas + RPC get_dashboard_metrics

## Objetivo

Consolidar calculos pesados no banco via 3 views + 1 RPC wrapper. O Dashboard UI nao sera alterado nesta fase — apenas backend.

---

## 1. Criar 3 Views SQL

### view_pipeline_metrics

Metricas por estagio do pipeline (contagem, volume 30d, aging aproximado).

```sql
CREATE OR REPLACE VIEW public.view_pipeline_metrics AS
SELECT
  status,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30d,
  AVG(EXTRACT(DAY FROM (now() - created_at)))::int as avg_days_in_pipeline
FROM leads
WHERE status NOT IN ('completed', 'lost')
GROUP BY status;
```

**Ajuste tecnico aplicado:** Usa `created_at` em vez de `updated_at` para aging. Isso mede "tempo total no pipeline desde entrada" — metrica mais estavel e confiavel. Marcado como aproximacao ate implementar `status_changed_at` (Fase 2).

### view_financial_metrics

Metricas financeiras consolidadas (jobs ativos, pipeline value, lucro, margem).

```sql
CREATE OR REPLACE VIEW public.view_financial_metrics AS
SELECT
  COUNT(*) FILTER (WHERE p.project_status = 'in_progress') as active_jobs,
  COUNT(*) FILTER (WHERE p.project_status = 'completed') as completed_jobs,
  COALESCE(SUM(jc.estimated_revenue) FILTER (WHERE p.project_status = 'in_progress'), 0) as pipeline_value,
  COALESCE(SUM(jc.profit_amount) FILTER (WHERE p.project_status = 'completed'), 0) as total_profit,
  COALESCE(SUM(jc.estimated_revenue) FILTER (WHERE p.project_status = 'completed'), 0) as total_revenue,
  AVG(jc.margin_percent) FILTER (
    WHERE p.project_status = 'completed'
    AND p.created_at >= NOW() - INTERVAL '30 days'
  ) as avg_margin_30d
FROM projects p
LEFT JOIN job_costs jc ON jc.project_id = p.id;
```

### view_stage_aging

Lista de leads ativos com dias no pipeline, ordenados por aging decrescente.

```sql
CREATE OR REPLACE VIEW public.view_stage_aging AS
SELECT
  l.id as lead_id,
  l.name,
  l.status,
  EXTRACT(DAY FROM (now() - l.created_at))::int as days_in_pipeline,
  l.next_action_date,
  CASE
    WHEN l.next_action_date IS NOT NULL AND l.next_action_date < CURRENT_DATE
    THEN true ELSE false
  END as action_overdue
FROM leads l
WHERE l.status NOT IN ('completed', 'lost')
ORDER BY days_in_pipeline DESC;
```

**Bonus:** Inclui flag `action_overdue` quando `next_action_date` esta no passado — util para alertas futuros.

**RLS:** Views herdam RLS das tabelas base (`leads`, `projects`, `job_costs`). Nenhuma policy adicional necessaria.

---

## 2. Criar RPC get_dashboard_metrics()

Uma unica chamada que retorna todas as metricas agregadas em um JSON consolidado.

```sql
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pipeline jsonb;
  v_financial jsonb;
  v_aging jsonb;
BEGIN
  -- Pipeline metrics (array of stages)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'status', status,
      'total', total,
      'last_30d', last_30d,
      'avg_days_in_pipeline', avg_days_in_pipeline
    )
  ), '[]'::jsonb)
  INTO v_pipeline
  FROM view_pipeline_metrics;

  -- Financial metrics (single object)
  SELECT jsonb_build_object(
    'active_jobs', COALESCE(active_jobs, 0),
    'completed_jobs', COALESCE(completed_jobs, 0),
    'pipeline_value', COALESCE(pipeline_value, 0),
    'total_profit', COALESCE(total_profit, 0),
    'total_revenue', COALESCE(total_revenue, 0),
    'avg_margin_30d', avg_margin_30d
  )
  INTO v_financial
  FROM view_financial_metrics;

  -- Top 10 aging leads
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'lead_id', lead_id,
      'name', name,
      'status', status,
      'days_in_pipeline', days_in_pipeline,
      'action_overdue', action_overdue
    )
  ), '[]'::jsonb)
  INTO v_aging
  FROM (SELECT * FROM view_stage_aging LIMIT 10) sub;

  RETURN jsonb_build_object(
    'pipeline', v_pipeline,
    'financial', v_financial,
    'aging_top10', v_aging
  );
END;
$$;
```

**Beneficio:** Frontend pode chamar `supabase.rpc('get_dashboard_metrics')` em uma unica request e receber tudo.

---

## 3. O que NAO sera alterado

- `useDashboardData.ts` — nao muda (sera conectado na Fase 2)
- `Dashboard.tsx` — nao muda
- `Performance.tsx` — nao muda
- Nenhuma UI muda nesta fase

---

## 4. Sequencia de execucao

```text
1. Migration SQL: CREATE 3 views + CREATE FUNCTION get_dashboard_metrics()
2. Validar views manualmente via SQL query
3. Validar RPC isoladamente via SQL query
4. Atualizar types.ts (automatico apos migration)
```

## 5. Risco

| Item | Risco | Mitigacao |
|---|---|---|
| Views SQL | Nenhum | Read-only, sem side effects |
| RPC wrapper | Nenhum | STABLE + SECURITY DEFINER, so leitura |
| RLS | Nenhum | Views herdam policies das tabelas base |
| Impacto UI | Zero | Nenhum codigo frontend alterado |

