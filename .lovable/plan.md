

# Adicionar Membro na Equipe (/admin/settings)

## Contexto

Atualmente, a secao "Equipe" em /admin/settings e somente leitura. O admin nao tem como convidar novos membros pelo sistema. Como o Auth nao expoe signup publico (so login), precisamos de um fluxo de convite via admin.

## Abordagem

Criar uma edge function `invite-team-member` que usa o Supabase Admin API (`supabase.auth.admin.inviteUserByEmail`) para enviar um convite por email. O admin preenche nome, email e role desejada num dialog. O backend cria o usuario, insere o profile e atribui a role.

## Mudancas

### 1. Edge Function: `supabase/functions/invite-team-member/index.ts`

- Recebe `{ email, full_name, role }` via POST
- Valida que o caller e admin (via JWT + `has_role`)
- Usa `supabase.auth.admin.inviteUserByEmail(email, { data: { full_name } })`
- Insere a role na tabela `user_roles` com o `user_id` retornado
- Retorna sucesso ou erro

### 2. UI: `src/components/admin/settings/TeamSettings.tsx`

- Adicionar botao "Convidar Membro" no header do card (ao lado do badge de contagem)
- Ao clicar, abre um Dialog com:
  - Campo: Nome completo (obrigatorio)
  - Campo: Email (obrigatorio)
  - Select: Role (admin, moderator, user) — default "user"
- Botao "Enviar Convite" que chama a edge function
- Toast de sucesso/erro + refresh da lista

### 3. Seguranca

- Edge function valida JWT e role admin server-side
- Nenhuma mudanca de schema necessaria (profiles ja sao criados pelo trigger `handle_new_user`)
- Roles sao inseridas via service_role_key na edge function, nao pelo cliente

## Fluxo

1. Admin clica "Convidar Membro"
2. Preenche nome, email e role
3. Frontend chama edge function com auth token
4. Edge function valida admin, cria usuario via invite, insere role
5. Novo membro recebe email de convite para definir senha
6. Ao aceitar, o trigger `handle_new_user` cria o profile automaticamente
7. Lista de equipe atualiza

## Arquivos

| Arquivo | Acao |
|---|---|
| `supabase/functions/invite-team-member/index.ts` | Criar |
| `src/components/admin/settings/TeamSettings.tsx` | Modificar — adicionar dialog de convite |

## Tecnico

- Usa `SUPABASE_SERVICE_ROLE_KEY` (ja configurado como secret)
- Nenhuma migration de banco necessaria
- `inviteUserByEmail` envia email automaticamente via Auth
- Role "user" nao existe no enum `app_role` (apenas admin e moderator) — o select oferecera apenas as roles existentes, ou o membro sera adicionado sem role (colaborador basico)

