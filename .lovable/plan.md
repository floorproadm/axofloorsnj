

# Remove /admin/weekly-review from Sidebar

Since the Weekly Review is now a tab inside `/admin/performance`, the standalone `/admin/weekly-review` route in the sidebar is redundant.

## Changes

1. **`src/components/admin/AdminSidebar.tsx`** -- Remove the `{ title: "Weekly Review", url: "/admin/weekly-review", icon: ClipboardList }` entry from the `manageItems` array. Remove the `ClipboardList` import if unused elsewhere.

2. **`src/App.tsx`** -- Remove the `/admin/weekly-review` route and its `WeeklyReview` import (the standalone page file can stay for now in case it's needed later, but won't be routed).

No other files affected.

