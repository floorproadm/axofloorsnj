# Plano — MASTER_DOSSIER_2026.md

Gerar um documento de conhecimento exaustivo e auto-suficiente em `docs/MASTER_DOSSIER_2026.md` cobrindo as 17 seções solicitadas, baseado em auditoria real do codebase + introspecção do banco Supabase (não em memória/suposição).

## Fase 1 — Coleta de Dados (read-only, sistemática)

Vou rodar uma varredura completa antes de escrever uma única linha do dossier:

**Codebase (via `code--view` / `rg`):**
- `src/App.tsx` integral → mapa de rotas (Seção 2)
- `src/components/shared/ProtectedRoute.tsx`, `AuthContext.tsx`, todas páginas `auth` (Seção 6)
- Todos os arquivos em `src/hooks/` (Seção 9 — ~40 hooks)
- Todos os componentes em `src/components/{admin,collaborator,partner,portal,proposal}/` (Seção 10)
- Todas as Edge Functions em `supabase/functions/*/index.ts` (Seção 8)
- `src/pages/Public{Invoice,Proposal,Portal}.tsx`, `SharedPost.tsx` (Seção 7)
- `src/components/admin/settings/*`, `useCompanySettings.ts` (Seção 12)
- `src/hooks/useServiceCatalog.ts` + `ProposalGenerator.tsx` (Seção 14)
- `.env`, `supabase/config.toml` (Seção 17)

**Supabase (via `supabase--read_query` + `security--get_table_schema`):**
- `information_schema.tables` + `columns` para todas as tabelas do schema `public`
- `pg_policies` para todas as policies RLS
- `pg_trigger` + `pg_proc` para triggers e funções (algumas já listadas no contexto, completar com restantes)
- `storage.buckets` + `storage.objects` policies
- Indexes via `pg_indexes`

## Fase 2 — Estruturação do Documento

O dossier será gerado em **um único arquivo** seguindo exatamente as 17 seções pedidas + a seção final `## GAPS IDENTIFICADOS`. Convenções:

- Tabelas markdown para dados estruturados (rotas, campos, RLS)
- Blocos ```sql``` para fórmulas de generated columns, definições de policies e corpo de funções relevantes
- Blocos ```ts``` para assinaturas de hooks e props de componentes
- Marcadores: `💰 CRÍTICO` / `⚠️ VERIFICAR` / `🗑️ LEGADO`
- Sem resumir: cada tabela/função/hook/componente recebe sua entrada própria

## Fase 3 — Tamanho e Entrega

Estimativa: ~3.000-5.000 linhas de markdown (~150-250KB). Será escrito em um único `code--write` para `docs/MASTER_DOSSIER_2026.md`.

Como é volumoso, vou trabalhar em ordem de seção mas escrever o arquivo de uma vez no final, depois confirmar com `wc -l` e amostragem.

## Limitações Honestas (irão para "GAPS IDENTIFICADOS")

Coisas que provavelmente exigirão marcação `⚠️ VERIFICAR`:
- Estrutura exata do database do Notion (lado externo, não está no código)
- Templates HTML do Resend (se forem inline em edge functions, capturo; se vierem do dashboard Resend, marco como gap)
- Eventos exatos do Facebook CAPI além do que estiver hardcoded em `facebook-conversions/index.ts`
- Tamanho máximo de upload por bucket (configurado no dashboard Supabase, não no código)
- Cron schedules exatos (pg_cron tabela `cron.job` — tentarei consultar)

## O Que NÃO Farei

- Não vou inventar campos ou políticas que não consigo confirmar
- Não vou copiar conteúdo das memórias `mem://` como se fosse verdade atual — vou validar contra o codebase
- Não vou criar/editar nenhum outro arquivo além de `docs/MASTER_DOSSIER_2026.md`

## Resultado Final

Um único arquivo `docs/MASTER_DOSSIER_2026.md` pronto para ser consumido por agentes externos (Antigravity, Claude Code, etc.) sem precisar fazer perguntas básicas sobre o sistema.

Aprove para eu sair do modo plan e executar.