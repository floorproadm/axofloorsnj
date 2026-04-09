

# Melhorar UI da Página /admin/jobs

## Problemas Atuais (vistos no screenshot)
- Cards mostram "TBD (via parceiro)" como nome do cliente — confuso
- "No Crew Assigned" aparece em todos os cards sem equipe — ruído visual
- Falta informação financeira visível nos cards do Kanban (revenue, margin)
- Sem indicador visual de sqft nos cards
- "Updated X dias ago" ocupa espaço sem agregar muito
- Labels misturados PT/EN ("Pendente" header, "via parceiro", "Updated")
- Filtros "Scheduled" não faz sentido — pending = aguardando, não agendado

## Melhorias Planejadas

### 1. Kanban Cards — Redesign com densidade útil
- **Título principal**: endereço (já implementado), fallback para customer_name
- **Subtítulo**: service type em badge pequeno (chips coloridos por tipo)
- **Cliente**: mostrar nome real, ou "Pending info" em itálico se TBD — nunca "TBD (via parceiro)"
- **Partner**: mostrar com ícone de handshake apenas se existir, sem "(via parceiro)" redundante
- **Crew**: esconder se não houver — não mostrar "No Crew Assigned"
- **Financeiro inline**: barra compacta com revenue e margin % (verde/vermelho)
- **Sqft**: mostrar se disponível, com ícone de régua
- **Timestamp**: simplificar para apenas ícone + "11d" no canto

### 2. Filtros — English consistente e mais úteis
- Renomear: "All Jobs" → "All", "In Progress" → "Active", "Scheduled" → "Pending", "Completed" → "Done"
- Adicionar contagem em cada tab: "Active (0)", "Pending (2)"

### 3. Summary Bar — Mais informativo
- Adicionar contadores por status ao lado dos totals: "2 pending · 0 active · 0 done"
- Manter total deals e total value

### 4. Lista View — Mesmo tratamento
- Aplicar mesmas melhorias de exibição de cliente/partner/crew
- Adicionar financial preview inline

### 5. Consistência de idioma
- Padronizar headers de coluna em inglês (Pending, In Production, Completed)
- Textos internos do card em inglês

## Detalhes Técnicos

### Arquivo afetado
- `src/pages/admin/JobsManager.tsx` — KanbanCard, ListView cards, filterTabs, STATUS_CONFIG labels

### Mudanças específicas
- `STATUS_CONFIG` labels: "Pendente" → "Pending", "Em Produção" → "Active", "Concluído" → "Done"
- KanbanCard: adicionar revenue/margin bar, chips de service type, esconder crew vazio, tratar TBD
- filterTabs: adicionar contagem dinâmica
- Tratar `customer_name === "TBD (via parceiro)"` como "Pending info"

