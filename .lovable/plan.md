
# FASE 1 — HARDENING (Ordem Refinada pelo Cliente)

## Resumo

Blindar o nucleo do AXO OS em 4 blocos sequenciais, priorizando estabilidade de dados antes de mexer em storage. Cada bloco e independente e pode ser validado antes de avancar.

---

## 1.1 Padronizar Arquitetura de Dados

### 1.1.1 Migrar useDashboardData para React Query

**Problema confirmado:** `useDashboardData.ts` usa `useState` + `useCallback` + `setInterval(fetchData, 60000)` — polling manual sem cache, sem dedup, sem stale control.

**Solucao:**
- Substituir toda a logica de fetch por `useQuery` com `refetchInterval: 60000`
- Manter todos os `useMemo` derivados (criticalAlerts, moneyMetrics, etc.) intactos
- Remover `useState` para data, `useCallback` para fetch, e `useEffect` com `setInterval`
- O hook continua retornando a mesma interface publica

**Arquivo:** `src/hooks/admin/useDashboardData.ts`
**Consumidor:** `src/pages/admin/Dashboard.tsx` (unico — sem impacto colateral)

### 1.1.2 Migrar useAdminData para React Query

**Problema confirmado:** `useAdminData.ts` usa `useState` + `useCallback` + `setInterval(fetchData, 5min)` — mesmo padrao legado. Faz `SELECT *` em leads e projects.

**Solucao:**
- Substituir por `useQuery` com queryKey `['admin-leads']` e `['admin-projects']`
- Selecionar apenas colunas necessarias (nao `SELECT *`)
- `refetchInterval: 300000` (5 min, mantendo comportamento atual)
- Stats calculados via `useMemo` sobre os dados do query

**Arquivo:** `src/hooks/admin/useAdminData.ts`
**Consumidor:** `src/pages/admin/LeadsManager.tsx` (unico)

### 1.1.3 Resolver N+1 do NRA — Criar RPC batch

**Problema confirmado:** `useLeadNRABatch` faz 1 chamada RPC por lead via `Promise.all`. Com 30 leads ativos = 30 round-trips.

**Solucao:**
1. Criar RPC `get_leads_nra_batch(p_lead_ids uuid[])` no banco que:
   - Itera sobre o array
   - Chama a logica existente de `get_lead_nra` para cada ID
   - Retorna `jsonb[]` com `{lead_id, action, label, severity}`
2. Atualizar `useLeadNRABatch` para chamar a nova RPC com um unico request
3. Manter `useLeadNRA` (singular) intacto — usado no `LeadControlModal`

**Arquivos:**
- Migration SQL: nova funcao `get_leads_nra_batch`
- `src/hooks/useLeadNRA.ts`: refatorar `useLeadNRABatch`

### 1.1.4 Remover hooks mortos

**Confirmado por busca:** Nenhum arquivo importa `useAdminAuth`, `useGalleryData`, ou `useLeadsExport`.

**Acao:** Deletar os 3 arquivos:
- `src/hooks/admin/useAdminAuth.ts`
- `src/hooks/admin/useGalleryData.ts`
- `src/hooks/admin/useLeadsExport.ts`

---

## 1.2 Implementar Paginacao Real

### 1.2.1 Paginacao em Leads (useAdminData)

- Adicionar parametros `page` e `pageSize` ao hook
- Usar `.range(from, to)` no query Supabase
- Retornar `totalCount` via `.count()` para controle de UI
- Atualizar `LinearPipeline` para suportar paginacao (ou manter fetch-all com limite de 200)

**Decisao arquitetural:** Para pipeline board view, fetch-all com LIMIT 200 e melhor que paginacao classica. Para list view, paginacao real com cursor.

### 1.2.2 Paginacao em Jobs (JobsManager)

- O `useProjectsWithRelations` dentro de `JobsManager.tsx` (linha ~100) ja usa React Query mas faz `SELECT *` sem limite
- Adicionar `.limit(50)` com paginacao offset
- Atualizar UI com controles de pagina

### 1.2.3 Paginacao em Feed

- `useFeedPosts` em `src/hooks/admin/useFeedData.ts` ja usa React Query
- Adicionar `.range()` com controle de pagina

---

## 1.3 Criar Views SQL Agregadas

### 1.3.1 view_pipeline_metrics

