

# Real-Time "Viewed" Indicator nos Invoices

## Situação Atual
- `viewed_at` já é salvo quando o cliente abre o link público
- O indicador "Client Viewed" só aparece **dentro** do InvoiceDetailsSheet (ao abrir o detalhe)
- A lista de invoices não mostra se foi visualizado ou não
- Não há atualização em tempo real — o admin precisa dar refresh para ver

## O que vamos implementar

### 1. Indicador visual na lista de invoices (Payments.tsx)
- Adicionar um pequeno ícone de **olho** (Eye) ao lado do invoice card quando `viewed_at` existe
- Badge sutil "Viewed" com timestamp relativo ("2h ago") para feedback imediato

### 2. Realtime subscription para `invoices.viewed_at`
- Ativar Supabase Realtime na tabela `invoices`
- No hook `useInvoices`, adicionar channel subscription que escuta `UPDATE` events
- Quando `viewed_at` muda de null para um valor, invalidar a query automaticamente
- Resultado: o admin vê o ícone de olho aparecer **instantaneamente** quando o cliente abre o link

### 3. Melhorar UX do indicador no InvoiceDetailsSheet
- Adicionar uma animação sutil (pulse verde) quando o `viewed_at` é recente (< 5 min)
- Toast notification opcional: "📩 Client viewed INV-2026-001"

## Detalhes Técnicos

### Migration
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
```

### Arquivos afetados
1. **`src/hooks/useInvoices.ts`** — adicionar realtime subscription no `useInvoices` hook
2. **`src/pages/admin/Payments.tsx`** — mostrar Eye icon + "Viewed" badge na lista de invoices
3. **`src/components/admin/payments/InvoiceDetailsSheet.tsx`** — pulse animation no viewed indicator
4. **Migration SQL** — habilitar realtime para invoices

