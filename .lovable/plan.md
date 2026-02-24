
# AXO OS — Contrato Arquitetural v5.5

## Contrato de Visibilidade (Media Engine)

| Nivel | Quem ve | Onde aplica |
|---|---|---|
| `internal` | Admin + futuros colaboradores | Default. Fotos de obra, progresso, documentos internos |
| `client` | Admin + cliente vinculado ao projeto | Fotos aprovadas para compartilhar com cliente |
| `public` | Qualquer usuario | Apenas midias com `is_marketing_asset=true` e `quality_checked=true` |

## Dividas Arquiteturais Controladas

### 1. `visibility='client'` sem isolamento real
- **Status**: ⚠️ Divida ativa
- **Causa**: Nao existe tabela `project_members` ainda
- **Efeito**: `client` equivale a `internal` ate implementacao do Portal do Colaborador/Cliente
- **Resolucao planejada**: Fase 6 (Portal Colaborador) cria `project_members`

### 2. `is_marketing_asset` sem enforcement
- **Status**: ⚠️ Divida ativa
- **Causa**: Qualquer admin pode marcar `true` sem quality gate
- **Efeito**: Nao existe revisao obrigatoria nem trigger bloqueando publicacao
- **Resolucao planejada**: Fase 8 (Quality Gate)

## Decisoes Estrategicas

1. **Galeria publica preservada**: `gallery_projects` + `gallery_folders` permanecem intactos. Migracao para `media_files` somente quando 80%+ das fotos publicas ja vierem do Media Engine
2. **Media Engine = infra operacional**: Nao e sistema de galeria. E prova de execucao, evidencia de etapa, base para cliente e marketing
3. **Ordem de construcao**: Operacao → Cliente → Marketing (nunca o contrario)

## Diagnostico Atual

| Camada | Status |
|---|---|
| Media infra | 🟢 Estruturada (`media_files` + bucket `media`) |
| Separacao marketing | 🟢 Definida (`is_marketing_asset`) |
| Galeria publica | 🟢 Estavel (sistema legado preservado) |
| SLA operacional | 🟡 Preparado (`requires_progress_photos` flag) |
| Portal colaborador | 🔴 Nao iniciado |
| Portal cliente | 🔴 Nao iniciado |

## Proximo Passo Recomendado

**Portal do Colaborador (Fase 6)**
- Criar `project_members` (project_id, user_id, role)
- Telas mobile-first: agenda, upload de fotos, checklist
- Resolve divida de `visibility='client'`
- Alimenta Media Engine com fotos reais de campo
