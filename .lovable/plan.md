

# Payments -- Period Flexibility + P&L Export + Financial Chart

## O que muda

### 1. Period Selector expandido (substitui MonthSelector)

Trocar o `MonthSelector` atual por um `PeriodSelector` que suporta:
- **Week** (W10, W11...) -- sua filosofia pessoal, navega por semana com label "W10 - Mar 2-8"
- **Month** (padrao atual, mantido)
- **Quarter** (Q1, Q2, Q3, Q4)
- **Year** (2025, 2026)

UI: Uma row com pills [W | M | Q | Y] seguida do navegador com setas (igual ao atual, mas adaptado ao periodo selecionado). Default continua sendo Month.

Arquivo: Criar `src/components/admin/payments/PeriodSelector.tsx`
- Exporta o componente e tambem o `{ start, end }` do periodo ativo para uso na filtragem
- Usa `startOfWeek`/`endOfWeek`, `startOfMonth`/`endOfMonth`, `startOfQuarter`/`endOfQuarter` do date-fns

Arquivo: Atualizar `src/pages/admin/Payments.tsx`
- Substituir `currentMonth` + `MonthSelector` pelo novo `PeriodSelector`
- Adaptar a filtragem de `monthlyPayments` para usar o range generico `{ start, end }` retornado pelo selector
- Toda a logica de KPIs, categorias e agrupamento continua identica -- so muda o range de filtro

### 2. Download P&L

Um botao de download discreto (icone `Download`) ao lado do period selector.

Gera um CSV simples com:
- Period label
- Total Income (confirmed)
- Total Expenses (confirmed) por categoria
- Net Balance
- Lista de transactions do periodo

Implementado como funcao utilitaria inline -- sem dependencias externas, usa `Blob` + `URL.createObjectURL`.

Arquivo: Atualizar `src/pages/admin/Payments.tsx`
- Adicionar icone `Download` do lucide
- Funcao `handleDownloadPL()` que monta o CSV a partir dos dados ja filtrados em memoria

### 3. Financial Overview Chart (compacto)

Um bar chart com Recharts (ja instalado) mostrando Revenue vs Expenses nos ultimos 6 periodos (baseado no tipo de periodo selecionado -- 6 semanas, 6 meses, etc).

Posicionado entre os KPI cards e o MonthlyOverview. Compacto -- altura fixa de ~180px.

Arquivo: Criar `src/components/admin/payments/FinancialOverviewChart.tsx`
- Recebe `payments[]` (todos, nao filtrados) e o `periodType` atual
- Calcula os ultimos 6 periodos automaticamente
- BarChart com duas barras: Revenue (verde) e Expenses (vermelho/cinza)
- Responsivo e discreto

Arquivo: Atualizar `src/pages/admin/Payments.tsx`
- Importar e renderizar o chart entre KPIs e MonthlyOverview

## O que NAO muda
- Toda a logica de categorias, pills, agrupamento por dia
- MonthlyOverview component (Income/Expenses/Net cards)
- Transaction cards e seus detalhes
- PaymentDetailsSheet e todo o fluxo de CRUD
- Aba de Invoices inteira

## Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| `src/components/admin/payments/PeriodSelector.tsx` | Criar (substitui MonthSelector) |
| `src/components/admin/payments/FinancialOverviewChart.tsx` | Criar |
| `src/pages/admin/Payments.tsx` | Atualizar imports, period state, download, chart |

## Ordem de execucao
1. Criar PeriodSelector
2. Criar FinancialOverviewChart
3. Atualizar Payments.tsx (integrar ambos + download)

