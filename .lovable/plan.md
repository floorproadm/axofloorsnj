

## Payments & Invoices -- Nova Pagina Admin

### Objetivo
Criar uma pagina dedicada `/admin/payments` para gerenciar faturas (invoices) e pagamentos de projetos, centralizada no admin do FloorPro OS.

### Nova Tabela: `invoices`

| Coluna | Tipo | Default | Notas |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| project_id | uuid | NOT NULL | FK -> projects |
| customer_id | uuid | NULL | FK -> customers |
| invoice_number | text | NOT NULL | Auto-gerado (INV-YYYY-001) |
| status | text | 'draft' | draft, sent, paid, overdue, cancelled |
| amount | numeric | 0 | Valor total da fatura |
| tax_amount | numeric | 0 | Impostos |
| discount_amount | numeric | 0 | Desconto |
| total_amount | numeric | GENERATED (amount + tax - discount) | Valor final |
| due_date | date | NOT NULL | Data de vencimento |
| paid_at | timestamptz | NULL | Data do pagamento |
| payment_method | text | NULL | cash, check, zelle, credit_card, bank_transfer |
| notes | text | NULL | Observacoes internas |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | now() | |

**RLS**: admin_all + authenticated_read (mesmo padrao das demais tabelas).

### Nova Tabela: `invoice_items`

| Coluna | Tipo | Default | Notas |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| invoice_id | uuid | NOT NULL | FK -> invoices |
| description | text | NOT NULL | Descricao do item |
| quantity | numeric | 1 | |
| unit_price | numeric | 0 | |
| amount | numeric | GENERATED (quantity * unit_price) | |
| created_at | timestamptz | now() | |

**RLS**: admin_all + authenticated_read.

### Arquivos a Criar

1. **`src/pages/admin/Payments.tsx`** -- Pagina principal com:
   - Stats cards no topo: Total Faturado, Recebido, Pendente, Vencido
   - Tabela de faturas com filtros por status (All, Draft, Sent, Paid, Overdue)
   - Botao "Nova Fatura" que abre dialog
   - Click em row abre sheet com detalhes

2. **`src/hooks/useInvoices.ts`** -- Hook com:
   - `useInvoices()` -- lista todas as faturas com join em projects/customers
   - `useInvoice(id)` -- fatura individual
   - `createInvoice` mutation
   - `updateInvoice` mutation
   - `updateInvoiceStatus` mutation
   - `deleteInvoice` mutation

3. **`src/components/admin/payments/InvoiceDetailsSheet.tsx`** -- Sheet lateral com:
   - Resumo da fatura (numero, cliente, projeto, valor)
   - Lista de itens da fatura
   - Botoes de acao: Marcar como Pago, Enviar, Cancelar
   - Historico de status

4. **`src/components/admin/payments/NewInvoiceDialog.tsx`** -- Dialog para criar fatura:
   - Select de projeto (puxa customer automaticamente)
   - Itens da fatura com adicionar/remover linhas
   - Data de vencimento
   - Campo de notas

### Arquivos a Modificar

5. **`src/App.tsx`** -- Adicionar rota `/admin/payments` protegida
6. **`src/components/admin/AdminSidebar.tsx`** -- Adicionar item "Payments" no grupo principal (topItems), com icone `DollarSign`
7. **`src/contexts/LanguageContext.tsx`** -- Adicionar traducoes para labels da pagina

### Fluxo Principal

```text
Criar Fatura -> Selecionar Projeto -> Adicionar Itens -> Salvar (Draft)
   -> Enviar (Sent) -> Cliente Paga -> Marcar como Pago (Paid)
   -> Se venceu -> Status muda para Overdue
```

### Integracao com Modulos Existentes

- Puxa dados de `projects` e `customers` para auto-preencher
- Pode usar itens do `service_catalog` como sugestao ao adicionar linhas
- Stats cards seguem o mesmo padrao visual do Performance (`StatsCardsGrid`)
- Tabela usa `DataTable` existente com filtros e paginacao

### Detalhes Tecnicos

- Migracao SQL cria as 2 tabelas + RLS policies + trigger para updated_at
- `total_amount` como GENERATED ALWAYS para consistencia (mesmo padrao de job_costs)
- Invoice number gerado no frontend com formato `INV-YYYY-NNN`
- Nenhuma dependencia nova necessaria

