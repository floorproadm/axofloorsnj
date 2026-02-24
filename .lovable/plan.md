

# Edge Function: collaborator-upload (com verify_jwt = true)

Correcao aplicada conforme sua revisao: **nao usar verify_jwt = false**. O Supabase valida o JWT automaticamente antes da funcao executar, eliminando superficie de ataque.

## Arquivo Criado

### `supabase/functions/collaborator-upload/index.ts`

**Autenticacao:**
- SEM `verify_jwt = false` no config.toml (mantemos o default `true`)
- SEM `getClaims()` manual
- Usa `supabase.auth.getUser()` para obter o usuario ja validado pelo gateway
- Se `!user` retorna 401 (caso extremo)

**Fluxo completo:**

```text
POST multipart/form-data
  file, projectId, folderType, metadata(opcional)

1. CORS preflight (OPTIONS -> 200)
2. supabase.auth.getUser() -> userId (JWT ja validado pelo gateway)
3. Validar inputs:
   - file presente e <= 10MB
   - file.type in [image/jpeg, image/png, image/webp]
   - projectId formato UUID
   - folderType in ['before_after', 'job_progress'] (default: job_progress)
4. Service role client -> consultar project_members
   - WHERE project_id = projectId AND user_id = userId
   - Se nao membro -> 403
5. Upload ao bucket 'media' via service role
   - Path: projects/{projectId}/{folderType}/{timestamp}-{random}.{ext}
6. Insert em media_files via service role:
   - uploaded_by = userId
   - uploaded_by_role = 'collaborator'
   - source_type = 'collaborator'
   - visibility = 'internal'
   - folder_type = folderType
7. Se insert falhar -> cleanup do arquivo no storage
8. Retornar { id, storage_path, created_at } com status 201
```

**Codigos de erro:**
- 401: JWT invalido (bloqueado pelo gateway) ou getUser() falhou
- 403: Nao e membro do projeto
- 400: Input invalido (arquivo ausente, grande demais, tipo invalido, projectId invalido)
- 405: Metodo nao permitido (apenas POST e OPTIONS)
- 500: Erro interno

## Config

**NENHUMA alteracao em `supabase/config.toml`**. O default `verify_jwt = true` se aplica automaticamente. Isso significa que requisicoes sem JWT valido sao rejeitadas pelo gateway antes de chegar ao codigo.

## Diferencas vs plano anterior

| Aspecto | Antes | Agora |
|---|---|---|
| config.toml | verify_jwt = false | Sem alteracao (default true) |
| Auth method | getClaims() manual | getUser() (JWT pre-validado) |
| Superficie de ataque | Funcao exposta sem JWT | Gateway bloqueia antes |
| Complexidade | Mais codigo de validacao | Mais simples e seguro |

## Seguranca mantida

- Service role key usada APENAS server-side
- Nenhuma storage policy nova
- Membership validada antes de qualquer operacao
- Whitelist de folder types e mime types
- Limite de 10MB
- Cleanup em caso de falha

## Sequencia pos-implementacao

1. Deploy automatico da edge function
2. Testar via tool com JWT valido + membership -> esperar 201
3. Testar com JWT valido + sem membership -> esperar 403
4. Sem JWT -> gateway rejeita (nem chega ao codigo)
5. Depois: criar hooks e UI do portal colaborador

