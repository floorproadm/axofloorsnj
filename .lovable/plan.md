
# Implementar Filtro Controlled por `?status=` no Pipeline

## Alteracoes

### 1. `src/pages/admin/LeadsManager.tsx`
- Importar `useSearchParams` de `react-router-dom` e `normalizeStatus` + `PIPELINE_STAGES` de `useLeadPipeline`
- Ler `searchParams.get('status')`, normalizar via `normalizeStatus()`
- Validar se o status normalizado existe em `SALES_STAGES` do LinearPipeline (passando lista ou verificando inline)
- Passar `statusFilter` (controlled, nao "initial") e `onClearFilter` callback para `LinearPipeline`
- `onClearFilter` faz `searchParams.delete('status')` + `setSearchParams(searchParams, { replace: true })`

### 2. `src/pages/admin/components/LinearPipeline.tsx`
- Adicionar props opcionais na interface: `statusFilter?: string` e `onClearFilter?: () => void`
- Board view: todas as colunas continuam visiveis; coluna do `statusFilter` recebe destaque (ring/border); demais ficam com `opacity-50`
- List view: `sortedLeads` filtrado por `statusFilter` quando presente
- Chip de filtro ativo no topo (ao lado do view toggle): mostra `"Filtro: {STAGE_LABELS[status]}"` com botao X que chama `onClearFilter`
- Status invalido/undefined = sem filtro, comportamento normal

## Comportamento esperado
- `/admin/leads?status=proposal_sent` -- destaca coluna proposal_sent, lista filtra
- `/admin/leads?status=foo` -- normalizeStatus retorna `cold_lead`, mas se nao bater com SALES_STAGES validos, ignora (nenhum filtro)
- Clicar X no chip -- URL vira `/admin/leads`, filtro limpo
- Navegar de volta do browser -- URL muda, `useSearchParams` reage, filtro atualiza automaticamente (controlled)

## Nao sera alterado
- Nenhum RPC ou query backend
- Nenhuma estrutura de dados
- Nenhum comportamento existente sem filtro
