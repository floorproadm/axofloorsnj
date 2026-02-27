

# Ajuste: Folders contextuais no modo projeto

## Problema
No modo projeto (`?project=UUID`), a tab "Folders" mostra pastas globais do `feed_folders` — que nao tem relacao com o projeto. As "pastas" de projeto vivem na `media_files.folder_type`.

## Solucao

### 1. `src/pages/admin/CompanyFeed.tsx` — Tab "Folders" contextual

Quando `projectId` existir, a tab "Folders" deve renderizar uma grid de folder_types do projeto em vez de `FeedFolderGrid`:

- Buscar `media_files` agrupados por `folder_type` onde `project_id = projectId`
- Renderizar cards visuais para cada folder_type encontrado (ex: "Before Photos", "After Photos", "Quality Control", "Job Progress")
- Cada card mostra: icone, nome legivel, contagem de arquivos
- Clicar no card pode expandir/mostrar as midias daquele tipo (fase futura — por agora, apenas visual informativo)

Query:
```sql
SELECT folder_type, COUNT(*) as count
FROM media_files
WHERE project_id = :projectId
GROUP BY folder_type
```

Implementacao: usar `useMediaFiles` com filtro `project_id` ou criar query inline com `useQuery`.

### 2. `src/pages/admin/CompanyFeed.tsx` — Manter tab "Folders" global no modo normal

Quando NAO houver `projectId`, comportamento atual permanece identico (mostra `FeedFolderGrid` com `feed_folders`).

### 3. Mapeamento de nomes legiveis

Criar constante para traduzir `folder_type` em labels:
```typescript
const FOLDER_TYPE_LABELS: Record<string, string> = {
  job_proof_before: "Fotos Antes",
  job_proof_after: "Fotos Depois",
  quality_control: "Controle de Qualidade",
  job_progress: "Progresso do Job",
};
```

## Arquivos afetados
- `src/pages/admin/CompanyFeed.tsx` — condicional na tab "Folders" + query de media_files agrupada

## O que NAO muda
- `useFeedFolders()` permanece global (correto para modo sem projeto)
- `FeedFolderGrid` permanece intacto
- Nenhuma alteracao de banco
