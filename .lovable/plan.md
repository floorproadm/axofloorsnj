

# Add Uploaded Files to Project

## Overview
Copy 5 uploaded files into the project, replacing existing ones where they already exist.

## Files to Add/Replace

| File | Destination | Action |
|------|------------|--------|
| `AdminSidebar.tsx` | `src/components/admin/AdminSidebar.tsx` | Replace (adds 3 new nav items: Weekly Review, Labor Payroll, Crews & Fleet) |
| `App.tsx` | `src/App.tsx` | Replace (adds 3 new routes + imports for WeeklyReview, LaborPayroll, CrewsVans) |
| `WeeklyReview.tsx` | `src/pages/admin/WeeklyReview.tsx` | Create new page |
| `LaborPayroll.tsx` | `src/pages/admin/LaborPayroll.tsx` | Create new page |
| `CrewsVans.tsx` | `src/pages/admin/CrewsVans.tsx` | Create new page |

## What These Files Add
- **AdminSidebar**: 3 new navigation entries under "Manage" group (Weekly Review, Labor Payroll, Crews & Fleet)
- **App.tsx**: 3 new protected admin routes (`/admin/weekly-review`, `/admin/labor-payroll`, `/admin/crews`)
- **WeeklyReview**: Dashboard with KPI cards, revenue/profit charts, cash flow, and jobs/leads breakdown by week
- **LaborPayroll**: Worker payment tracker with monthly view, daily rate calculations, and project linking
- **CrewsVans**: Crew member management (via profiles table) and fleet tracking (via payments table with "fleet" category)

## Notes
- All 3 new pages use existing tables (`projects`, `payments`, `profiles`, `leads`, `job_costs`) -- no database changes needed
- All use existing UI components and patterns consistent with the admin panel

