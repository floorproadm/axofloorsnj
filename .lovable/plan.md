

# Aplicar Migration: Corrigir 8 Gargalos Estruturais

## O que será feito
Executar uma migration única que corrige 8 problemas de integridade referencial e isolamento multi-tenant identificados na auditoria do sistema.

## Ajustes necessários ao arquivo enviado
O arquivo está bem escrito, mas precisa de **2 correções** antes de aplicar:

1. **FIX 7 (appointment_assignees RLS)**: A policy original faz JOIN via `projects`, mas `appointments` já tem `organization_id` diretamente. Simplificar para usar `appointments.organization_id = get_user_org_id()`.

2. **FIX 6 (feed_folders backfill)**: O backfill via `feed_posts → projects` pode não pegar todos os registros (feed_folders sem posts vinculados a projetos). Adicionar fallback com `AXO_ORG_ID` para preencher os restantes.

## Os 8 Fixes

| Fix | Tabela | Problema | Ação |
|-----|--------|----------|------|
| 1 | `leads` | `converted_to_project_id` sem FK | FK → `projects(id)` ON DELETE SET NULL |
| 2 | `payments` | `collaborator_id` sem FK | FK → `profiles(id)` ON DELETE SET NULL |
| 3 | `project_comments` | Sem `organization_id` (tenant leak) | Add column + backfill + RLS |
| 4 | `tasks` | `related_*` sem FK | 3 FKs ON DELETE SET NULL |
| 5 | `material_requests` | `project_id` sem FK | FK → `projects(id)` ON DELETE SET NULL |
| 6 | `feed_folders` | Sem `organization_id` (tenant leak) | Add column + backfill + RLS |
| 7 | `appointments` | `assigned_to` como text array | Criar junction table `appointment_assignees` |
| 8 | `projects` | `customer_id` nullable | SET NOT NULL (se zero nulls) |

## Impacto no código
- **Nenhuma mudança de código obrigatória** — todas as alterações são aditivas (novas FKs, novas colunas, nova tabela)
- O código existente continua funcionando sem modificação
- `appointment_assignees` é uma tabela nova para uso futuro; o campo `assigned_to` original é preservado

## Execução
Uma única migration via ferramenta de database migration do Lovable Cloud. Cada fix é isolado em seu próprio bloco `DO $$ ... EXCEPTION`, então falha em um não afeta os outros.

