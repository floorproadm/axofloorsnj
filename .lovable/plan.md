

# Payments Tab -- KPI Cards + Category Filter

## What's Missing

1. **KPI Cards at the top**: The Invoices tab has 4 stat cards (Total Billed, Received, Pending, Overdue) but the Payments tab jumps straight to the MonthlyOverview component without a quick-glance summary. We need similar compact KPI cards.

2. **Category filter**: There's no visible way to filter by category (All, Received, Labor, Material, Other). The only filter is clicking inside the MonthlyOverview expense rows, but that only covers expenses -- no way to filter "received" or see "all".

## Solution

### 1. Add KPI Cards Row (above MonthlyOverview)

A compact row of 4 mini KPI cards, filtered by the selected month:

```text
[ Total In    ]  [ Total Out   ]  [ Pending     ]  [ Net Balance  ]
[ $12,500     ]  [ $5,200      ]  [ $3,800      ]  [ +$7,300      ]
[ green       ]  [ foreground  ]  [ amber       ]  [ green/red    ]
```

- **Total In**: Sum of all "received" payments (confirmed) for the month
- **Total Out**: Sum of all expense payments (labor + material + other, confirmed) for the month
- **Pending**: Sum of all payments with status "pending" regardless of category
- **Net Balance**: Total In - Total Out

These use the same grid layout as the Invoices tab (grid-cols-2 md:grid-cols-4).

### 2. Add Category Filter Pills (between MonthlyOverview and transaction list)

A horizontal scrollable row of filter pills/tabs:

```text
[ All (12) ] [ Received (5) ] [ Labor (4) ] [ Material (2) ] [ Other (1) ]
```

- Clicking a pill filters the transaction list below
- This replaces the current "Filtering: labor x" badge with a proper UI
- The MonthlyOverview expense category click still works in parallel (synced with the same `categoryFilter` state)
- "All" includes the "received" category too (which the current MonthlyOverview click doesn't support)

## Files to Edit

### 1. `src/pages/admin/Payments.tsx`
- Add KPI cards row (4 cards in a grid) between MonthSelector and MonthlyOverview
- Add category filter pills (using TabsList or simple button row) between MonthlyOverview and the transaction list
- Compute KPI values from `monthlyPayments`
- Update `categoryFilter` to support "all" and "received" in addition to expense categories

### 2. `src/components/admin/payments/MonthlyOverview.tsx`
- Add "received" as a clickable income row (so clicking Income card filters to received)
- Keep the existing structure intact -- no layout changes, just make the Income card clickable for filtering too

## Technical Details

### KPI Calculation (in Payments.tsx)
```typescript
const kpis = useMemo(() => {
  const totalIn = monthlyPayments
    .filter(p => p.category === "received" && p.status === "confirmed")
    .reduce((s, p) => s + Number(p.amount), 0);
  const totalOut = monthlyPayments
    .filter(p => p.category !== "received" && p.status === "confirmed")
    .reduce((s, p) => s + Number(p.amount), 0);
  const pending = monthlyPayments
    .filter(p => p.status === "pending")
    .reduce((s, p) => s + Number(p.amount), 0);
  return { totalIn, totalOut, pending, net: totalIn - totalOut };
}, [monthlyPayments]);
```

### Category Filter Pills
Use simple buttons styled as pills/badges rather than a full TabsList to keep it lightweight and horizontally scrollable on mobile:

```text
Categories: All | Received | Labor | Material | Other
Each showing count of transactions in parentheses
Active pill gets accent background
```

### No database changes needed
All data is already in the `payments` table with the `category` field.

