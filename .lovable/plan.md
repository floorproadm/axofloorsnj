

# Rewrite ProjectsHub: Kings OS Simplicity for AXO OS

## The Problem
The current AXO OS ProjectsHub is a bloated 460-line "cockpit" with 9 collapsible sections, flow guides, and scattered widgets. The Kings OS equivalent is ~130 lines — focused, objective, and actually usable.

## What Kings OS Does Right
- **4 KPI cards** at the top (Active, Pipeline $, Completed, Revenue)
- **Controls bar**: New Project button + Board/List toggle + Search + Status filter
- **Board view**: Drag-and-drop Kanban with clean cards (title, client, value, date)
- **List view**: Table-style rows with status badges
- **Detail panel**: Side sheet with status selector, KPI bar (Value/Costs/Profit/Margin/Balance), and 3 tabs (Measurements, Costs, Invoices)

No collapsible sections. No flow guides. No tasks widget. No materials/workforce/weekly review blocks. Just projects.

## Plan

### 1. Rewrite `src/pages/admin/ProjectsHub.tsx` (~130 lines)
Replace the entire 460-line file with the Kings OS pattern adapted for AXO data:
- **KPI strip**: Active Jobs, Pipeline Revenue, Completed, Total Revenue (using existing `useProjectsHub` data)
- **Controls bar**: "New Job" button, Board/List toggle, search input, status filter dropdown
- **Board view**: New component `ProjectPipelineBoard` with drag-and-drop columns (Planning, In Progress, Completed, Awaiting Payment, Paid)
- **List view**: New component `ProjectListView` with responsive table/card layout
- **Detail panel**: Side sheet with project header, status selector, KPI bar, and 3 tabs

### 2. Create 4 new component files under `src/components/admin/projects/`
- `ProjectPipelineBoard.tsx` — Kanban board with drag-drop (adapted from Kings OS, using AXO data fields: address as primary, customer_name, project_type, job_costs)
- `ProjectListView.tsx` — Responsive list with desktop table + mobile cards
- `ProjectDetailPanel.tsx` — Sheet with sticky header, KPI bar, and tabs for operational data
- `ProjectKPIBar.tsx` — Compact 5-cell KPI bar (Value, Costs, Profit, Margin%, Balance)

### 3. Adapt data layer
Keep existing `useProjectsHub.ts` for the list page queries. Add status update mutation (already exists in AXO's project update flows). The detail panel will use existing hooks (`useJobCosts`, `useMeasurements`, etc.) scoped to the selected project.

### 4. What gets removed
- All 9 collapsible sections (Quick Actions, Proposals, Tasks, Measurements, Materials, Workforce, Weekly Review, Flow Guide)
- The bloated `Section`, `Row`, `ViewAllLink`, `Empty`, `StatusDot` internal components
- ~330 lines of code

### Files
| Action | File |
|---|---|
| Rewrite | `src/pages/admin/ProjectsHub.tsx` |
| Create | `src/components/admin/projects/ProjectPipelineBoard.tsx` |
| Create | `src/components/admin/projects/ProjectListView.tsx` |
| Create | `src/components/admin/projects/ProjectDetailPanel.tsx` |
| Create | `src/components/admin/projects/ProjectKPIBar.tsx` |

No database changes needed. No routing changes needed. Same `/admin/projects` URL.

