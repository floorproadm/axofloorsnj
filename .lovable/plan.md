## User Detail Modal (SPU Panel)

Modal acionado ao clicar numa linha da aba **Users**. Foco: dar ao super admin visibilidade total + ações controladas, sem entrar na org do usuário.

### Layout (Dialog, max-w-2xl, dark Linear)

```text
┌─────────────────────────────────────────────────┐
│ [avatar] Full Name                    [● status]│
│          email · phone                          │
├─────────────────────────────────────────────────┤
│ Identity        | Organization                  │
│  birthdate      |  AXO Floors LLC [owner]       │
│  region         |  joined 12 Mar 2026           │
│  bio            |  [Remove from org]            │
├─────────────────────────────────────────────────┤
│ Employment                                      │
│  type · daily_rate · is_active_crew             │
├─────────────────────────────────────────────────┤
│ Platform roles                                  │
│  [admin] [salesperson] [+ add role]             │
├─────────────────────────────────────────────────┤
│ Activity                                        │
│  Last sign-in · Created · Projects · Labor      │
│  entries · Leads owned · Appointments           │
├─────────────────────────────────────────────────┤
│ Danger zone                          [▼ expand] │
│  [Send password reset] [Disable] [Impersonate]  │
└─────────────────────────────────────────────────┘
```

### Seções e dados

**1. Header** — avatar, full_name, email, phone, status dot (active/disabled), badge "Platform Admin" se aplicável.

**2. Identity (read-only)** — birthdate, region, bio.

**3. Organization** — nome da org + role (`owner`/`admin`/`member`), data de entrada. Botão **Remove from org** (deleta de `organization_members`). Se órfão: select de org + select de role + botão **Assign to organization**.

**4. Employment (read-only)** — employment_type, daily_rate, is_active_crew.

**5. Platform roles** — chips com cada role de `user_roles`. Botão **+ add role** abre dropdown com roles do enum `app_role` ainda não atribuídas. X em cada chip remove. Guardrail: impedir remover a própria role `platform_admin`.

**6. Activity** — last_sign_in_at (de `auth.users`), created_at, contagens: projects (assigned via `project_members`), labor_entries, leads (owner_id), appointment_assignees.

**7. Danger zone (colapsado por padrão, exige confirm)**
- **Send password reset** — dispara recovery email.
- **Disable user** — bane no auth (ban_until = '2099'). Toggle Enable se já banido.
- **Impersonate** — gera magic link de login e abre em nova aba.

### Backend

**Nova RPC `spu_user_detail(p_user_id uuid)`** retorna JSONB:
```text
{ profile, auth: {last_sign_in_at, banned_until, email_confirmed_at},
  membership: {org_id, org_name, role, joined_at} | null,
  platform_roles: [...],
  activity: {projects, labor_entries, leads_owned, appointments},
  is_self: boolean }
```
Protegida por `has_role(auth.uid(), 'platform_admin')`. Lê `auth.users` direto (security definer).

**Novas RPCs mutativas (todas com check platform_admin):**
- `spu_user_set_org(p_user_id, p_org_id, p_role)` — upsert em `organization_members`.
- `spu_user_remove_org(p_user_id)` — delete de `organization_members`.
- `spu_user_add_role(p_user_id, p_role)` — insert em `user_roles`.
- `spu_user_remove_role(p_user_id, p_role)` — delete, bloqueia self-revoke de platform_admin.

**Nova edge function `spu-user-action` (service role)** para ações que precisam do Admin API do Auth:
- action: `reset_password` → `auth.admin.generateLink({type:'recovery'})` + send email.
- action: `disable` / `enable` → `auth.admin.updateUserById({ban_duration})`.
- action: `impersonate` → `auth.admin.generateLink({type:'magiclink'})`, retorna URL.

Função valida JWT do caller e checa `has_role(..., 'platform_admin')` antes de qualquer operação. Loga em `audit_log`.

### Frontend (`src/pages/SPUPanel.tsx`)

- Adicionar estado `viewUserId` em `UsersTab`. Linha da tabela vira clicável + botão `<Eye>`.
- Novo componente `UserDetailModal({ userId, onClose, onMutated })`. Faz `supabase.rpc("spu_user_detail")`. `onMutated` re-fetcha a lista após assign/remove.
- Confirmações via `AlertDialog` para Remove from org, Disable, Impersonate, role removal.
- Toasts para sucesso/erro. Toda chamada à edge function via `supabase.functions.invoke("spu-user-action", { body: { user_id, action, ... }})`.

### Out of scope (fica para depois)
- Editar campos do profile (você escolheu read-only).
- Delete profile permanente (perigoso, exigiria cascata manual).
- Histórico completo de auditoria por usuário.

### Ordem de implementação
1. Migrations: `spu_user_detail` + 4 RPCs mutativas.
2. Edge function `spu-user-action` com 3 actions.
3. Componente `UserDetailModal` + integração em `UsersTab`.
4. Smoke test: abrir modal do Eduardo, atribuir à AXO Floors como `member`, conferir que ele aparece em **View** da org.
