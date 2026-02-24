

# Media Engine Unificada — Plano de Implementacao em 8 Fases

## Resumo Executivo

Consolidar 4 tabelas de midia + 4 buckets em 1 tabela `media_files` + 1 bucket `media`, mantendo backward compatibility ate validacao completa.

---

## FASE 0 — Auditoria (Completa)

Auditoria ja realizada acima. Nenhum trigger oculto, nenhuma tabela esquecida. 6 pontos de consumo frontend mapeados.

---

## FASE 1 — Criar Tabela `media_files`

### Migration SQL

```text
CREATE TABLE public.media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  feed_post_id uuid REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  uploaded_by uuid,
  uploaded_by_role text NOT NULL DEFAULT 'admin'
    CHECK (uploaded_by_role IN ('admin', 'collaborator', 'client', 'system')),
  source_type text NOT NULL DEFAULT 'admin_upload'
    CHECK (source_type IN ('feed', 'collaborator', 'admin_upload', 'marketing', 'system')),
  visibility text NOT NULL DEFAULT 'internal'
    CHECK (visibility IN ('internal', 'client', 'public')),
  folder_type text NOT NULL DEFAULT 'job_progress'
    CHECK (folder_type IN ('job_progress', 'before_after', 'marketing', 'document_attachment')),
  file_type text NOT NULL DEFAULT 'image'
    CHECK (file_type IN ('image', 'video', 'pdf')),
  storage_path text NOT NULL,
  thumbnail_path text,
  display_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}',
  quality_checked boolean NOT NULL DEFAULT false,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_media_files_project ON public.media_files(project_id);
CREATE INDEX idx_media_files_feed_post ON public.media_files(feed_post_id);
CREATE INDEX idx_media_files_visibility ON public.media_files(visibility);
CREATE INDEX idx_media_files_source ON public.media_files(source_type);
CREATE INDEX idx_media_files_folder ON public.media_files(folder_type);

-- updated_at trigger
CREATE TRIGGER trg_media_files_updated_at
  BEFORE UPDATE ON public.media_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### RLS Policies

```text
-- Enable RLS
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY media_files_admin_all ON public.media_files
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Public: read only visibility='public'
CREATE POLICY media_files_public_read ON public.media_files
  FOR SELECT TO anon
  USING (visibility = 'public');

-- Authenticated: read internal + client
CREATE POLICY media_files_authenticated_read ON public.media_files
  FOR SELECT TO authenticated
  USING (visibility IN ('internal', 'client', 'public'));
```

### Arquivos Modificados

- Nova migration SQL
- `src/integrations/supabase/types.ts` atualizado automaticamente

---

## FASE 2 — Criar Bucket Unico `media`

### Migration SQL

```text
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false);

-- RLS: admin pode upload
CREATE POLICY media_admin_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND has_role(auth.uid(), 'admin'));

-- RLS: admin pode deletar
CREATE POLICY media_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND has_role(auth.uid(), 'admin'));

-- RLS: authenticated pode ler
CREATE POLICY media_authenticated_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'media');

-- RLS: anon read (para midia publica, via signed URLs ou public path)
CREATE POLICY media_anon_read ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'media');
```

### Estrutura de Paths

```text
/media/projects/{project_id}/before_after/
/media/projects/{project_id}/progress/
/media/projects/{project_id}/documents/
/media/feed/{feed_post_id}/
/media/marketing/
/media/temp/
```

### Decisao: Bucket Privado vs Publico

Bucket `media` sera **privado**. Acesso via signed URLs (1 ano de validade para midia publica). Isso permite controle granular de acesso futuro para portal de colaborador e cliente.

---

## FASE 3 — Criar Hook `useMediaFiles`

### Novo Arquivo: `src/hooks/useMediaFiles.ts`

Funcionalidades:
- `useMediaFiles(filters)` — query com React Query
- `useUploadMedia()` — mutation que faz upload para bucket `media` + insert em `media_files`
- `useDeleteMedia()` — mutation que remove do storage + deleta registro
- `useMediaUrl(storagePath)` — retorna signed URL

Parametros do upload:
- `projectId?`, `feedPostId?`, `sourceType`, `visibility`, `folderType`, `fileType`

Padrao de path no storage:
- Projetos: `projects/{projectId}/{folderType}/{timestamp}-{random}.{ext}`
- Feed: `feed/{feedPostId}/{timestamp}-{random}.{ext}`
- Marketing: `marketing/{timestamp}-{random}.{ext}`

---

## FASE 4 — Adaptar Job Proof

### Nova RPC: `validate_project_completion_v2`

```text
Regra: para permitir project_status='completed':
  - Deve existir em media_files:
    - pelo menos 1 registro com folder_type='before_after'
      AND metadata->>'phase' = 'before'
      AND project_id = target
    - pelo menos 1 registro com folder_type='before_after'
      AND metadata->>'phase' = 'after'
      AND project_id = target
```

### Atualizar Trigger

Atualizar `enforce_job_proof_on_completion` para usar `validate_project_completion_v2` que consulta `media_files` em vez de `job_proof`.

### Dual-Write

Durante a transicao, o upload de proofs grava em AMBAS as tabelas (`job_proof` + `media_files`). Isso permite rollback seguro.

### Componente `JobProofUploader`

Refatorar para usar `useMediaFiles` internamente, mantendo a mesma interface visual.

---

## FASE 5 — Adaptar Feed para Media Engine

### Mudancas no `useFeedData.ts`

- `useUploadFeedImage`: gravar em bucket `media` + insert em `media_files` (source_type='feed') + TAMBEM insert em `feed_post_images` (dual-write)
- `useDeleteFeedPostImage`: deletar de ambas as tabelas

### Componentes Atualizados

- `FeedPostForm.tsx` — usar `useMediaFiles` para upload
- `FeedImageCarousel.tsx` — consumir `media_files` com fallback para `feed_post_images`
- `FeedPostCard.tsx` — mesma logica de fallback
- `FeedPostDetail.tsx` — consumir `media_files`

---

## FASE 6 — Galeria Publica via Media Engine

### Nova View SQL

```text
CREATE VIEW public.public_marketing_media AS
SELECT
  id, storage_path, metadata, display_order, created_at,
  folder_type, source_type
