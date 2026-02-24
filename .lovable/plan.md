

# Adicionar "Criar Pasta" na aba Folders do /admin/feed

## Contexto

A aba "Folders" no Company Feed mostra as pastas existentes mas nao tem opcao de criar novas. O admin precisa de um botao + dialog para criar pastas, similar ao mockup fornecido.

## Mudancas

### 1. `src/hooks/admin/useFeedData.ts` — Adicionar mutation `useCreateFeedFolder`

- Nova mutation que insere na tabela `feed_folders` com campos `name` e `description`
- Invalida query `feed-folders` no sucesso
- Toast de sucesso/erro

### 2. `src/components/admin/feed/CreateFolderDialog.tsx` — Novo componente

- Dialog com formulario simples:
  - Nome da pasta (obrigatorio)
  - Descricao (opcional)
- Botao "Criar Pasta" que chama a mutation
- Fecha o dialog e limpa o form no sucesso

### 3. `src/pages/admin/CompanyFeed.tsx` — Integrar botao na aba Folders

- Adicionar botao "Nova Pasta" (icone `Plus` + texto) acima do grid de pastas, visivel apenas quando a aba Folders esta ativa
- O botao abre o `CreateFolderDialog`

## Arquivos

| Arquivo | Acao |
|---|---|
| `src/hooks/admin/useFeedData.ts` | Adicionar `useCreateFeedFolder` mutation |
| `src/components/admin/feed/CreateFolderDialog.tsx` | Criar — dialog com form de nome + descricao |
| `src/pages/admin/CompanyFeed.tsx` | Modificar — adicionar botao + dialog na aba Folders |

## Tecnico

- Nenhuma migration necessaria — tabela `feed_folders` ja existe com campos `name`, `description`, `display_order`
- RLS ja configurada para admin
- Nenhuma nova dependencia

