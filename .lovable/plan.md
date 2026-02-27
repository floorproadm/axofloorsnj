

# Plano de Execucao: AXO OS → FloorPro OS (4 Fases)

Entendimento confirmado. Ordem oficial respeitada. Enforcement como nucleo inegociavel.

---

## FASE 1 — Alinhamento Estrutural (Dias 1-3)

**Objetivo:** Reorganizar sidebar em 4 secoes FloorPro. Zero alteracao de logica.

### 1.1 Sidebar — 4 Secoes

Modificar `src/components/admin/AdminSidebar.tsx`:

```text
OVERVIEW
  Home (Dashboard)       → /admin/dashboard    [LayoutDashboard]
  Jobs                   → /admin/jobs          [Building]
  Schedule               → /admin/schedule      [CalendarDays]

TOOLS
  Intake (Captacao)      → /admin/intake        [Inbox]
  Measurements           → /admin/measurements  [Ruler]
  Pipeline (Propostas)   → /admin/leads         [FileText]

MANAGE
  Leads                  → /admin/leads         [Users]
  Feed                   → /admin/feed          [Images]
  Catalog (NOVO)         → /admin/catalog       [BookOpen]

SUPPORT
  Performance            → /admin/performance   [BarChart3]
  Settings               → /admin/settings      [Settings]
  Help (NOVO)            → /admin/help          [HelpCircle]
```

Adicionar traducoes em `src/contexts/LanguageContext.tsx`:
- `"sidebar.overview"`: Overview
- `"sidebar.support"`: Suporte / Support
- `"sidebar.catalogo"`: Catalogo / Catalog
- `"sidebar.ajuda"`: Ajuda / Help

### 1.2 Paginas Placeholder

Criar 2 paginas minimas:

- `src/pages/admin/Catalog.tsx` — AdminLayout + Card "Catalogo de Servicos — Em breve"
- `src/pages/admin/Help.tsx` — AdminLayout + Card "Central de Ajuda — Em breve"

### 1.3 Rotas

Adicionar em `src/App.tsx`:
- `/admin/catalog` → ProtectedRoute + Catalog
- `/admin/help` → ProtectedRoute + Help

### Arquivos modificados (Fase 1)
| Arquivo | Tipo |
|---------|------|
| `src/components/admin/AdminSidebar.tsx` | Modificar (4 grupos) |
| `src/contexts/LanguageContext.tsx` | Modificar (novas keys) |
| `src/pages/admin/Catalog.tsx` | Criar (placeholder) |
| `src/pages/admin/Help.tsx` | Criar (placeholder) |
| `src/App.tsx` | Modificar (2 rotas) |

**Criterio de done:** Sidebar renderiza 4 secoes. Placeholders acessiveis. Zero regressao nas rotas existentes.

---

## FASE 2 — Automacoes Configuraveis

**Objetivo:** Fortalecer DNA de sistema operacional. Governanca sobre automacao.

### 2.1 Migracao SQL — Colunas de threshold

```sql
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS sla_followup_overdue_days integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS sla_estimate_stale_days integer NOT NULL DEFAULT 3;
```

### 2.2 Atualizar `run_sla_engine()`

Modificar a funcao para ler thresholds de `company_settings` em vez de usar valores hardcoded nas views. A funcao fara:

1. `SELECT sla_followup_overdue_days, sla_estimate_stale_days FROM company_settings LIMIT 1`
2. Usar esses valores em queries inline em vez de depender das views fixas
3. Manter o advisory lock e audit_log intactos

### 2.3 Componente AutomationSettings

Criar `src/components/admin/settings/AutomationSettings.tsx`:
- Exibir regras SLA ativas com thresholds atuais
- Campos editaveis para `sla_followup_overdue_days` e `sla_estimate_stale_days`
- Historico de escalacoes recentes (ultimas 24h via `audit_log` where `user_role = 'system'`)
- Botao "Run Now" que chama `supabase.rpc('run_sla_engine')` — admin only
- Salvar thresholds via update em `company_settings`

### 2.4 Integrar no Settings

Modificar `src/pages/admin/Settings.tsx`:
- Adicionar secao "automations" com icone `Zap`
- Lazy load do `AutomationSettings`

### 2.5 Traducoes

Adicionar keys em `LanguageContext.tsx`:
- `"settings.automations"` / `"settings.automationsDesc"`

