

# Fase 6 — Migration SQL Completa

A verificacao do banco confirmou que NENHUMA parte da Fase 6 foi executada ainda. A funcao `get_dashboard_metrics()` nao tem `v_missing_photos`, a tabela `project_members` nao existe, e a view `projects_missing_progress_photos` nao existe.

## O que sera executado em uma unica migration

### 1. Tabela `project_members`

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

### 2. RLS para `project_members`

- `project_members_admin_all`: Admin controla tudo (RESTRICTIVE)
- `project_members_own_read`: Usuario ve apenas seus proprios memberships (RESTRICTIVE)

### 3. RLS para `projects` (colaborador le seus projetos)

- `projects_collaborator_read`: Colaborador ve apenas projetos onde e membro via `project_members` (RESTRICTIVE)
- Nota: `projects_admin_all` ja existe e nao sera modificada

### 4. RLS para `media_files` (colaborador)

- `media_files_collaborator_read`: Colaborador le midia `internal`/`client` dos projetos onde e membro
- `media_files_collaborator_insert`: Colaborador insere midia nos projetos onde e membro

### 5. View `projects_missing_progress_photos`

Consulta projetos em producao que requerem fotos de progresso mas nao possuem nenhuma.

### 6. Atualizar `get_dashboard_metrics()`

Adicionar:
- Declaracao `v_missing_photos jsonb;` no bloco DECLARE
- Bloco de consulta da view `projects_missing_progress_photos`
- Campo `missingProgressPhotos` no retorno JSON

### 7. Nenhuma storage policy nova

Bucket `media` mantem policies atuais. Colaboradores farao upload via edge function (proxima etapa).

## Impacto

- Zero breaking change: apenas adicoes
- Admin continua funcionando normalmente
- Frontend atual nao e afetado (novo campo no JSON e ignorado ate ser consumido)
- Seguranca mantida: todas as policies sao RESTRICTIVE

## Sequencia pos-migration

Apos a migration, os proximos passos serao:
1. Edge function `collaborator-upload`
2. Componentes frontend do portal
3. Rotas e redirect no Auth
4. Dashboard admin consumindo `missingProgressPhotos`

