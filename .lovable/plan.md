

# Auto-preencher titulo ao selecionar projeto

## O que muda

Quando o usuario selecionar um projeto no dropdown, o titulo do post sera automaticamente preenchido com base nos dados do projeto selecionado.

Formato do titulo gerado: **"{customer_name} - {project_type} ({city})"**

Exemplos:
- "John Smith - Sanding & Refinishing (Newark)"
- "Maria Silva - Vinyl Installation (Jersey City)"

## Comportamento

- Ao selecionar um projeto, o titulo e preenchido automaticamente **apenas se o titulo estiver vazio ou se for igual ao titulo gerado anteriormente** (para nao sobrescrever um titulo customizado pelo usuario)
- Ao selecionar "Nenhum", o titulo nao e alterado
- O usuario pode editar o titulo manualmente a qualquer momento apos o auto-preenchimento
- A categoria tambem sera preenchida automaticamente com base no `project_type` quando possivel

## Arquivo modificado

| Arquivo | Mudanca |
|---|---|
| `src/components/admin/feed/FeedPostForm.tsx` | Adicionar logica no `onValueChange` do Select de projetos para gerar titulo automaticamente. Usar um ref para rastrear o ultimo titulo auto-gerado. |

## Detalhes tecnicos

- Criar funcao `generateTitleFromProject(project)` que retorna `"{customer_name} - {project_type}"` + `" ({city})"` se cidade existir
- Guardar em `useRef` o ultimo titulo gerado automaticamente
- No handler de selecao de projeto: se `title` estiver vazio ou igual ao `lastAutoTitle.current`, preencher com o novo titulo gerado e atualizar o ref
- Mapeamento opcional de `project_type` para categoria (ex: "sanding" -> "Refinishing")

