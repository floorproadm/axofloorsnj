
User wants to unify /admin/jobs and /admin/projects since they're essentially the same thing. Let me check both quickly.

Both reference `projects` table. JobsManager is the older heavy version (Kanban + list, KanbanCard, JobControlModal, ProjectNotesSection inline ~1079 lines). ProjectsHub is the newer cleaner cockpit (5-column pipeline + ProjectDetailPanel side sheet, ~115 lines) — already noted in memory as "Projects Hub Cockpit".

ProjectsHub is clearly the modern version. Per memory `mem://features/management/projects-hub-cockpit`, this is the canonical cockpit. JobsManager is legacy duplication.

Plan: Keep ProjectsHub as the SSOT, redirect /admin/jobs to /admin/projects, delete JobsManager.

Need to check sidebar/nav references and detail routes.

# Unify /admin/jobs and /admin/projects

Both routes manage the same `projects` table. `/admin/projects` (ProjectsHub) is the modern cockpit (115 lines, 5-column pipeline, side panel). `/admin/jobs` (JobsManager) is the legacy duplicate (~1079 lines, inline modal, redundant features). Consolidate into one.

## Decision
Keep **`/admin/projects`** (ProjectsHub) as the canonical hub. Detail page stays at **`/admin/jobs/:id`** (JobDetail) — that's the operational detail and is referenced everywhere. Only the listing pages get unified.

## Changes

**1. Redirect legacy list route**
- `src/App.tsx`: change `/admin/jobs` route from `JobsManager` → `<Navigate to="/admin/projects" replace />`
- Keep `/admin/jobs/:id` → `JobDetail` untouched (used by every link in the system)

**2. Update navigation**
- `src/components/admin/AdminSidebar.tsx`: replace any "Jobs" link pointing to `/admin/jobs` with "Projects" → `/admin/projects` (or remove if duplicated)
- `src/components/admin/MobileBottomNav.tsx`: same — point Jobs tab to `/admin/projects`
- Verify `ProjectPipelineBoard` / `ProjectDetailPanel` "Open full details" buttons navigate to `/admin/jobs/:id` (they should already)

**3. Port any unique value from JobsManager → ProjectsHub (if missing)**
Quick audit of JobsManager features vs ProjectsHub:
- Summary bar (deals/pending/active/done/revenue counters) → ProjectsHub already has filter counts, good enough
- KanbanCard health indicators (margin/proof badges) → already in ProjectPipelineBoard cards
- Inline ProjectNotesSection / JobControlModal → redundant, JobDetail page handles it

If anything is missing after delete, port it into `ProjectPipelineBoard` or `ProjectDetailPanel`.

**4. Delete legacy file**
- Delete `src/pages/admin/JobsManager.tsx`

**5. Memory update**
- Update `mem://features/management/projects-hub-cockpit` to note `/admin/jobs` redirects to `/admin/projects`; only `/admin/jobs/:id` remains as detail route.

## Result
- Single list route: `/admin/projects` (Projects Hub)
- Single detail route: `/admin/jobs/:id` (Job Detail) — unchanged
- ~1000 lines of legacy code removed
- No broken links (redirect handles old bookmarks)
