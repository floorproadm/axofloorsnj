

# Payments Details -- Edit Mode + Remove Delete Button

## Ideia
Substituir o botao de Delete pelo botao de **Edit** no PaymentDetailsSheet. Quando o payment esta "pending", o fluxo fica: **Edit | Confirm | Cancel**. Isso e mais seguro (sem delete acidental) e mais util (corrigir valores antes de confirmar).

## O que muda

### 1. Remover o botao Delete e toda logica de confirmacao
- Remover o estado `showDeleteConfirm`, `deleteConfirmText`
- Remover import de `useDeletePayment`, `Trash2`, `Input`
- Remover todo o bloco de UI de delete confirmation

### 2. Adicionar botao "Edit" para payments pending
Na secao de Actions (quando `status === "pending"`), o layout ficara:

```text
[ Edit Payment     ] (outline)
[ Confirm Payment  ] (primary)  
[ Cancel Payment   ] (outline, destructive text)
```

### 3. Modo de edicao inline no Sheet
Ao clicar "Edit", o Sheet alterna para modo edicao:
- Os campos (amount, category, project, date, method, description, notes) viram inputs editaveis
- Reutiliza o mesmo layout do formulario do `NewPaymentDialog` (amount grande no topo, selects, etc.)
- Dois botoes no rodape: **Save Changes** | **Discard**

### 4. Hook `useUpdatePayment` (novo)
Adicionar em `usePayments.ts` uma mutation para update completo (nao so status):

```typescript
export function useUpdatePayment() {
  // mutationFn: supabase.from("payments").update({...}).eq("id", id)
  // invalidates ["payments"] on success
}
```

## Arquivos

### `src/hooks/usePayments.ts`
- Adicionar `useUpdatePayment` mutation (update de todos os campos editaveis)

### `src/components/admin/payments/PaymentDetailsSheet.tsx`
- Remover: delete button, delete confirmation, `useDeletePayment`, estados de delete
- Adicionar: estado `isEditing` com formulario inline
- Quando `isEditing = true`: renderizar inputs editaveis pre-preenchidos com os valores atuais
- Quando `isEditing = false`: renderizar view-only (como esta hoje)
- Botao "Edit Payment" visivel apenas para payments com status `pending`
- Botoes "Save Changes" e "Discard" no modo edicao

### Nenhuma mudanca no banco de dados
- A mutation de update ja funciona com as colunas existentes da tabela `payments`

