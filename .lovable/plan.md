

# Fase 5.5 — Camadas Claras de Uso

## Mudancas

### 1. Migration SQL

Duas alteracoes de schema simples:

```text
-- Separar marketing de operacional
ALTER TABLE public.media_files
  ADD COLUMN is_marketing_asset boolean NOT NULL DEFAULT false;

CREATE INDEX idx_media_files_marketing
  ON public.media_files(is_marketing_asset)
  WHERE is_marketing_asset = true;

-- Flag operacional em projects
ALTER TABLE public.projects
  ADD COLUMN requires_progress_photos boolean NOT NULL DEFAULT true;
```

### 2. Atualizar plan.md

Documentar:
- Contrato de visibilidade (internal / client / public)
- Divida arquitetural: `visibility='client'` depende de `project_members` (nao existe ainda)
- `is_marketing_asset` sem enforcement por enquanto (quality gate vem na Fase 8)
- Decisao estrategica: Galeria publica preservada, Media Engine e infra operacional

### Arquivos Modificados

| Arquivo | Acao |
|---|---|
| Migration SQL | ADD COLUMN `is_marketing_asset` + indice parcial + ADD COLUMN `requires_progress_photos` |
| `.lovable/plan.md` | Atualizar com contrato de visibilidade e dividas arquiteturais documentadas |

### Arquivos NAO Modificados

- Nenhum arquivo frontend e tocado
- `useMediaFiles.ts` nao muda (coluna nova e apenas DB)
- `Gallery.tsx`, `GalleryManager.tsx` permanecem intactos
- `useFeedData.ts`, `useJobProof.ts` sem alteracao

### Zero Risco

- Colunas com DEFAULT, sem impacto em queries existentes
- Indice parcial nao afeta performance de writes normais
- Types.ts atualizado automaticamente

