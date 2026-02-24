

# Confirmacao antes de Criar Post

## Problema atual

Ao navegar para `/admin/feed/new/edit`, um rascunho e criado automaticamente no banco de dados via `useEffect`, mesmo que o usuario nao termine de preencher o formulario. Isso gera posts "lixo" no banco.

## Solucao

Duas mudancas complementares:

### 1. Remover criacao automatica de rascunho

O `useEffect` em `FeedPostEdit.tsx` que cria o draft imediatamente sera removido. Em vez disso, o post so sera criado quando o usuario clicar em "Salvar Post".

### 2. Adicionar dialog de confirmacao no botao Salvar

Ao clicar em "Salvar Post" em um post novo, um `AlertDialog` aparecera pedindo confirmacao antes de efetivamente criar o post.

## Fluxo novo

```text
Usuario clica "+"
    |
Formulario vazio (sem nada salvo no banco)
    |
Preenche titulo, descricao, etc.
    |
Clica "Salvar Post"
    |
AlertDialog: "Confirmar criacao do post?"
    |
[Cancelar]  /  [Confirmar]
                    |
              Cria post no banco
              Upload de imagens (se houver)
              Redireciona para o post
```

## Impacto em imagens

Como o post ainda nao existe no banco durante a edicao, o upload de imagens precisara ser feito localmente (guardar os arquivos em estado) e enviado ao banco apenas apos a confirmacao e criacao do post. As imagens serao armazenadas temporariamente em memoria como `File[]`.

## Arquivos modificados

| Arquivo | Mudanca |
|---|---|
| `src/pages/admin/FeedPostEdit.tsx` | Remover `useEffect` de criacao automatica. Novo fluxo: criar post + upload de imagens no `handleSave`. |
| `src/components/admin/feed/FeedPostForm.tsx` | Imagens guardadas como `File[]` localmente para novos posts. Botao Salvar abre AlertDialog de confirmacao quando `isNew`. |

## Detalhes tecnicos

- `FeedPostForm` recebera nova prop `isNew: boolean`
- Para posts novos, imagens ficam em estado local como `File[]` (sem upload imediato)
- O `onSave` retornara tambem os arquivos pendentes
- `FeedPostEdit.handleSave` para novos posts: primeiro `createPost.mutate`, depois faz upload das imagens em sequencia, e redireciona
- AlertDialog usa componente `AlertDialog` ja existente no projeto
- Para posts existentes (edicao), o fluxo permanece identico ao atual

