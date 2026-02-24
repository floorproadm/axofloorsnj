

# Criar Pastas Padrao no Feed

## O que sera feito

Inserir as 5 pastas mostradas na imagem diretamente no banco de dados, com nomes e ordem de exibicao correta:

| Ordem | Nome | Descricao |
|---|---|---|
| 1 | Installation Projects | Projetos de instalacao de pisos |
| 2 | Refinishing Work | Trabalhos de restauracao e refinishing |
| 3 | Before & After | Fotos de antes e depois dos projetos |
| 4 | Quality Control | Controle de qualidade e inspecoes |
| 5 | Team Photos | Fotos da equipe em acao |

## Tecnico

- Uma unica migration SQL com 5 INSERTs na tabela `feed_folders`
- Campos: `name`, `description`, `display_order`
- Nenhuma mudanca de codigo — as pastas aparecerao automaticamente no grid existente da aba Folders em `/admin/feed`

