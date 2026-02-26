
# SLA Engine V1 — Atuador Automatico

## Arquitetura Final

```text
pg_cron (hourly) --> run_sla_engine() --> audit_log
                                              |
get_dashboard_metrics() <-- recentSystemActions
                                              |
Dashboard UI <-- "Acoes do Sistema (24h)"
```

Sem edge function. Sem pg_net. Sem JWT. Execucao direta no banco.

## Fase 1: Migration SQL

### 1.1 Funcao `run_sla_engine()`
- SECURITY DEFINER com advisory lock para evitar execucao concorrente
- Consulta `leads_followup_overdue`: escala priority (medium->high, high->urgent)
- Consulta `leads_estimate_scheduled_stale`: mesma logica de escalacao
- Registra cada escalacao no `audit_log` com `user_role='system'` e `operation_type` prefixado `SLA_ESCALATION_`
- Retorna JSON com contagem de escalacoes
- REVOKE ALL FROM PUBLIC + GRANT EXECUTE TO postgres (seguranca)

### 1.2 Atualizar `get_dashboard_metrics()`
- Adicionar variavel `v_recent_system_actions`
- Consultar `audit_log` onde `user_role='system'` e `operation_type LIKE 'SLA_ESCALATION_%'` das ultimas 24h
- Incluir no retorno JSON como `recentSystemActions`

### 1.3 Habilitar pg_cron e agendar (via insert tool, nao migration)
```text
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('sla_engine_hourly', '0 * * * *', $$SELECT public.run_sla_engine();$$);
```
Execucao direta no banco. Sem rede, sem edge, sem JWT.

## Fase 2: Frontend

### 2.1 `src/hooks/admin/useDashboardData.ts`
- Adicionar interface `SystemAction` com campos `operation_type`, `created_at`, `data`
- Adicionar `recentSystemActions` ao tipo `DashboardRPCResponse`
- Expor `recentSystemActions` no retorno do hook

### 2.2 `src/pages/admin/Dashboard.tsx`
- Extrair `recentSystemActions` do hook
- Adicionar item em `priorityTasks` quando houver escalacoes recentes (tipo `sla_auto_escalation`, cor `risk`)
- Mostrar contagem de escalacoes como task: "X escalacoes automaticas (24h)"

### 2.3 `src/components/admin/dashboard/PriorityTasksList.tsx`
- Adicionar `sla_auto_escalation` ao mapa `typeIcon` (usando icone `Zap` ou `Bot`)
- Nenhuma outra alteracao necessaria (componente ja suporta o shape)

## Arquivos modificados

| Arquivo | Alteracao |
|---|---|
| Migration SQL | `run_sla_engine()` + REVOKE/GRANT + update `get_dashboard_metrics()` |
| pg_cron (insert) | Habilitar extensao + agendar job hourly |
| `src/hooks/admin/useDashboardData.ts` | Interface `SystemAction` + campo `recentSystemActions` |
| `src/pages/admin/Dashboard.tsx` | Novo item em priorityTasks para escalacoes |
| `src/components/admin/dashboard/PriorityTasksList.tsx` | Icone para `sla_auto_escalation` |

## O que NAO sera feito
- Nenhuma edge function
- Nenhum pg_net
- Nenhum verify_jwt
- Nenhuma URL ou chave exposta
- Nenhuma alteracao em `supabase/config.toml`
