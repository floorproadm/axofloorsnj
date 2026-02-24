

# Evolucao do /admin/settings — Centro de Governanca

O Settings atual tem 2 abas (Geral + Marketing Gallery) com 4 campos operacionais. O backend ja esta maduro (multi-role, Media Engine, pipeline com gates), mas o Settings ainda parece MVP. Este plano transforma ele em centro de governanca da empresa.

## Fase 1 — Refatorar Layout (Base para crescer)

Trocar as tabs horizontais por uma navegacao lateral (sidebar interna) dentro do Settings. Isso permite adicionar secoes sem poluir a interface.

**Estrutura do novo layout:**

```text
+------------------+--------------------------------+
| Sidebar Settings |  Conteudo da Secao Ativa       |
|                  |                                |
| > Geral          |  [Card com campos]             |
| > Branding       |                                |
| > Equipe         |                                |
| > Marketing      |                                |
|   Gallery        |                                |
+------------------+--------------------------------+
```

**Arquivo:** `src/pages/admin/Settings.tsx`
- Substituir `Tabs` por layout flex com sidebar de navegacao usando estado local
- Cada secao sera um componente lazy-loaded

**Novos arquivos:**
- `src/components/admin/settings/GeneralSettings.tsx` — extrair CompanySettingsTab atual
- `src/components/admin/settings/BrandingSettings.tsx` — nova secao
- `src/components/admin/settings/TeamSettings.tsx` — nova secao

## Fase 2 — Secao Branding

Adicionar campos de identidade visual na tabela `company_settings`:

**Migracao SQL:**
- `ALTER TABLE company_settings ADD COLUMN logo_url text`
- `ALTER TABLE company_settings ADD COLUMN primary_color text DEFAULT '#d97706'`
- `ALTER TABLE company_settings ADD COLUMN secondary_color text DEFAULT '#1e3a5f'`
- `ALTER TABLE company_settings ADD COLUMN trade_name text DEFAULT 'AXO Floors'`

**UI:**
- Upload de logo (usando bucket `media` existente com `is_marketing_asset = true`)
- Color pickers para cor primaria e secundaria
- Campo "Nome Fantasia" separado de company_name (razao social)
- Preview em tempo real das cores escolhidas

## Fase 3 — Secao Equipe

Visao institucional dos usuarios do sistema. Nao e CRUD de roles (isso seria perigoso no frontend), mas sim uma visao de leitura com acoes administrativas basicas.

**UI:**
- Tabela listando usuarios de `profiles` + `user_roles`
- Colunas: Nome, Email, Role, Data de criacao
- Badge de role (Admin, Collaborator)
- Indicador de projetos ativos (count de `project_members`)

**Seguranca:** Somente leitura. Gerenciamento de roles continua via backend direto (RLS ja protege). Nenhuma tabela nova necessaria — usa `profiles` + `user_roles` + `project_members` existentes.

## Fase 4 — Melhorias de UX na secao Geral

- Adicionar timestamp "Ultima atualizacao: X" abaixo do botao Salvar (campo `updated_at` ja existe)
- Adicionar icones aos campos para hierarquia visual
- Agrupar campos em sub-secoes: "Identidade" (nome) e "Regras de Negocio" (margem, modelo, rate)

## Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/admin/Settings.tsx` | Refatorar: tabs -> sidebar vertical + lazy sections |
| `src/components/admin/settings/GeneralSettings.tsx` | Novo: extrair CompanySettingsTab |
| `src/components/admin/settings/BrandingSettings.tsx` | Novo: upload logo + cores + nome fantasia |
| `src/components/admin/settings/TeamSettings.tsx` | Novo: lista de usuarios/roles (read-only) |
| Migracao SQL | 4 colunas novas em `company_settings` |
| `src/hooks/useCompanySettings.ts` | Atualizar: incluir novos campos no tipo e defaults |

## O que NAO sera feito agora

- Integracoes (Facebook, Notion) — aguardar demanda
- Templates operacionais — aguardar portal cliente
- Feature flags / billing — prematuro
- CRUD de roles no frontend — risco de seguranca

