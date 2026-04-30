
## Goal

Bring the Partner portal mobile UX in line with the rest of the system (Admin / Collaborator) by replacing the top `Tabs` switcher with a fixed **bottom navigation bar** featuring a centered FAB to send a new referral.

## Why this pattern

- Admin uses 5 items + center FAB (`MobileBottomNav`).
- Collaborator uses 4 items, flat bar.
- Partner currently uses a top `Tabs` component → inconsistent and wastes vertical space on 390px viewport.

A bottom nav is thumb-reachable, frees the header, and the center FAB makes the partner's main action (send referral) one tap away from anywhere.

## Proposed Bar — 4 items + center FAB

```text
┌─────────────────────────────────────────┐
│  Pipeline   Earnings   ➕   Rewards  Profile │
└─────────────────────────────────────────┘
```

| Slot | Icon | Label | Action |
|---|---|---|---|
| 1 | `Users` | Pipeline | Show pipeline view (default) |
| 2 | `DollarSign` | Earnings | Show commissions/earned breakdown |
| 3 | `Plus` (FAB, raised, gold) | — | Opens `NewReferralSheet` |
| 4 | `Trophy` | Rewards | Show tier progress / weekly challenge |
| 5 | `User` | Profile | Show profile tab |

Active item: gold/primary color + filled icon. Inactive: `muted-foreground`.
Center FAB: circular, `bg-primary`, `-top-4` raised, soft shadow — same style as `MobileBottomNav` admin.

## Implementation

### 1. New component `src/components/partner/PartnerBottomNav.tsx`
- Props: `active: 'pipeline' | 'earnings' | 'rewards' | 'profile'`, `onChange`, `onNewReferral`.
- Fixed bottom bar with `safe-area-inset-bottom` padding.
- Mirrors styling of `MobileBottomNav.tsx` (raised FAB, max-w-lg, border-top, shadow).

### 2. Refactor `src/pages/partner/PartnerDashboard.tsx`
- Remove the top `<Tabs>` / `<TabsList>` shell.
- Replace with a `view` state (`useState<'pipeline'|'earnings'|'rewards'|'profile'>('pipeline')`).
- Conditionally render the matching section.
- Keep the existing **Pipeline** content (KPIs + stage filter + search + grouped leads).
- Move the existing **Profile** tab content into the `profile` view.
- Add two lightweight new views (placeholder cards reusing existing data):
  - **Earnings**: Commission rate card + Earned total + list of converted leads with $ per lead.
  - **Rewards**: Total referrals, conversion rate, weekly challenge counter (already tracked in DB), and tier badge using existing `ReferralTierBadge` if compatible — otherwise a simple progress card.
- Header: simplified to logo + welcome text (drop the inline "New" button — replaced by the FAB).
- Add `pb-24` to main wrapper so content doesn't sit under the bar (already present).
- Mount `<PartnerBottomNav />` at the bottom of the page.

### 3. Keep
- `NewReferralSheet` (triggered by FAB).
- All current data fetching in `loadData()`.
- All existing partner pipeline cards / stage bar.

## Files touched

- **NEW** `src/components/partner/PartnerBottomNav.tsx`
- **EDIT** `src/pages/partner/PartnerDashboard.tsx` (remove Tabs, add view state + bottom nav)

## Out of scope

- No DB changes.
- No changes to `/partner/auth` or other partner pages.
- No changes to admin/collaborator nav.

## Visual reference

Design tokens reused: `bg-card`, `border-t`, `text-primary`, `bg-primary/10` for active pill, raised FAB matching admin (`w-12 h-12 rounded-full bg-primary shadow-lg -top-4`).

After approval I'll implement the two files in one pass and verify on the 390px viewport.
