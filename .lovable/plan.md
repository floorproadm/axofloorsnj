

# Análise: AXO-INVOICE.html vs. Sistema Atual de Invoices

## O que o Claude Code criou

Um gerador de invoices standalone com:
- **Editor visual em tempo real** — painel toggle com preview ao vivo do documento
- **Payment Schedule 3 fases** (30/40/30) com labels e timing editáveis
- **Tax, Discount, Deposit** — campos de ajuste com cálculo automático de Balance Due
- **Coluna "Detail/Notes"** por line item (ex: "White Oak 5-inch, Herringbone")
- **Accepted Payment Methods** — pills visuais (Check, ACH/Wire, Cash, Zelle)
- **Print/PDF** com CSS @media print dedicado, header dark AXO branded
- **Footer** com licença e contato customizáveis

## O que já temos (e é superior)

- **NewInvoiceDialog** — cria invoices vinculadas a projetos reais do banco
- **InvoiceDetailsSheet** — view/edit/share/print completo com status workflow (Draft→Sent→Paid→Cancelled)
- **EditItemsPanel** — edição inline de line items
- **PublicLinkModal** — share via WhatsApp/Email com link público
- **Print function** — gera HTML e abre window.print()
- **Integração total** com customers, projects, payments

## O que falta no nosso (boas ideias do HTML)

1. **Payment Schedule** — divisão em fases (30/40/30) não existe no nosso invoice
2. **Tax & Discount editáveis** — temos campos `tax_amount` e `discount_amount` na tabela mas não temos UI para editá-los na criação
3. **Deposit tracking** — campo "Deposit Already Paid" que subtrai do balance
4. **Detail/Notes por line item** — nosso só tem description, qty, price
5. **Accepted Payment Methods** — seção visual no documento impresso
6. **Print layout profissional** — nosso print é funcional mas básico; o do Claude tem header dark branded, bill-to strip 3 colunas, totals box estilizado, footer branded

## Plano de Implementação

### 1. Upgrade NewInvoiceDialog — Adicionar Tax, Discount, Notes por item
- Adicionar campos de Tax % (toggle), Discount $, e Deposit já pago
- Adicionar campo "detail" opcional por line item
- Calcular e salvar `tax_amount`, `discount_amount` corretamente
- Adicionar seção Payment Schedule com 3 fases editáveis (labels, %, timing)

### 2. Upgrade InvoiceDetailsSheet — Exibir novos campos
- Mostrar tax, discount, deposit na seção de totals
- Exibir payment schedule cards (se existir)
- Mostrar detail/notes por item
- Exibir accepted payment methods

### 3. Upgrade printInvoice — Layout profissional AXO branded
- Header dark com logo AXO Floors e badge de status
- Bill-to strip 3 colunas (client, project address, dates)
- Tabela de items com coluna Detail
- Totals box com subtotal/discount/tax/deposit/balance due
- Payment schedule cards com fases e valores
- Accepted payments pills
- Footer branded com contato AXO Floors NJ

### 4. Migration — Adicionar campos ao banco
- Adicionar `deposit_amount` à tabela invoices
- Adicionar `detail` à tabela invoice_items  
- Criar tabela `invoice_payment_schedule` (invoice_id, phase_label, percentage, timing, phase_order)

### Arquivos afetados
1. `src/components/admin/payments/NewInvoiceDialog.tsx` — campos novos
2. `src/components/admin/payments/InvoiceDetailsSheet.tsx` — exibição + print upgrade
3. `src/hooks/useInvoices.ts` — types e mutations atualizados
4. Migration SQL — novos campos/tabela

