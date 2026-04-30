
## Goal

Add a **Board view** to the partner Pipeline tab, with a List ↔ Board toggle. List remains the default; Board offers a horizontal-scroll Kanban that mirrors the admin's pipeline aesthetic.

## What changes

### 1. New component — `src/components/partner/PartnerPipelineBoard.tsx`

Read-only Kanban (parceiro não arrasta cards — quem move é o admin).

- **Active columns**: New, Contacted, Est. Req., Scheduled, Drafting, Proposal, Production. Hide columns with 0 leads to reduce noise on mobile.
- **Layout**: horizontal `overflow-x-auto snap-x snap-mandatory`, columns `w-[260px]`, gap-3. Bleeds to screen edge with `-mx-4 px-4` for native swipe feel.
- **Column header**: colored dot + uppercase stage label + count badge (matches `PARTNER_LEAD_STAGES` colors).
- **Card** (compact, denser than List version):
  - Name (truncate)
  - City or phone (truncate, 11px muted)
  - Footer: created date · estimated value (formatted `$1.2k` style)
- **Outcome summary** below the board: two cards — `Won` (count + total earned $) and `Lost` (count). Avoids burying active pipeline under 50 closed leads.

### 2. Edit — `src/pages/partner/PartnerDashboard.tsx`

- Add state: `pipelineMode: 'list' | 'board'`, persisted in `localStorage` (`axo.partner.pipelineMode`).
- Add toggle next to `Your Referrals (N)` header — two pills using existing token styles (`bg-foreground text-background` for active, `bg-card border` for inactive).
- When `board` is selected, render `<PartnerPipelineBoard leads={filteredLeads} commissionPercent={...} />` instead of the month-grouped list.
- `PartnerStageBar` and `Search` remain visible and continue to filter the data feeding either view.
- "Clear filters" button preserved.

### 3. Files

- **NEW** `src/components/partner/PartnerPipelineBoard.tsx`
- **EDIT** `src/pages/partner/PartnerDashboard.tsx` (toggle + conditional render + persistence)

## Out of scope

- No drag-and-drop (parceiro não tem permissão para mover stages — RLS).
- No backend changes.
- No changes to admin / collaborator portals.

## Visual reference

```text
Your Referrals (12)             [ List | Board ]

  ● NEW · 2     ● CONTACTED · 3    ● PROPOSAL · 4   →
  ┌──────┐     ┌──────┐            ┌──────┐
  │ John │     │ Mary │            │ Tom  │
  │ NJ   │     │ NYC  │            │ Edison│
  │ 14d $1.2k│ │ 7d $4k│           │ 2d $8k│
  └──────┘     └──────┘            └──────┘

  ┌──── Won ────┐  ┌──── Lost ────┐
  │ 3           │  │ 1            │
  │ +$1,400     │  │ Not converted│
  └─────────────┘  └──────────────┘
```

After your approval I'll create the component and wire the toggle into `PartnerDashboard.tsx` in one pass, then verify on the 390px viewport.
