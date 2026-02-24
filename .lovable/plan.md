

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

---

# Arquitetura: Gallery vs Media Engine

## Gallery System (Marketing)
- **Tabelas:** `gallery_folders`, `gallery_projects`
- **Bucket:** `gallery`
- **UI:** `/admin/settings` → aba "Marketing Gallery"
- **Propósito:** Curadoria manual de fotos para o site público (`/gallery`)
- **Domínio:** Marketing — conteúdo selecionado para conversão de leads

## Media Engine (Operacional)
- **Tabela:** `media_files`
- **Bucket:** `media`
- **UI:** ProjectDetail, CompanyFeed, Portal Colaborador
- **Propósito:** Infraestrutura de mídia operacional (fotos de progresso, before/after, documentação de campo)
- **Domínio:** Operação — registro de trabalho, compliance, comunicação interna

## Regra de Migração
A unificação dos dois sistemas **NÃO deve ocorrer** até que:
1. O Portal Cliente esteja ativo e necessite de fotos aprovadas
2. Haja demanda real de usar fotos operacionais como marketing automaticamente
3. O custo de manter dois sistemas supere o custo de migração

Até lá, a separação é saudável e intencional.