### Arquivos modificados (Fase 2)
| Arquivo | Tipo |
|---------|------|
| Migracao SQL | Criar (2 colunas) |
| `run_sla_engine()` SQL | Modificar (thresholds dinamicos) |
| `src/components/admin/settings/AutomationSettings.tsx` | Criar |
| `src/pages/admin/Settings.tsx` | Modificar (nova aba) |
| `src/contexts/LanguageContext.tsx` | Modificar (novas keys) |
| `src/hooks/useCompanySettings.ts` | Modificar (novos campos) |

**Criterio de done:** Thresholds configuraveis. "Run Now" funcional. Historico de escalacoes visivel. Engine continua rodando via cron com thresholds do DB.

---

## FASE 3 — Financeiro V1 (Dias 4-7)

**Objetivo:** Insights financeiros acionaveis. Sem graficos decorativos.

### 3.1 Expandir Performance

Modificar `src/pages/admin/Performance.tsx` para incluir:

- **Receita por periodo** — Card com total 30d vs 30d anteriores (dados de `job_costs` + `projects`)
- **Margem media por tipo de servico** — Tabela cruzando `projects.project_type` com `job_costs.margin_percent`
- **Jobs abaixo da margem** — Lista clicavel linkando para `/admin/jobs` (dados ja no RPC `get_dashboard_metrics`)
- **Trend de lucro** — Grafico Recharts simples (ultimos 6 meses)

Cada insight tera acao associada (link ou alerta).

### 3.2 Query de dados financeiros

Pode ser resolvido expandindo `get_dashboard_metrics()` ou criando uma nova RPC `get_financial_detail()` para evitar sobrecarregar o RPC principal. Decisao tecnica na implementacao.

### Arquivos modificados (Fase 3)
| Arquivo | Tipo |
|---------|------|
| `src/pages/admin/Performance.tsx` | Modificar (secoes financeiras) |
| Possivelmente nova RPC SQL | Criar |
| `src/hooks/admin/useDashboardData.ts` | Possivelmente expandir |

**Criterio de done:** Todo insight financeiro gera acao. Nenhum grafico sem dados mostra vazio decorativo — mostra "Sem dados. Complete jobs para gerar metricas."

---

## FASE 4 — CX Controlado (Dias 8-10)

**Objetivo:** Portal de cliente read-only. Seguranca antes de estetica.

### 4.1 Migracao SQL

```sql
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client_share_token uuid DEFAULT gen_random_uuid();

-- RLS: acesso publico por token (read-only)
CREATE POLICY "projects_public_share_read" ON public.projects
  FOR SELECT USING (client_share_token IS NOT NULL);
```

Nota: A policy sera refinada para validar que o token no request corresponde ao token da row.

### 4.2 Pagina publica

Criar `src/pages/ClientPortal.tsx`:
- Rota: `/project-status/:token`
- Busca projeto por `client_share_token`
- Exibe: status, tipo, fotos de progresso (de `media_files` com `visibility = 'client'`)
- Zero autenticacao necessaria
- Sem indexacao (noindex, nofollow)

### 4.3 Gerar link compartilhavel

No `ProjectDetail.tsx` do admin, adicionar botao "Compartilhar com Cliente" que copia URL `{domain}/project-status/{token}`.

### 4.4 Email de status (opcional, se tempo permitir)

Modificar `send-notifications` edge function para enviar email ao cliente quando `project_status` muda.

### Arquivos modificados (Fase 4)
| Arquivo | Tipo |
|---------|------|
| Migracao SQL | Criar (coluna + RLS) |
| `src/pages/ClientPortal.tsx` | Criar |
| `src/App.tsx` | Modificar (rota publica) |
| `src/pages/admin/ProjectDetail.tsx` | Modificar (botao share) |

**Criterio de done:** Cliente acessa status via link unico. Token nao indexavel. Nenhum dado sensivel exposto (sem custos, sem margem, sem notas internas).

---

## Resumo de Sequenciamento

| Ordem | Fase | Foco | Risco |
|-------|------|------|-------|
| 1 | Estrutural | Sidebar 4 secoes + placeholders | Baixo |
| 2 | Automacoes | SLA configuravel + Run Now + historico | Medio |
| 3 | Financeiro | Insights acionaveis em Performance | Medio |
| 4 | CX | Portal cliente read-only | Medio |

## O que NAO entra

- Multi-tenant
- Marketing automation
- Drag-and-drop pipeline
- App nativo
- Integracoes externas complexas

