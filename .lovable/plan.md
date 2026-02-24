

# Fase 6 — Portal do Colaborador V1 (Corrigido)

Plano corrigido com base nas 3 falhas identificadas pelo seu agente.

## Correcoes Aplicadas

### Correcao 1: Storage — Upload via RPC (nao via policy aberta)

O plano original abria o bucket `media` para qualquer usuario autenticado. Isso e uma brecha grave.

**Solucao**: Nao criar storage policies para colaboradores. Em vez disso, criar uma **funcao RPC** no schema `public` que:
1. Valida que o usuario e membro do projeto via `project_members`
2. Faz o upload usando `SECURITY DEFINER` (executa com privilegios do owner)
3. Insere o registro em `media_files`

Na pratica, o frontend do colaborador chama a RPC em vez de fazer upload direto ao storage. O hook `useUploadMedia` sera adaptado para colaboradores usarem um fluxo diferente: upload via edge function que valida membership.

**Alternativa mais simples (recomendada)**: Criar uma **edge function** `collaborator-upload` que:
- Recebe o arquivo + projectId
- Valida `project_members` no servidor
- Faz upload ao storage com service role
- Insere registro em `media_files`

Isso evita tocar em storage policies e mantem seguranca total.

### Correcao 2: Policy Admin em Projects ja existe

Verificado no banco: `projects_admin_all` ja existe com `has_role(auth.uid(), 'admin')` para ALL. A nova policy `projects_collaborator_read` sera adicionada sem conflito — policies em Postgres sao OR entre si (quando ambas PERMISSIVE), mas aqui todas sao RESTRICTIVE. Precisamos garantir que a nova policy do colaborador tambem seja RESTRICTIVE e que o admin continue funcionando.

**Decisao**: A policy `projects_collaborator_read` sera criada como RESTRICTIVE (consistente com o padrao do projeto). Como `projects_admin_all` ja cobre ALL para admins, nao ha conflito.

### Correcao 3: Redirect inteligente com 3 destinos

Em vez de binario admin/collaborator:

```text
Se admin → /admin
Se tem membership em project_members → /collaborator
Senao → / (homepage, sem acesso especial)
```

Nenhum redirect automatico para `/collaborator` sem verificar membership real.

---

## Fase 1 — Migration SQL

### 1.1 Tabela `project_members`

```text
CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'collaborator'
    CHECK (role IN ('collaborator', 'manager', 'client')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_user ON public.project_members(user_id);
CREATE INDEX idx_project_members_project ON public.project_members(project_id);
```

### 1.2 RLS para `project_members`

```text
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Admin controla tudo
CREATE POLICY "project_members_admin_all"
  ON public.project_members FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Usuarios veem apenas seus proprios memberships
CREATE POLICY "project_members_own_read"
  ON public.project_members FOR SELECT
  USING (auth.uid() = user_id);
```

### 1.3 RLS para `projects` (colaborador le seus projetos)

```text
CREATE POLICY "projects_collaborator_read"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
    )
  );
```

Nota: `projects_admin_all` ja existe e cobre admin. Sem conflito.

### 1.4 RLS para `media_files` (colaborador le/insere em seus projetos)

```text
CREATE POLICY "media_files_collaborator_read"
  ON public.media_files FOR SELECT
  USING (
    media_files.visibility IN ('internal', 'client')
    AND EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = media_files.project_id
        AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "media_files_collaborator_insert"
  ON public.media_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = media_files.project_id
        AND pm.user_id = auth.uid()
    )
  );
```

### 1.5 View de alerta de fotos obrigatorias

```text
CREATE VIEW public.projects_missing_progress_photos AS
SELECT p.id AS project_id, p.customer_name
FROM public.projects p
WHERE p.project_status = 'in_production'
  AND p.requires_progress_photos = true
  AND NOT EXISTS (
    SELECT 1 FROM public.media_files m
    WHERE m.project_id = p.id
      AND m.folder_type = 'job_progress'
  );
```

### 1.6 Storage — NENHUMA policy nova

O bucket `media` mantem policies atuais (apenas admin pode upload/delete). Colaboradores fazem upload via edge function.

---

## Fase 2 — Edge Function `collaborator-upload`

Nova edge function em `supabase/functions/collaborator-upload/index.ts`:

- Recebe: arquivo (multipart) + `projectId` + `folderType` + `metadata`
- Valida: usuario autenticado via JWT
- Valida: membership em `project_members` usando service role
- Upload: faz upload ao bucket `media` com service role key
- Insert: cria registro em `media_files` com `source_type: 'collaborator'`, `visibility: 'internal'`
- Retorna: o registro criado

Isso garante que o colaborador so faz upload em projetos onde e membro, sem abrir storage policies.

---

## Fase 3 — Rotas e Redirect

