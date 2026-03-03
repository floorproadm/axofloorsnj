

# Payments & Invoices → Financial Hub (Invoices + Estimates)

## Objetivo
Transformar a pagina `/admin/payments` em um hub financeiro com duas abas -- **Invoices** e **Estimates** -- seguindo o mesmo padrao visual e de UX implementado no Catalogo (Services | Materials).

## Estrutura Final

```text
+------------------------------------------+
|  Financial Hub                           |
|  Gerenciar faturas e orcamentos          |
+------------------------------------------+
|  [ Invoices ]  [ Estimates ]     [+ Novo]|
+------------------------------------------+
|  Stats Cards (contextuais por aba)       |
+------------------------------------------+
|  Sub-filtros por status                  |
+------------------------------------------+
|  Lista de cards clicaveis               |
+------------------------------------------+
```

## Mudancas por Aba

### Tab "Invoices" (conteudo atual)
- Mantem tudo como esta: stats (Faturado, Recebido, Pendente, Vencido), filtros por status, lista de cards, NewInvoiceDialog, InvoiceDetailsSheet.
- Nenhuma alteracao funcional.

### Tab "Estimates" (novo)
- **Stats**: Total Estimates, Accepted, Pending, Expired
- **Filtros por status**: All, Draft, Sent, Accepted, Rejected, Expired
- **Lista**: Cards com proposal_number, cliente (via project join), tier selecionado, valor (good/better/best), status badge, data de validade
- **Click**: Abre um EstimateDetailsSheet com detalhes da proposta (3 tiers, margem, status, acoes)
- **Botao "+"**: O botao "+ Novo" muda contextualmente -- "Nova Fatura" na aba Invoices, "Novo Estimate" na aba Estimates. Na aba Estimates, o botao redireciona para a pagina de criacao de proposta existente (que esta vinculada ao fluxo de projeto).

## Detalhes Tecnicos

### 1. Hook `useEstimatesList` (novo)
**Arquivo**: `src/hooks/useEstimatesList.ts`
- Query que busca todas as proposals com join em `projects(customer_name, project_type, address)` e `customers(full_name)`
- Ordenado por `created_at DESC`
- Retorna lista tipada

### 2. Componente `EstimateDetailsSheet` (novo)
**Arquivo**: `src/components/admin/payments/EstimateDetailsSheet.tsx`
- Sheet lateral similar ao InvoiceDetailsSheet
- Exibe: proposal_number, cliente, projeto, 3 tiers (Good/Better/Best) com precos e margens, tier selecionado (se aceito), valid_until, status
- Acoes: link para o projeto, status badge

### 3. Pagina `Payments.tsx` (refatorada)
**Arquivo**: `src/pages/admin/Payments.tsx`
- Adiciona tab principal `activeTab` ("invoices" | "estimates") no topo, estilo identico ao Catalogo
- Stats cards mudam conforme a aba ativa
- Sub-filtros de status mudam conforme a aba
- Lista renderiza invoices ou estimates conforme aba
- Botao "+" muda label e acao conforme aba
- Titulo da pagina muda para "Financial Hub" ou similar

### 4. Nenhuma mudanca no banco de dados
- Tabelas `invoices`, `invoice_items` e `proposals` ja existem com RLS configurado
- Apenas leitura dos dados existentes na nova aba

## Arquivos Envolvidos
1. **Novo**: `src/hooks/useEstimatesList.ts` -- hook para listar proposals
2. **Novo**: `src/components/admin/payments/EstimateDetailsSheet.tsx` -- sheet de detalhes
3. **Editado**: `src/pages/admin/Payments.tsx` -- refatoracao com dual-tab
