

# Delete Payment -- Dentro do Edit Mode com Dupla Verificacao

## Contexto
O botao Delete so aparece quando o usuario entra no modo de edicao (Edit Payment), que ja e restrito a payments com status "pending". Isso garante que o delete nunca acontece por acidente -- o usuario precisa deliberadamente entrar em Edit, rolar ate o final, e confirmar com verificacao dupla.

## Mudancas

### `src/components/admin/payments/PaymentDetailsSheet.tsx`

1. **Importar** `useDeletePayment` do hook e o icone `Trash2` do lucide-react
2. **Adicionar estados**: `showDeleteConfirm` (boolean) e `deleteConfirmText` (string)
3. **No final do Edit Mode** (abaixo dos botoes Save/Discard), adicionar:
   - Um separador visual
   - Um link discreto em texto pequeno vermelho: "Delete this payment"
   - Ao clicar, revela um bloco de confirmacao com:
     - Texto de aviso: "This action is permanent. Type DELETE to confirm."
     - Input para digitar "DELETE"
     - Botao destrutivo "Delete Permanently" (habilitado apenas quando o input === "DELETE")
     - Botao "Cancel" para fechar a confirmacao
4. **Resetar estados** de delete quando o sheet fecha ou quando sai do modo edicao

### `src/hooks/usePayments.ts`
- O hook `useDeletePayment` ja existe no arquivo -- nenhuma mudanca necessaria

## Layout do Edit Mode (atualizado)

```text
[ Amount input grande ]
[ Category / Project / Date / Method ]
[ Description / Notes ]
─────────────────────
[ Save Changes ] [ Discard ]
─────────────────────
          Delete this payment    <- texto discreto, vermelho, small
          
(ao clicar)
┌─────────────────────────────────┐
│ This action is permanent.       │
│ Type DELETE to confirm.         │
│ [ _________ ]                   │
│ [Delete Permanently] [Cancel]   │
└─────────────────────────────────┘
```

## Seguranca
- Delete so acessivel dentro do Edit Mode (que so aparece para pending)
- Verificacao dupla: usuario precisa digitar "DELETE" para habilitar o botao
- Visual discreto: nao e um botao chamativo, e um link de texto pequeno no rodape