### 3.1 Novas rotas em `App.tsx`

```text
/collaborator           → CollaboratorDashboard
/collaborator/project/:id → CollaboratorProjectDetail
```

Ambas protegidas com `<ProtectedRoute requireAdmin={false}>`.

### 3.2 Redirect inteligente no `Auth.tsx`

Apos login:
1. Verifica `has_role(uid, 'admin')` → se sim, vai para `/admin`
2. Verifica se existe registro em `project_members` para o uid → se sim, vai para `/collaborator`
3. Senao → vai para `/` (homepage)

---

## Fase 4 — Componentes do Portal

### 4.1 `CollaboratorLayout.tsx`
Layout mobile-first simplificado. Header com logo + nome. Bottom nav (Home, Meus Jobs). Sem sidebar, sem dados financeiros.

### 4.2 `CollaboratorDashboard.tsx` (`/collaborator`)
- Saudacao com nome do usuario (via `profiles`)
- Lista de projetos via `project_members` join `projects`
- Cards com: cliente, endereco, status, indicador de fotos pendentes
- Filtro: "Em producao" / "Todos"

### 4.3 `CollaboratorProjectDetail.tsx` (`/collaborator/project/:id`)
- Info do projeto (cliente, endereco, tipo, status)
- Sem dados financeiros
- Grid de fotos ja enviadas (signed URLs)
- Botao FAB "Enviar Foto"

### 4.4 `PhotoUploadDrawer.tsx`
- Escolher tipo: Before / Progress / After
- Captura da camera (`accept="image/*" capture="environment"`)
- Chama edge function `collaborator-upload` (nao upload direto ao storage)
- Feedback de progresso

### 4.5 `useCollaboratorProjects.ts`
Hook que busca projetos do colaborador logado via join com `project_members`.

### 4.6 `useCollaboratorUpload.ts`
Hook que chama a edge function `collaborator-upload` em vez de `useUploadMedia` direto.

---

## Fase 5 — Alerta no Dashboard Admin

### 5.1 Atualizar `get_dashboard_metrics()`
Adicionar bloco `missingProgressPhotos` consultando a view.

### 5.2 Atualizar `useDashboardData.ts`
Expor `missingProgressPhotos` no retorno.

### 5.3 Atualizar `Dashboard.tsx`
Novo card em acoes urgentes: "X projetos sem fotos de progresso".

---

## Arquivos Criados

| Arquivo | Descricao |
|---|---|
| Migration SQL | `project_members` + RLS + view |
| `supabase/functions/collaborator-upload/index.ts` | Edge function de upload seguro |
| `src/pages/collaborator/Dashboard.tsx` | Dashboard do colaborador |
| `src/pages/collaborator/ProjectDetail.tsx` | Detalhe + upload |
| `src/components/collaborator/CollaboratorLayout.tsx` | Layout mobile-first |
| `src/components/collaborator/CollaboratorBottomNav.tsx` | Nav inferior |
| `src/components/collaborator/PhotoUploadDrawer.tsx` | Drawer de upload |
| `src/hooks/collaborator/useCollaboratorProjects.ts` | Hook de projetos |
| `src/hooks/collaborator/useCollaboratorUpload.ts` | Hook de upload via edge function |

## Arquivos Modificados

| Arquivo | Mudanca |
|---|---|
| `src/App.tsx` | Rotas `/collaborator` |
| `src/pages/Auth.tsx` | Redirect inteligente (admin / collaborator / homepage) |
| `src/hooks/admin/useDashboardData.ts` | Expor `missingProgressPhotos` |
| `src/pages/admin/Dashboard.tsx` | Card de alerta de fotos |
| `.lovable/plan.md` | Status do Portal |

## Arquivos NAO Modificados

- `useMediaFiles.ts` — reutilizado sem alteracao
- Storage policies — nenhuma nova (seguranca mantida)
- `AdminLayout.tsx`, `AdminSidebar.tsx` — portal tem layout proprio
- Galeria publica — intacta

## Restricoes de Seguranca

- Colaborador NAO ve: `job_costs`, `proposals`, `company_settings`, `audit_log`
- Colaborador NAO altera: `project_status`, dados de cliente
- Colaborador SO insere: `media_files` nos projetos dele (via edge function validada)
- Colaborador SO le: projetos onde e membro + midia `internal`/`client` desses projetos
- Storage bucket `media`: continua restrito a admin (colaborador usa edge function)

## Sequencia de Execucao

1. Migration SQL (project_members + RLS + view)
2. Edge function collaborator-upload
3. CollaboratorLayout + BottomNav
4. CollaboratorDashboard
5. CollaboratorProjectDetail + PhotoUploadDrawer
6. App.tsx com rotas
7. Auth.tsx com redirect inteligente
8. Dashboard admin com alerta de fotos
9. plan.md atualizado

