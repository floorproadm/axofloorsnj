

# Ajuste de extensao + Hook useCollaboratorUpload

## 1. Correcao na Edge Function (extensao derivada do MIME)

Linha 118 atual:
```text
const ext = file.name.split(".").pop() || "jpg";
```

Substituir por mapa controlado server-side:
```text
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const ext = MIME_TO_EXT[file.type];
```

Como o `file.type` ja passou pela whitelist `ALLOWED_MIME_TYPES`, o `ext` nunca sera `undefined`. Elimina confianca no nome do arquivo enviado pelo client.

## 2. Criar `src/hooks/useCollaboratorUpload.ts`

Hook simples que:
- Recebe `file`, `projectId`, `folderType` (opcional, default `job_progress`)
- Constroi `FormData` com os campos esperados pela edge function
- Chama a edge function via `fetch` usando URL construida com `VITE_SUPABASE_URL` + `/functions/v1/collaborator-upload`
- Inclui `Authorization: Bearer ${session.access_token}` no header
- Retorna o registro criado (`id`, `storage_path`, `created_at`)
- Usa `useMutation` do TanStack Query para gerenciar estado (loading, error, success)
- Invalida query `["media-files"]` no sucesso
- Exibe toast de sucesso/erro

**NAO usa** `supabase.storage` no client. Todo upload passa pela edge function.

```text
Interface de uso:
const { mutateAsync: uploadPhoto, isPending } = useCollaboratorUpload();

await uploadPhoto({
  file: selectedFile,
  projectId: "uuid-do-projeto",
  folderType: "job_progress",
});
```

## 3. Criar `src/hooks/useCollaboratorProjects.ts`

Hook que busca projetos do colaborador logado:
- Consulta `project_members` filtrado por `user_id = auth.uid()`
- Faz join com `projects` para trazer `customer_name`, `project_status`, `address`
- Usa `useQuery` com queryKey `["collaborator-projects"]`
- RLS ja garante que o colaborador so ve seus proprios memberships

## Arquivos criados

| Arquivo | Descricao |
|---|---|
| `src/hooks/useCollaboratorUpload.ts` | Mutation hook para upload via edge function |
| `src/hooks/useCollaboratorProjects.ts` | Query hook para projetos do colaborador |

## Arquivos modificados

| Arquivo | Alteracao |
|---|---|
| `supabase/functions/collaborator-upload/index.ts` | Linha 118: extensao derivada do MIME map em vez de `file.name` |

## O que NAO sera feito nesta etapa

- Componentes de UI (CollaboratorDashboard, ProjectDetail, PhotoUploadDrawer)
- Redirect automatico no Auth
- Bloqueios operacionais
- Rotas novas no App.tsx

## Sequencia pos-implementacao

1. Deploy automatico da edge function corrigida
2. Testar upload via tool com JWT valido + membership -> esperar 201
3. Testar extensao no storage path (deve ser derivada do MIME, nao do filename)
4. Proximo passo: criar UI do portal colaborador

