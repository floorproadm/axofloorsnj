

# Kanban View para Jobs Manager

## O que muda

Adicionar um modo de visualizacao Kanban ao `/admin/jobs`, inspirado no DripJobs, mantendo a lista atual como opcao alternativa. O padrao sera Board (Kanban).

## Estrutura do Kanban

```text
Total Deals: X    Total Value: $X,XXX.XX     [Board] [List]
─────────────────────────────────────────────────────────
| Pending (0)     | In Production (1) | Completed (0)  |
| bg-amber-50     | bg-blue-50        | bg-emerald-50  |
|                 |                   |                |
|                 | [Job Card]        |                |
|                 |  Project Type     |                |
|                 |  Customer Name    |                |
|                 |  $3,156 of $6,313 |                |
|                 |  Invoice #XXXX    |                |
|                 |  Oct 14 - Oct 14  |                |
|                 |  Team Lead        |                |
|                 |  Updated Xd ago   |                |
|                 |                   |                |
| Total Rev: $0   | Total Rev: $6,313 | Total Rev: $0  |
─────────────────────────────────────────────────────────
```

## Detalhes de implementacao

### Arquivo modificado: `src/pages/admin/JobsManager.tsx`

1. **View toggle** — Adicionar estado `viewMode: 'board' | 'list'` (default: `'board'`). Reutilizar o mesmo padrao visual do toggle que ja existe no `LinearPipeline.tsx` (botoes Board/List com icones LayoutGrid e List).

2. **Summary bar** — Acima do board, mostrar:
   - Total Deals (count de projetos filtrados)
   - Total Value (soma de `estimated_revenue` dos job_costs)
   - Toggle Board/List

3. **Kanban columns** — Uma coluna por status (`pending`, `in_production`, `completed`):
   - Header colorido com nome do status + count (usando cores do `STATUS_CONFIG` existente)
   - Cards dentro de cada coluna com scroll vertical (`max-h-[65vh] overflow-y-auto`)
   - Footer com "Total Revenue" por coluna

4. **Job Card no Board** — Cada card exibe:
   - Nome do projeto + link externo (icone)
   - Badges operacionais (Colors Conf., sem custos, margem baixa, sem fotos) — ja existe `getProjectIndicator()`
   - Valor pago parcial: `$X of $Y` (estimated_revenue do job_costs)
   - Datas: start_date — completion_date
   - Team lead (ou "No Crew Assigned")
   - Customer name
   - "Updated Xd ago" — ja existe `timeAgo()`

5. **List view** — O layout atual de cards em lista permanece intacto, ativado pelo toggle.

6. **Search** — Funciona em ambos os modos (filtra `filteredProjects` que alimenta board e list).

7. **Filter tabs** — Em modo Board, os filtros "All/In Progress/Scheduled/Completed" podem destacar a coluna correspondente (opacidade reduzida nas demais, mesmo padrao do Pipeline de Vendas).

### Responsividade

- Desktop: colunas lado a lado com scroll horizontal
- Mobile: colunas empilhadas ou scroll horizontal (mesmo padrao do Pipeline de Vendas existente)

### O que NAO muda

- `JobControlModal` — intacto, abre ao clicar em qualquer card
- Logica de fetch (`useProjectsWithRelations`) — sem alteracao
- Paginacao — mantida para modo lista, no board mostra todos da pagina atual
- Zero alteracao de banco de dados
