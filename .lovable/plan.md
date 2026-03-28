

# Job Detail — Sidebar 640px + Resize + Página Dedicada

## O que falta
1. **Largura padrão da Sheet** está em `520px`, precisa ir para `640px`
2. **Resize drag** (arrastar borda esquerda) como já existe no Lead Detail
3. **Botão para abrir página dedicada** (`ExternalLink`) no header, navegando para `/admin/jobs/:id`
4. **Página dedicada `/admin/jobs/:id`** que renderiza o mesmo conteúdo embedded (igual LeadDetail)

## Mudanças

### 1. `src/pages/admin/JobsManager.tsx` — JobDetailSheet
- Trocar `sm:max-w-[520px]` por `sm:max-w-none` + `style={{ width: sheetWidth }}`
- Adicionar estado `sheetWidth` com default `640`
- Adicionar `handleMouseDown` com listeners de `mousemove`/`mouseup` para resize drag (mesmo padrão do LeadControlModal)
- Adicionar div de resize handle na borda esquerda da Sheet
- Adicionar botão `ExternalLink` no header que navega para `/admin/jobs/${project.id}`

### 2. Nova página `src/pages/admin/JobDetail.tsx`
- Rota: `/admin/jobs/:jobId`
- Busca o projeto por ID no Supabase
- Renderiza o componente JobDetailSheet em modo `embedded` (sem Sheet wrapper, direto no layout)
- Botão "Voltar para Jobs" no topo
- Padrão idêntico ao `src/pages/admin/LeadDetail.tsx`

### 3. `src/App.tsx` — Nova rota
- Adicionar rota `/admin/jobs/:jobId` apontando para `JobDetail`
- Posicionar antes da rota `/admin/jobs/:projectId/documents` para não conflitar

### Arquivos
1. `src/pages/admin/JobsManager.tsx` — resize + width 640 + botão ExternalLink
2. `src/pages/admin/JobDetail.tsx` — nova página dedicada
3. `src/App.tsx` — nova rota

