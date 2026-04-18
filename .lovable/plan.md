
User wants further UI/UX improvements on /admin/projects. Already implemented: KPI header, risk dots, NRA badges, 5-column pipeline. Let me think about what's still weak from a senior operator UX standpoint at 1065px viewport.

Looking at current state:
- Header: 4 KPI cards (good but static)
- Controls row: New button + search + status select + view toggle (functional but generic)
- Board: 5 columns × 260-280px = ~1400px → forces horizontal scroll at 1065px (PAIN POINT)
- Cards: dense but no quick actions, no hover preview, must click → side panel
- No smart filters (At Risk, Need Photos, Overdue chips)
- No "Awaiting Conversion" surfacing of accepted proposals
- No keyboard shortcuts / command palette
- Status filter dropdown duplicates what columns already show
- View toggle (Board/List) is fine but list view is plain

Real friction points at 1065px:
1. Horizontal scroll on board — 5 columns don't fit. Operator loses context.
2. KPI header takes vertical space but doesn't drive action (no click-to-filter)
3. No way to see "what needs me NOW" without scanning all 5 columns
4. Smart filter chips missing (mentioned in prior recs but not built)
5. Cards have no quick action (e.g. mark paid, open chat) — every interaction = side panel
6. Status filter select is redundant with columns
7. No empty state coaching when filtered to zero
8. List view is bare — no risk/NRA signals there

Top improvements ranked by ROI for a 1065px senior operator:

**A. KPI cards become filter chips** — click "At Risk" → board filters to risk projects only. Removes the redundant status select, makes header actionable.

**B. Compact column layout for narrow viewports** — at <1280px, columns become 220px (fits 4-5 visible) OR collapse "Paid" column into a footer summary since paid = archive.

**C. Smart filter bar (chips row)** — At Risk · Need Photos · Overdue · No Proposal · This Week · Mine. Multi-select.

**D. Card hover quick-actions** — chat icon (jumps to chat tab), $ icon (mark paid), camera icon (upload proof). Reduces clicks.

**E. Awaiting Conversion ribbon** — thin banner above board showing "3 accepted proposals awaiting project creation" with one-click convert (uses pendingProposals already loaded but unused).

**F. List view parity** — add risk dot column + NRA badges + unread chat count to list view.

**G. Empty state coaching** — when filter returns 0, show helpful message + clear filters CTA.

**H. Keyboard shortcuts** — `/` focus search, `n` new project, `b/l` toggle board/list, `esc` close panel.

I'll propose A+C+E+F as the next tier (highest impact, doesn't require huge refactor), with B as conditional. Skip D/H for a later round to keep scope tight.

Keep plan concise.
