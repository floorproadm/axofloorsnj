

# Show Only Completed Projects in Overview

The "Projects" tab was removed, but the Overview's "Recent Jobs" section currently shows all projects regardless of status. Since this is a **Performance** page, it makes more sense to focus on completed projects -- those are the ones with final cost/margin data.

## Changes

**`src/pages/admin/Performance.tsx`**

1. Filter `projects` to only `completed` in the Overview's "Recent Jobs" list (line 228):
   - Change `projects.slice(0, 10)` to `projects.filter(p => p.project_status === 'completed').slice(0, 10)`
   - Update the header from "Recent Jobs" to "Completed Jobs"

2. Optionally, also filter the KPI calculations (lines 75-82) to only count completed projects, so Revenue/Profit/Margin reflect actual delivered work rather than estimates from in-progress jobs.

3. Clean up the dead `ProjectsTab` component (lines 271-405) since it's no longer used anywhere.

## Result
The Overview tab will show only completed projects with their final financials, making it a true performance retrospective rather than a mix of in-progress estimates and completed actuals.

