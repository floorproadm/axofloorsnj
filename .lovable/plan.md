## Bug audit — Proposal duplication

### Root cause

`useProposalGeneration.fetchProjectData()` (`src/hooks/useProposalGeneration.ts` lines 132–286) **always runs `supabase.from('proposals').insert(...)`** — it never checks whether a proposal already exists for the project. This function is called from two places:

1. `ProposalGenerator.handleGenerate()` (`src/components/admin/ProposalGenerator.tsx` line 128) — rendered inside `ProjectDetail` (line 392) and `JobDetail` (line 461) under the **Proposal tab**. Every click of the "Generate" button creates another row.
2. `Proposals.tsx` "New Proposal" dialog `handleGenerate()` (line 189) — then navigates to `/admin/projects/:id?tab=proposal`. If the user clicks Generate again on that tab, **a second row is created** for the same project.

There is also **no `useEffect` on mount in `ProposalGenerator`** that loads the most recent existing proposal for `projectId`. So when a user returns to the Proposal tab of a job that already has a proposal, the UI shows the empty "Generate" state and any click duplicates the row.

DB confirms: project `306cc57d-…` already has 3 proposal rows.

Secondary consequences:
- `proposal_line_items` belong to the latest insert only; older drafts have orphan/empty items.
- `share_token` is only generated when ShareModal opens (`Proposals.tsx` line 322), so older duplicates keep `share_token = null` but still clutter the list and the project's proposal history.
- Margin validation and admin notification logic are per-row, so multiple drafts can each independently transition.

### Fix plan

**1. `src/hooks/useProposalGeneration.ts` — make `fetchProjectData` idempotent per project**

Before the INSERT in both the `direct` and `tiers` branches:

```ts
const { data: existing } = await supabase
  .from('proposals')
  .select('*')
  .eq('project_id', projectId)
  .in('status', ['draft', 'sent', 'viewed'])   // never reuse accepted/rejected/expired
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

if (existing) {
  // Return existing instead of inserting a new row.
  // Hydrate ProposalData from `existing` (id, number, status, prices, valid_until, created_at).
  return mapRowToProposalData(existing, project, baseCost, mode);
}
```

Only INSERT when no reusable proposal exists. Accepted/rejected/expired proposals are terminal — a brand new one should be created in that case (intentional, not a duplicate).

**2. `src/components/admin/ProposalGenerator.tsx` — auto-load existing proposal on mount**

Add a `useEffect([projectId])` that runs the same "find latest non-terminal proposal" query and, if found, calls `setProposal(...)` so the editor opens straight into the existing draft (line items hydrate from the existing `useEffect` at line 150). The big "Generate Proposal" CTA only shows when no proposal exists.

This eliminates the entire class of "I clicked Generate twice" duplicates from both `ProjectDetail` and `JobDetail`.

**3. `src/pages/admin/Proposals.tsx` — "New Proposal" dialog reuses too**

Because `fetchProjectData` is now idempotent, the dialog automatically stops duplicating. Add a small toast hint: `if (existing) toast.info('Opened existing draft for this project')` so the admin understands why no new row appeared. No other change needed — navigation to the tab still works.

**4. One-time cleanup (separate insert tool call, after user approves the code fix)**

For project `306cc57d-…` (and any other `project_id` with >1 non-accepted proposals), keep the most recent and `DELETE` the older draft rows plus their orphan `proposal_line_items`. Done via the insert tool, not migration. I will list the exact rows for confirmation before deleting anything.

### What does NOT change

- `share_token`, `SignatureDialog`, `DeclineDialog`, `gmail-send` admin notification, CSV export, margin enforcement, settings, public `/proposal/:token` — all untouched.
- No DB schema change. No new migration.

### Files edited

- `src/hooks/useProposalGeneration.ts` (add existing-proposal check + small `mapRowToProposalData` helper)
- `src/components/admin/ProposalGenerator.tsx` (load existing proposal on mount; hide Generate CTA when one exists)
- `src/pages/admin/Proposals.tsx` (toast on reuse — 2-line change)

### Optional follow-up (only if you want it)

Add a unique partial index to make duplication impossible at the DB level:

```sql
CREATE UNIQUE INDEX proposals_one_active_per_project
  ON public.proposals (project_id)
  WHERE status IN ('draft','sent','viewed');
```

Tell me if you want this index included — I'll add it as a migration in the same build.
