

# Payments Tab -- Evolucao inspirada no app de financas

## Objetivo
Evoluir a aba Payments para ter uma experiencia mais visual e intuitiva, inspirada nos conceitos do app de financas pessoais (resumo mensal, barras de progresso, separacao clara entradas/saidas, categorias com icones) e do PayControl (KPIs, grid temporal).

## O que muda

### 1. Navegacao por Periodo (Mes)
Adicionar um seletor de mes no topo da aba Payments, igual ao app (< March 2026 >). Filtra todos os dados exibidos para aquele mes.

### 2. Resumo Financeiro do Mes (novo bloco no topo)
Substituir os 4 stat cards atuais por um layout mais rico:

```text
+------------------------------------------+
|  Income (Entradas)                    [i] |
|  Expected    $12,500.00                   |
|  Received    $8,200.00                    |
|  [========-------] 65.6%                  |
+------------------------------------------+
|  EXPENSES                                 |
|  Categorias                               |
|  [Hammer] Labor         $3,200 / $5,000   |
|  [Box]    Material      $1,800 / $3,000   |
|  [...]    Other         $200   / $500     |
+------------------------------------------+
|  NET BALANCE            +$2,000           |
+------------------------------------------+
```

- **Income card**: Expected (soma de payments "received" com status pending + confirmed) vs Received (apenas confirmed). Barra de progresso.
- **Expense categories**: Cards por categoria (Labor, Material, Other) com valores gastos. Cada um clicavel para filtrar a lista.
- **Net Balance**: Valor liquido do mes (received - expenses).

### 3. Acao "+" Contextual (tipo o app)
Ao clicar no botao "+", em vez de abrir direto o form, abrir um bottom sheet / dialog com duas opcoes:
- **Record Income** -- Abre form simplificado para registrar recebimento de cliente
- **Record Expense** -- Abre form simplificado para registrar pagamento (labor/material/other)

Isso torna a experiencia mais clara que o form unico atual.

### 4. Formularios Simplificados
Inspirado no app -- valor grande no topo, poucos campos essenciais:

**Record Income:**
- Amount (input grande, destaque)
- Project (select)
- Date
- Payment Method
- Description (opcional)

**Record Expense:**
- Amount (input grande, destaque)
- Category (Labor / Material / Other)
- Project (select, opcional)
- Date
- Description (opcional)

### 5. Lista de Transacoes do Mes
Manter a lista atual mas melhorar o visual:
- Agrupar por dia (como o WeekGrid do PayControl)
- Entradas em verde (+), saidas em texto normal (-)
- Mostrar icone da categoria

## Detalhes Tecnicos

### Arquivos a Editar
1. **`src/pages/admin/Payments.tsx`** -- Refatorar a secao de Payments tab com:
   - State para `currentMonth` com navegacao < >
   - Filtro de payments pelo mes selecionado
   - Novo layout de resumo (Income card + Expense categories + Net Balance)
   - Action sheet para escolher tipo de registro

2. **`src/components/admin/payments/NewPaymentDialog.tsx`** -- Refatorar para:
   - Aceitar prop `defaultCategory` ("received" ou expense)
   - Layout com valor grande no topo
   - Campos condicionais (Project obrigatorio para income, Category para expense)

3. **Novo: `src/components/admin/payments/PaymentActionSheet.tsx`** -- Bottom sheet com as opcoes "Record Income" / "Record Expense"

4. **Novo: `src/components/admin/payments/MonthlyOverview.tsx`** -- Componente do resumo mensal com:
   - Income card (Expected vs Received + progress bar)
   - Expense categories (Labor, Material, Other com barras)
   - Net Balance

5. **Novo: `src/components/admin/payments/MonthSelector.tsx`** -- Navegacao < Month Year >

### Nenhuma mudanca no banco de dados
- A tabela `payments` ja tem tudo que precisamos (category, amount, payment_date, status)
- Apenas filtramos por mes usando `payment_date`

### Fluxo de Dados
```text
currentMonth state
  -> filter payments by month range
  -> calculate: incomeExpected, incomeReceived, expensesByCategory
  -> render MonthlyOverview + filtered list
```

## O que NAO faremos (para manter escopo)
- Orcamento por categoria (feature futura -- definir budget por Labor/Material)
- Dividas/Metas (features do app pessoal que nao se aplicam ao OS)
- Grid semanal tipo PayControl (podemos adicionar depois)
- Categorias customizaveis (manter as 4 fixas: received, labor, material, other)
