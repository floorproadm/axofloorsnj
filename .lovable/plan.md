

# Feed: Funcionalidade de Deletar Post com Dupla Verificacao

## Contexto

O `/admin/feed` esta funcionando corretamente -- os posts estao carregando (5 posts confirmados via rede). O que falta e a funcionalidade de **deletar posts** com dupla confirmacao, seguindo o mesmo padrao ja usado no sistema para deletar leads e jobs.

## Alteracoes

### 1. Hook `useDeleteFeedPost` em `src/hooks/admin/useFeedData.ts`

Adicionar uma nova mutation que:
- Deleta primeiro os registros vinculados em `feed_post_images` e `feed_comments` (cleanup de orfaos)
- Depois deleta o post em `feed_posts`
- Invalida as queries do feed
- Exibe toast de sucesso/erro

### 2. Botao de Deletar no `FeedPostCard` com menu dropdown

No `src/components/admin/feed/FeedPostCard.tsx`:
- Transformar o botao `MoreVertical` (que hoje nao faz nada) em um `DropdownMenu` funcional
- Opcoes: "Editar" e "Deletar"
- "Deletar" abre o dialogo de dupla confirmacao

### 3. Botao de Deletar no `FeedPostDetail`

No `src/pages/admin/FeedPostDetail.tsx`:
- Adicionar botao "Deletar" ao lado do botao "Editar"
- Mesmo fluxo de dupla confirmacao

### 4. Componente de Dupla Verificacao

Fluxo identico ao usado para leads e jobs:
- **Passo 1**: AlertDialog com aviso "Esta acao e irreversivel. O post e todas as imagens/comentarios associados serao removidos permanentemente."
- **Passo 2**: Segundo AlertDialog pedindo confirmacao absoluta: "Tem certeza? Essa acao nao pode ser desfeita."
- Somente apos as duas confirmacoes a mutation e executada

## Detalhes Tecnicos

### Cleanup antes de deletar (ordem)

```text
1. DELETE FROM feed_post_images WHERE feed_post_id = postId
2. DELETE FROM feed_comments WHERE feed_post_id = postId  
3. DELETE FROM feed_posts WHERE id = postId
```

Isso evita registros orfaos, ja que nao ha CASCADE configurado nas foreign keys dessas tabelas.

### Arquivos modificados

| Arquivo | Alteracao |
|---|---|
| `src/hooks/admin/useFeedData.ts` | Adicionar `useDeleteFeedPost` mutation |
| `src/components/admin/feed/FeedPostCard.tsx` | DropdownMenu no MoreVertical com opcoes Editar/Deletar + dialogo dupla confirmacao |
| `src/pages/admin/FeedPostDetail.tsx` | Botao Deletar + dialogo dupla confirmacao |

### Nenhum arquivo novo necessario

O componente de dupla confirmacao sera inline nos componentes existentes usando `AlertDialog` (ja disponivel no projeto).

