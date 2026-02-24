

# Melhorias de Clareza: Galeria Marketing vs Media Engine

Duas alteracoes pequenas para documentar a separacao estrategica entre a Galeria Publica (marketing) e a Media Engine (operacional).

## Alteracao 1 — Renomear aba "Galeria Publica" para "Marketing Gallery"

No arquivo `src/pages/admin/Settings.tsx`, alterar o texto da aba e icone de "Galeria Publica" para "Marketing Gallery", deixando claro o dominio.

## Alteracao 2 — Documentar separacao no plan.md

Adicionar uma secao no `.lovable/plan.md` documentando que:
- A Gallery (gallery_folders / gallery_projects) e um sistema isolado de marketing
- A Media Engine (media_files) e infraestrutura operacional
- A migracao so deve ocorrer quando o Portal Cliente estiver ativo e houver necessidade real de unificacao

## Arquivos modificados

| Arquivo | Alteracao |
|---|---|
| `src/pages/admin/Settings.tsx` | Renomear label da aba de "Galeria Publica" para "Marketing Gallery" |
| `.lovable/plan.md` | Adicionar secao de arquitetura documentando a separacao Gallery vs Media Engine |