FROM public.media_files
WHERE visibility = 'public'
ORDER BY created_at DESC;
```

### Criar RPC para Signed URLs em Batch

```text
get_public_media_urls(p_limit int)
  -> retorna lista de {id, signed_url, metadata}
  para media onde visibility='public'
```

### Atualizar `Gallery.tsx`

- Remover fetch de `gallery_folders` e `gallery_projects`
- Consumir `public_marketing_media` via nova query
- Manter secao de Feed Posts (ja funciona)
- Unificar visualmente ambas as secoes

---

## FASE 7 — Migracao de Dados Legados

### Script SQL de Migracao

```text
-- gallery_projects -> media_files
INSERT INTO media_files (storage_path, visibility, source_type, folder_type, ...)
SELECT image_url, 'public', 'marketing', 'marketing', ...
FROM gallery_projects;

-- feed_post_images -> media_files
INSERT INTO media_files (feed_post_id, storage_path, source_type, ...)
SELECT feed_post_id, file_url, 'feed', ...
FROM feed_post_images;

-- job_proof -> media_files (before)
INSERT INTO media_files (project_id, storage_path, folder_type, metadata, ...)
SELECT project_id, before_image_url, 'before_after',
  '{"phase":"before"}'::jsonb, ...
FROM job_proof WHERE before_image_url IS NOT NULL;

-- job_proof -> media_files (after)
INSERT INTO media_files (project_id, storage_path, folder_type, metadata, ...)
SELECT project_id, after_image_url, 'before_after',
  '{"phase":"after"}'::jsonb, ...
FROM job_proof WHERE after_image_url IS NOT NULL;
```

### Validacao

- Contar registros: total em tabelas antigas vs total em `media_files`
- Verificar integridade de URLs
- Testar Gallery publica, Feed, e JobProof

### Drop (somente apos validacao)

```text
DROP TABLE feed_post_images CASCADE;
DROP TABLE gallery_projects CASCADE;
DROP TABLE gallery_folders CASCADE;
DROP TABLE job_proof CASCADE;
-- Remover buckets antigos: feed-media, gallery, job-proof
```

---

## FASE 8 — Quality Check Enforcement

### Trigger de Publicacao

```text
CREATE TRIGGER trg_media_quality_gate
  BEFORE UPDATE ON public.media_files
  FOR EACH ROW
  WHEN (NEW.visibility = 'public' AND NEW.quality_checked = false)
  EXECUTE FUNCTION block_unreviewed_public_media();

-- Funcao
CREATE FUNCTION block_unreviewed_public_media() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Publicacao bloqueada: quality_checked deve ser true antes de tornar publico';
END;
$$ LANGUAGE plpgsql;
```

Somente admin pode setar `quality_checked = true`, `reviewed_by`, `reviewed_at`.

---

## Ordem de Execucao

```text
Fase 1: Criar tabela media_files          (sem impacto)
Fase 2: Criar bucket media                (sem impacto)
Fase 3: Criar hook useMediaFiles          (sem impacto)
Fase 4: Adaptar JobProof (dual-write)     (backward compatible)
Fase 5: Adaptar Feed (dual-write)         (backward compatible)
Fase 6: Galeria publica via media_files   (substituicao visual)
Fase 7: Migrar dados + drop legados       (destructivo - requer validacao)
Fase 8: Quality gate enforcement          (novo comportamento)
```

## Arquivos Criados/Modificados

| Arquivo | Acao |
|---|---|
| Migration SQL (Fase 1) | Criar tabela `media_files` + RLS + indices |
| Migration SQL (Fase 2) | Criar bucket `media` + policies |
| `src/hooks/useMediaFiles.ts` | **NOVO** — hook unificado |
| `src/hooks/useJobProof.ts` | Refatorar para dual-write |
| `src/hooks/admin/useFeedData.ts` | Refatorar upload para dual-write |
| `src/components/admin/JobProofUploader.tsx` | Consumir `useMediaFiles` |
| `src/components/admin/feed/FeedPostForm.tsx` | Usar novo upload |
| `src/components/admin/feed/FeedImageCarousel.tsx` | Consumir `media_files` |
| `src/components/admin/feed/FeedPostCard.tsx` | Fallback para nova tabela |
| `src/pages/Gallery.tsx` | Consumir `public_marketing_media` |
| `src/pages/admin/GalleryManager.tsx` | Refatorar para `media_files` |
| `src/components/admin/ImageUploader.tsx` | Upload para bucket `media` |
| Migration SQL (Fase 7) | Migrar dados + drop tabelas |
| Migration SQL (Fase 8) | Trigger quality gate |

## Resultado Final

- **1 bucket** (`media`)
- **1 tabela** (`media_files`)
- **1 hook** (`useMediaFiles`)
- **0 duplicacao**
- **3 camadas** (interno, cliente, publico) usando mesma infraestrutura
- **Base pronta** para Portal Colaborador e Portal Cliente

