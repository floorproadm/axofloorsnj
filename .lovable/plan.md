

# Job Modal Fotos → Media Engine via Feed

## Resumo
Substituir o bloco inline de fotos (JobProofUploader) no Job Modal por navegacao ao Company Feed filtrado por projeto. O Feed vira o ponto unico de gestao de midia.

## Alteracoes

### 1. `src/hooks/admin/useFeedData.ts`
- Adicionar `project_id?: string` na interface `FeedPostFilters` (linha 54-62)
- Na funcao `useFeedPosts`, adicionar filtro: `if (filters?.project_id) query = query.eq("project_id", filters.project_id);` (apos linha 85)

### 2. `src/pages/admin/CompanyFeed.tsx`
- Importar `useSearchParams` de `react-router-dom` e `ArrowLeft` do lucide
- Extrair `projectId` via `useSearchParams`
- Quando `projectId` existir: buscar `customer_name` do projeto via query simples
- Passar `project_id` automaticamente nos filtros do `useFeedPosts`
- Renderizar header contextual: "Projeto: {customer_name}" com botao "Voltar ao Job" (`/admin/jobs`)
- Esconder botao "Nova Pasta" e botao "+" (novo post) quando em modo projeto
- Nao contar `project_id` como filtro ativo visivel no badge

### 3. `src/pages/admin/JobsManager.tsx`
- **Botao "Fotos"** (linhas 1055-1068): trocar `onClick` para fechar modal e navegar a `/admin/feed?project=${project.id}`
- **NRA action "proof"** (linha 859): mesma navegacao em vez de `setShowBlock("proof")`
- **Remover bloco inline** (linhas 1172-1179): remover o `showBlock === "proof"` que renderiza `<JobProofUploader>`
- **Tipo de showBlock** (linha 628): remover `"proof"` do union type -> `"costs" | "proposal" | null`
- **Import cleanup** (linha 20): remover `import { JobProofUploader }`

## O que NAO muda
- `JobProofUploader` como componente permanece no projeto (pode ser reusado)
- `useJobProof` hook permanece intacto (enforcement de completion)
- Zero alteracoes de banco de dados
- `FeedFiltersSheet` nao precisa de mudanca (project_id e contextual, nao aparece no sheet)

## Fluxo Final
```text
Job Modal → Fotos → fecha modal → /admin/feed?project=UUID
                                     ↓
                      Feed filtrado por projeto
                      Header "Projeto: Cliente"
                      Botao "Voltar ao Job"
```
