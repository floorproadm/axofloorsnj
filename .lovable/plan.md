
# Payments & Invoices -- Redesign Completo

## Visao Geral

Transformar a pagina `/admin/payments` de volta para **"Payments & Invoices"** com dual-tab real, onde cada aba tem uma funcao de negocio distinta:

- **Payments**: Controle de fluxo de caixa -- dinheiro recebido de clientes e pagamentos feitos (labor, materiais). Inspirado no PayControl (KPIs de pending/paid, entradas por dia/semana).
- **Invoices**: Faturas formais enviadas ao cliente -- depositos (30-50% upfront) + saldo final. Inspirado no QuickQuote (lista de invoices com status tracking, search, filtros).

**Estimates saem desta pagina** e serao movidos para `/admin/intake` como ferramenta do pipeline de vendas (tarefa separada futura).

## Estrutura Visual

```text
+----------------------------------------------+
|  Payments & Invoices                         |
+----------------------------------------------+
|  [ Payments ]  [ Invoices ]         [+ Novo] |
+----------------------------------------------+
|  Stats Cards (contextuais por aba)           |
+----------------------------------------------+
|  Sub-filtros por status/tipo                 |
+----------------------------------------------+
|  Lista de registros                          |
+----------------------------------------------+
```

## Tab 1: Payments

Inspirado no PayControl -- rastrear dinheiro entrando e saindo.

### Stats Cards
- **Total Received**: Soma de pagamentos recebidos de clientes
- **Total Paid Out**: Soma de pagamentos feitos (labor + material)
- **Pending**: Pagamentos aguardando confirmacao
- **Net Balance**: Received - Paid Out

### Categorias de Payment
- **Received from Client**: Pagamentos recebidos (depositos, parcelas, saldo final)
- **Labor**: Pagamentos para a crew (integravel com /collaborator no futuro)
- **Material**: Pagamentos de fornecedores/materiais
- **Other**: Despesas diversas

### Sub-filtros
- All, Received, Labor, Material, Other
- Status: All, Pending, Confirmed, Cancelled

### Lista
Cards com: descricao, projeto vinculado, valor, categoria (badge colorido), data, status

### Dialogo "New Payment"
- Tipo (Received / Labor / Material / Other)
- Projeto vinculado (select)
- Valor
- Data
- Metodo de pagamento (Cash, Check, Zelle, Venmo, Card)
- Descricao/Notas
- Status (Pending / Confirmed)

## Tab 2: Invoices (mantém o que já existe)

Inspirado no QuickQuote -- faturas formais para clientes.

- Mantém toda a funcionalidade atual de invoices (lista, stats, filtros, NewInvoiceDialog, InvoiceDetailsSheet)
- Stats: Total Billed, Received, Pending, Overdue
- Filtros: All, Draft, Sent, Paid, Overdue
- Sem mudancas funcionais

## Detalhes Tecnicos

### 1. Nova tabela `payments` (migration SQL)

```sql
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id),
  category text NOT NULL DEFAULT 'received',
  -- received | labor | material | other
  amount numeric NOT NULL DEFAULT 0,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  -- cash | check | zelle | venmo | card | bank_transfer
  status text NOT NULL DEFAULT 'pending',
  -- pending | confirmed | cancelled
  description text,
  notes text,
  collaborator_id uuid,
  -- para pagamentos de labor (futuro link com collaborator)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_admin_all ON public.payments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY payments_authenticated_read ON public.payments
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
```

### 2. Novo hook `usePayments` (src/hooks/usePayments.ts)
- `usePayments()`: Lista todos os payments com join em projects
- `useCreatePayment()`: Insere novo payment
- `useUpdatePaymentStatus()`: Atualiza status
- `useDeletePayment()`: Remove payment

### 3. Novo componente `NewPaymentDialog` (src/components/admin/payments/NewPaymentDialog.tsx)
- Formulario para criar novo payment
- Select de categoria, projeto, metodo, valor, data, descricao

### 4. Novo componente `PaymentDetailsSheet` (src/components/admin/payments/PaymentDetailsSheet.tsx)
- Sheet lateral com detalhes do payment
- Acoes: confirmar, cancelar, deletar

### 5. Pagina refatorada `Payments.tsx`
- Titulo volta para "Payments & Invoices"
- Tab principal: Payments | Invoices
- Remove toda referencia a Estimates (sera movido para Intake futuramente)
- Tab Payments: stats + filtros + lista + NewPaymentDialog + PaymentDetailsSheet
- Tab Invoices: mantém exatamente como esta hoje

### 6. Remover `useEstimatesList.ts` e `EstimateDetailsSheet.tsx`
- Esses arquivos foram criados na edit anterior para a aba Estimates
- Serao removidos desta pagina (a funcionalidade de estimates sera reintegrada em `/admin/intake` em uma tarefa futura)

## Arquivos Envolvidos

1. **Migration SQL**: Nova tabela `payments` com RLS
2. **Novo**: `src/hooks/usePayments.ts`
3. **Novo**: `src/components/admin/payments/NewPaymentDialog.tsx`
4. **Novo**: `src/components/admin/payments/PaymentDetailsSheet.tsx`
5. **Editado**: `src/pages/admin/Payments.tsx` (refatoracao completa)
6. **Removido da pagina**: Referencias a EstimateDetailsSheet e useEstimatesList (arquivos mantidos para uso futuro em Intake)

## Preparacao para Futuro

- Campo `collaborator_id` na tabela payments prepara integracao com portal do colaborador (PayControl integrado)
- A categoria `labor` permite no futuro que colaboradores vejam seus pagamentos no `/collaborator`
- Estrutura de API pronta para quando o PayControl for absorvido pelo FloorPRO
