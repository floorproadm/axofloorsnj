

# Fase 5.5 — Execucao: Camadas Claras de Uso

## 1. Migration SQL

Adicionar duas colunas e um indice parcial:

```text
ALTER TABLE public.media_files
  ADD COLUMN is_marketing_asset boolean NOT NULL DEFAULT false;

CREATE INDEX idx_media_files_marketing
  ON public.media_files(is_marketing_asset)
  WHERE is_marketing_asset = true;

ALTER TABLE public.projects
  ADD COLUMN requires_progress_photos boolean NOT NULL DEFAULT true;
```

Zero risco: colunas com DEFAULT, sem impacto em queries existentes.

## 2. Atualizar `.lovable/plan.md`

Substituir conteudo atual pelo contrato arquitetural completo:

- Contrato de visibilidade (internal / client / public)
- Dividas arquiteturais documentadas:
  - `visibility='client'` equivale a `internal` ate existir `project_members`
  - `is_marketing_asset` sem enforcement ate Fase 8 (quality gate)
- Decisao estrategica: Galeria publica preservada, Media Engine e infra operacional
- Diagnostico de estado atual do sistema
- Proximo passo recomendado: Portal do Colaborador

## Arquivos Modificados

| Arquivo | Acao |
|---|---|
| Migration SQL | ADD COLUMN `is_marketing_asset` + indice + ADD COLUMN `requires_progress_photos` |
| `.lovable/plan.md` | Contrato de visibilidade e dividas arquiteturais |

## Arquivos NAO Modificados

Nenhum arquivo frontend. `useMediaFiles.ts`, `Gallery.tsx`, `GalleryManager.tsx`, `useFeedData.ts`, `useJobProof.ts` permanecem intactos.

