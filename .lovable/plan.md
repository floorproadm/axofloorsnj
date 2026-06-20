# Restructure /admin/leads

Large UI restructure on existing leads pipeline. Rota `/admin/leads` and dados permanecem; mudanças são front-end (apresentação) sobre `LinearPipeline` e `LeadDetail`.

## Escopo

### 1. LeadsManager (header KPIs)
Adicionar 5 KPI pills clicáveis acima do board, calculadas a partir de `leads`:
- 🔥 Quentes: `priority === 'hot'` ou status `warm_lead`+ (decidir: usar `priority === 'high'/'hot'`)
- ⏰ Parados +3d: `updated_at` > 3 dias e status não-fechado
- 💰 Pipeline $: soma `budget` dos leads abertos
- 📋 Sem próx. ação: `!next_action_date && !follow_up_date`
- ✅ Fechados este mês: status `in_production` ou `won` no mês atual

Cada pill aplica filtro local ao board (estado em LinearPipeline via prop).

### 2. Toolbar (LinearPipeline)
Refazer toolbar: `[+ Novo Lead] [🔍 Buscar] [⚡ Filtros ▼] [Board|List]`. Remover botões soltos Appt/Proposal/Request. Dropdown Filtros: Estágio, Fonte, Serviço, Valor min/max, Responsável (Popover + campos).

### 3. Card do Kanban (PipelineCard)
Redesenhar `LeadCard` no arquivo do pipeline:
- L1: nome bold + valor verde direita
- L2: cidade · serviço (cinza)
- L3: telefone clicável (`tel:`)
- L4: badge tempo no estágio (0-2 cinza / 3-5 amarelo / 5+ vermelho `animate-pulse`)
- L5: badge fonte legível (`partner_referral` → "Via Parceiro", `manual` → "Manual", `web_form` → "Formulário Web")
- Hover: revelar `[📞] [📋] [→]` action row absolute bottom

### 4. Headers de coluna
- Texto "X% avançam daqui" — conversão histórica calculada de leads que passaram desta coluna (aproximação: % de leads atuais+passados que saíram para próximo estágio). Se não houver tracking histórico, usar conversão estática por estágio derivada do dataset atual.
- Badge vermelho no título se ≥2 leads parados 5d+

### 5. LeadDetail (drawer/page)
Restruturar `src/pages/admin/LeadDetail.tsx`:
- Header sticky: nome + Select de estágio, linha "cidade · serviço · valor", linha "X dias | Criado | Atualizado"
- Action bar sticky: `[Registrar Contato] [Avançar] [Converter] [Ligar] [Email]`
- Tabs: Resumo (3 cards), Timeline (renomear de Histórico, com feed e botão registrar contato), Notas (+ anexos foto), Automações (intacta), Job (visível só se `converted_to_project_id`)

### 6. Modo List
Adicionar colunas `Último Contato` e `Responsável`, botão "Avançar" inline (next stage via update status).

### 7. Empty state
Colunas vazias: "Nenhum lead aqui ainda" + botão `+ Adicionar lead` que abre criar lead com estágio pré-selecionado.

### 8. Preservar
- Drag-and-drop existente
- Realtime/refetch
- RLS / schema intacto

## Arquivos a modificar

- `src/pages/admin/LeadsManager.tsx` — KPI pills + passar filtro ativo ao pipeline
- `src/pages/admin/components/LinearPipeline.tsx` — toolbar, headers, cards, empty states, list view, filtros, KPI filter handling
- `src/pages/admin/LeadDetail.tsx` — header sticky, action bar, tabs reorganizadas
- (possíveis novos) `src/pages/admin/components/LeadKPIBar.tsx`, `LeadFiltersPopover.tsx`, `LeadTimelineTab.tsx`, `LeadJobTab.tsx`

## Notas técnicas

- "Conversão histórica por estágio" sem tabela de eventos: calcular como `leads em estágios posteriores / (leads na coluna + leads em estágios posteriores)`, fallback "—".
- "Timeline" inicial agrega: criação (`created_at`), conversão (`converted_to_project_id`), `follow_up_actions[]` JSON existente, propostas vinculadas (query proposals por lead_id se existir relação, senão omitir).
- Registrar Contato: grava em `follow_up_actions` (JSONB) + atualiza `last_contacted_at` + opcional `next_action_date`.
- "Fechados este mês" depende dos status disponíveis — usar `in_production` (já tratado como conversão no useAdminData).
- Filtros são client-side sobre a lista já em memória; sem mudanças de query.

Vou implementar direto após aprovação.
