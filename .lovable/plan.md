

# Unify Crews & Fleet UI to match Catalog pattern

The Crews page has a custom header block (icon + title + subtitle) and pill-style tabs (`bg-muted/50`, `data-[state=active]:bg-card`), while Catalog uses **no custom header** (relies on `AdminLayout title`) and **underline-style tabs** (`bg-transparent border-b`, `border-b-2 border-primary`).

## Changes — `src/pages/admin/CrewsVans.tsx`

1. **Remove the custom header block** (lines 286-302) — the icon, "Crews & Fleet" title, and subtitle. The `AdminLayout title="Crews & Fleet"` already provides the page title. Move the "Add Entry" button to sit next to the tabs (same row, right-aligned), matching how Catalog places its "New Service" button.

2. **Switch tabs to underline style** — replace the current `TabsList` and `TabsTrigger` classes:
   - `TabsList`: `bg-transparent border-b border-border rounded-none p-0 h-auto w-auto`
   - `TabsTrigger`: `rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1`

3. **Layout wrapper**: Use `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3` to place tabs left, button right — same pattern as Catalog.

