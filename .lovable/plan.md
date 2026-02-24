
# Botoes "Salvar" e "Rascunho" no formulario de post

## O que muda

O botao unico "Salvar Post" sera substituido por dois botoes lado a lado:

| Botao | Acao | Status salvo |
|---|---|---|
| **Rascunho** | Salva com `status: "draft"` | draft |
| **Salvar** | Abre dialog de confirmacao (novo) ou salva direto (edicao) com `status: "published"` | published |

## Layout

```text
[  Rascunho  ]  [  Salvar Post  ]
  (outline)       (primary/filled)
```

- "Rascunho" usa variante `outline`
- "Salvar Post" usa variante `default` (primary)

## Arquivo modificado

| Arquivo | Mudanca |
|---|---|
| `src/components/admin/feed/FeedPostForm.tsx` | Substituir botao unico por dois botoes. Adicionar funcao `handleDraftClick` que forca `status: "draft"` no `buildUpdates`. O botao "Salvar" forca `status: "published"`. Dialog de confirmacao aparece apenas no "Salvar" para posts novos. |

## Detalhes tecnicos

- `buildUpdates` recebera um parametro opcional de status override: `buildUpdates(statusOverride?: string)`
- Botao "Rascunho": chama `onSave(buildUpdates("draft"))` diretamente (sem dialog de confirmacao)
- Botao "Salvar Post": para novos posts abre o AlertDialog com status "published"; para edicao salva direto com status "published"
- `handleConfirmCreate` passa `buildUpdates("published")` ao `onSave`
- Ambos os botoes ficam desabilitados quando `isSaving` ou titulo vazio
- O Select de status no card "Organizacao" sera removido pois agora o status e controlado pelos botoes
