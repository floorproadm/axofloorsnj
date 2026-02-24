

# Substituir "Localização" por Seletor de Projeto

## O que muda

No card "Detalhes do Projeto" do formulario de post do feed, o campo "Localização" (texto livre) sera substituido por um **Select de Projetos**, permitindo vincular o post diretamente a um projeto existente no sistema.

## Beneficios

- Vinculo real entre post e projeto (usando `project_id` que ja existe na tabela `feed_posts`)
- Ao selecionar um projeto, o post herda automaticamente o nome do cliente e contexto
- Dados estruturados em vez de texto livre

## Fluxo

```text
Card "Detalhes do Projeto"
  ├─ Titulo (input - mantido)
  ├─ Projeto (Select com lista de projetos) ← NOVO
  └─ Categoria (Select - mantido)
```

O Select mostrara os projetos no formato: **"Nome do Cliente - Tipo (Cidade)"**

## Arquivos modificados

| Arquivo | Mudanca |
|---|---|
| `src/components/admin/feed/FeedPostForm.tsx` | Remover campo "Localização", adicionar Select de projetos. Novo state `projectId`. Buscar projetos via query inline. Incluir `project_id` no `buildUpdates`. |
| `src/hooks/admin/useFeedData.ts` | Garantir que `useCreateFeedPost` e `useUpdateFeedPost` passem `project_id` para o banco. |

## Detalhes tecnicos

- Busca de projetos via `supabase.from('projects').select('id, customer_name, project_type, city').order('created_at', { ascending: false })`
- Select com opcao "Nenhum" para posts sem vinculo a projeto
- O campo `location` do `feed_posts` deixa de ser preenchido pelo formulario (pode ser mantido no banco para compatibilidade)
- O `project_id` ja existe na tabela `feed_posts`, entao nao precisa de migration
- Nenhuma alteracao de banco necessaria