```sql
CREATE VIEW view_pipeline_metrics AS
SELECT
  status,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30d,
  AVG(EXTRACT(EPOCH FROM (now() - updated_at))/3600)::int as avg_hours_in_stage
FROM leads
WHERE status NOT IN ('completed', 'lost')
GROUP BY status;
```

### 1.3.2 view_financial_metrics

```sql
CREATE VIEW view_financial_metrics AS
SELECT
  COUNT(*) FILTER (WHERE p.project_status = 'in_progress') as active_jobs,
  SUM(jc.estimated_revenue) FILTER (WHERE p.project_status = 'in_progress') as pipeline_value,
  SUM(jc.profit_amount) FILTER (WHERE p.project_status = 'completed') as total_profit,
  AVG(jc.margin_percent) FILTER (WHERE p.project_status = 'completed' AND p.created_at >= NOW() - INTERVAL '30 days') as avg_margin_30d
FROM projects p
LEFT JOIN job_costs jc ON jc.project_id = p.id;
```

### 1.3.3 view_stage_aging

```sql
CREATE VIEW view_stage_aging AS
SELECT
  l.status,
  l.id as lead_id,
  l.name,
  EXTRACT(DAY FROM (now() - l.updated_at))::int as days_in_stage
FROM leads l
WHERE l.status NOT IN ('completed', 'lost')
ORDER BY days_in_stage DESC;
```

**RLS:** Views herdam RLS das tabelas base — nenhuma policy adicional necessaria.

**Beneficio:** Dashboard futuro (Fase 2) consome views em vez de calcular tudo no frontend.

---

## 1.4 Migrar job-proof para Privado

### 1.4.1 Tornar bucket privado

- Alterar bucket `job-proof` de `is_public: true` para `is_public: false`
- Criar policy de storage: admin pode upload/download, authenticated pode read

### 1.4.2 Implementar Signed URLs

- Atualizar `useJobProof.ts`:
  - `uploadImage()`: continua usando `upload()` (nao muda)
  - Novo metodo `getSignedUrl(path)`: usa `createSignedUrl(path, 3600)` (1h de validade)
  - Substituir `getPublicUrl()` por `createSignedUrl()`
- Atualizar `JobProofUploader.tsx`: usar signed URLs ao exibir imagens

### 1.4.3 Verificar que URLs nao estao expostas publicamente

- Confirmar que nenhuma pagina publica referencia URLs do bucket `job-proof`
- Feed e Gallery usam buckets separados (`feed-media`, `gallery`) — sem conflito

---

## 1.5 Quebrar JobsManager.tsx (1160 linhas)

**Extrair 3 modulos:**

1. `src/pages/admin/components/JobsList.tsx` — listagem, filtros, cards de jobs
2. `src/pages/admin/components/JobControlModal.tsx` — modal de controle (linhas ~338-862)
3. `src/pages/admin/components/ProjectNotesSection.tsx` — notas e timeline (linhas ~864-1160)

`JobsManager.tsx` vira orquestrador com ~80 linhas.

---

## Sequencia de Execucao

```text
FASE 1.1 — Arquitetura de Dados (4 tarefas)
  1. useDashboardData → React Query
  2. useAdminData → React Query + colunas seletivas
  3. RPC get_leads_nra_batch + refatorar hook
  4. Deletar hooks mortos

FASE 1.2 — Paginacao (3 tarefas)
  5. Leads com LIMIT 200
  6. Jobs com paginacao offset
  7. Feed com paginacao

FASE 1.3 — Views SQL (1 migration)
  8. Criar 3 views agregadas

FASE 1.4 — Storage Security (2 tarefas)
  9. Bucket privado + policies
  10. Signed URLs no hook + uploader

FASE 1.5 — Refactor (1 tarefa)
  11. Quebrar JobsManager em 3 modulos
```

## Risco de Execucao

| Item | Risco | Mitigacao |
|---|---|---|
| React Query migration | Baixo | Interface publica dos hooks nao muda |
| RPC batch NRA | Baixo | Funcao SQL reutiliza logica existente |
| Views SQL | Nenhum | Read-only, herdam RLS |
| Bucket privado | Medio | Testar signed URLs antes de desligar public |
| Quebrar JobsManager | Baixo | Refactor puro, sem mudanca de logica |
