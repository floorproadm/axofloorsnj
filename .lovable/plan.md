

# Filtros Avancados no Feed

## O que sera feito

Transformar o botao de grid (LayoutGrid) em um botao de filtros que abre um painel lateral (Sheet) com opcoes de filtragem avancada para os posts do feed.

## Filtros disponiveis

| Filtro | Tipo | Opcoes |
|---|---|---|
| Pasta | Select | Lista das pastas existentes |
| Status | Select | Rascunho, Publicado |
| Visibilidade | Select | Interno, Publico |
| Categoria | Select | Categorias existentes nos posts |
| Tipo de midia | Select | Foto, Video |
| Periodo | Date picker | Data inicio / Data fim |

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/components/admin/feed/FeedFiltersSheet.tsx` | Criar -- Sheet lateral com os filtros |
| `src/pages/admin/CompanyFeed.tsx` | Modificar -- trocar icone do botao para Filter, adicionar state dos filtros, conectar ao Sheet e passar filtros para a query |
| `src/hooks/admin/useFeedData.ts` | Modificar -- `useFeedPosts` aceitar parametros de filtro (folder_id, status, visibility, category, post_type, date range) |

## Tecnico

- O botao LayoutGrid vira um botao com icone `SlidersHorizontal` (ou `Filter`)
- Badge com contador de filtros ativos aparece no botao
- O Sheet usa componentes existentes: Select, Calendar/DatePicker, Button
- Os filtros sao aplicados como parametros `.eq()` e `.gte()/.lte()` na query do Supabase
- Botao "Limpar filtros" dentro do Sheet
- Nenhuma migration necessaria -- todos os campos ja existem na tabela `feed_posts`

