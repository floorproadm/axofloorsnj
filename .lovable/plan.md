

# Performance Page Redesign + Itemized Job Costs

## Overview

Redesign the `/admin/performance` page to match the reference design, adding a revenue trend chart, a project performance list, and a drill-down flow into individual job cost details with itemized cost editing.

## What's Missing Today

The current `job_costs` table only stores 3 aggregate values (labor_cost, material_cost, additional_costs). The reference images show **itemized line items** within categories (e.g., "White Oak Hardwood $2800", "Underlayment $600" under Materials). This requires a new database table.

---

## Phase 1: Database -- New `job_cost_items` Table

Create a table to store individual cost line items per job:

```text
job_cost_items
--------------
id              uuid (PK)
job_cost_id     uuid (FK -> job_costs.id)
category        text ('materials' | 'labor' | 'overhead' | 'other')
description     text (e.g. "White Oak Hardwood")
amount          numeric (e.g. 2800)
created_at      timestamptz
```

- RLS policies matching existing `job_costs` patterns
- A trigger to auto-sum items back into `job_costs` aggregate columns (labor_cost, material_cost, additional_costs) to maintain backward compatibility with existing margin calculations

## Phase 2: Performance Page Redesign

Restructure `src/pages/admin/Performance.tsx` with 3 sections:

**Section 1 -- Stats Cards (2x2 grid)**
- Weekly Revenue (with % trend)
- Total Jobs (with +/- trend)
- New Leads (with +/- trend)
- Avg. Job Value (with % trend)

Uses the existing `StatsCard` component with trend badges. Period selector ("Last 30 Days") in the header.

**Section 2 -- Revenue Trend Chart**
- Line chart using Recharts (already installed)
- Monthly revenue data aggregated from completed projects
- Uses the existing `ChartContainer` / `ChartTooltip` components

**Section 3 -- Project Performance List**
- List of recent projects showing: name, client, status badge, revenue, and margin %
- Each row is clickable, opening a **Job Cost Details** dialog

## Phase 3: Job Cost Details Dialog

A modal/sheet that shows when clicking a project in the performance list:

**Header**: Project name, client, status badge

**Financial Summary Card**:
- Revenue (right-aligned)
- Total Costs (red, negative)
- Profit + margin % (green/red based on health)

**Cost Breakdown Card**:
- Line items per category with totals
- Stacked horizontal bar showing category proportions (Materials %, Labor %, Overhead %, Other %)
- Legend with percentages

**Footer**: "Edit Cost Details" button

## Phase 4: Itemized Cost Editor

A view/dialog for editing individual cost items per category:

- 4 sections: Materials, Labor, Overhead, Other Costs
- Each section has "+ Add Item" button
- Each item row: description input + amount input + remove button
- Category subtotals auto-calculated
- Grand total at the bottom
- "Save Changes" persists to `job_cost_items` table and triggers aggregate recalculation

---

## Technical Details

### Files to Create
- `supabase/migrations/xxx_job_cost_items.sql` -- new table + trigger
- `src/hooks/useJobCostItems.ts` -- CRUD hook for line items
- `src/components/admin/performance/PerformanceStatsCards.tsx` -- top cards with trends
- `src/components/admin/performance/RevenueTrendChart.tsx` -- line chart
- `src/components/admin/performance/ProjectPerformanceList.tsx` -- project list
- `src/components/admin/performance/JobCostDetailsSheet.tsx` -- detail modal
- `src/components/admin/performance/ItemizedCostEditor.tsx` -- line item editor

### Files to Modify
- `src/pages/admin/Performance.tsx` -- complete restructure
- `src/hooks/admin/useDashboardData.ts` -- may need monthly revenue breakdown query

### Data Flow
- Stats cards and chart: sourced from existing `useDashboardData` + a new query for monthly aggregation
- Project list: query `projects` joined with `job_costs`
- Cost details: query `job_cost_items` grouped by category
- Saving items: upsert to `job_cost_items`, trigger recalculates `job_costs` aggregates

