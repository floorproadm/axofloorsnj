

# Seed Estrategico AXO V1 - Correcoes e Execucao

## Problemas encontrados no SQL original

O seed tem 2 erros que impediriam a execucao:

1. **`job_costs`**: coluna `revenue` nao existe. O nome correto e `estimated_revenue`.
2. **`leads`**: coluna `phone` e NOT NULL sem default, mas o seed nao inclui `phone`.

## Plano

### 1. Corrigir e executar o seed SQL

Ajustes necessarios:
- `job_costs`: trocar `revenue` por `estimated_revenue`
- `leads`: adicionar coluna `phone` no INSERT com valores ficticios (ex: `'(732) 555-0001'`)

### 2. Validar com queries de verificacao

Apos o seed, rodar as queries de check:
- `SELECT * FROM leads_followup_overdue`
- `SELECT * FROM leads_estimate_scheduled_stale`
- `SELECT * FROM projects_missing_progress_photos`
- `SELECT get_dashboard_metrics()->'recentFieldUploads'`
- `SELECT get_dashboard_metrics()->'slaBreaches'`

### Arquivos modificados

Nenhum arquivo de codigo sera alterado. Apenas dados serao inseridos no banco via migration tool (INSERT).

### Cleanup

O script de cleanup original funciona sem alteracoes, pois filtra por prefixo `SEED_AXO_V1__`.

