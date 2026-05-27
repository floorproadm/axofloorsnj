## Bug fixes for proposals system

### BUG 1 — ShareModal broken link
File: `src/pages/admin/Proposals.tsx` (function `ShareModal`, ~line 296).

- Remove the `btoa(...)` token hack.
- Load the real `share_token` from the `proposals` table on open (state + `useEffect` querying `proposals.share_token` by `proposal.id`).
- If `share_token` is null, generate one via `encode(gen_random_bytes(24),'hex')` style — easier: insert `crypto.randomUUID().replace(/-/g,'')` and `UPDATE proposals SET share_token = ... WHERE id = ...` then use it.
- Build `publicUrl = ${origin}/proposal/${realToken}` from that value. Show a loading state until token resolves; disable Copy/Email/WhatsApp until loaded.

### BUG 2 — Line items not persisted
File: `src/components/admin/ProposalGenerator.tsx` (`saveLines`, ~line 187).

New DB table via migration:

```
public.proposal_line_items (
  id uuid pk default gen_random_uuid(),
  proposal_id uuid not null,
  description text not null default '',
  category text not null default 'other',
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  amount numeric generated always as (quantity * unit_price) stored,
  display_order int not null default 0,
  created_at timestamptz not null default now()
)
```

- GRANTs: `authenticated` full, `service_role` all, `anon SELECT` (needed so `/proposal/:token` public page can read items).
- RLS:
  - tenant_all (authenticated) via join `proposals.organization_id = get_user_org_id()`.
  - public read by token via join `proposals.share_token IS NOT NULL` (mirrors `invoice_items` policy).
- Index on `proposal_id`.

Update `saveLines()`:
- `delete from proposal_line_items where proposal_id = X` then `insert` all current `editableLines` (description, category, quantity, unit_price, display_order by index).
- Keep updating `proposals.flat_price = editedTotal` as before.

Hydration (`useEffect` ~line 143): read from new `proposal_line_items` (qty + unit_price) when present; fall back to existing `line_items` array seed only if table empty.

Also update the public proposal page (`src/pages/PublicProposal.tsx`) to fetch from `proposal_line_items` when `use_tiers=false` so the breakdown shows real qty/unit_price.

### BUG 3 — Decline button on public portal
File: `src/pages/PublicProposal.tsx`.

- Add new column via migration: `proposals.rejection_reason text null`, `proposals.rejected_at timestamptz null` (if not present — confirmed missing).
- Add `Decline Proposal` outline button next to the signature CTA (only when status is `sent`/`viewed`).
- New `DeclineDialog` component (`src/components/proposal/DeclineDialog.tsx`):
  - Textarea "Reason (optional)".
  - On confirm: `update proposals set status='rejected', rejection_reason=<text or null>, rejected_at=now() where share_token = token`.
  - Public RLS `proposals_public_*` already allows update by share_token (mirrors invoice). Verify and add a permissive UPDATE policy `proposals_public_decline_by_token` if missing, scoped `using (share_token is not null)`.
- After update, show a confirmation card: "Proposal declined — thank you for letting us know."

### BUG 4 — Admin notification email on signature
File: `src/components/proposal/SignatureDialog.tsx` (in `handleSubmit`, after the `proposals` update succeeds).

- Look up admin email: query `company_settings.email` (already public-readable).
- Look up proposal number: query `proposals.proposal_number` (already loaded in caller — pass it as a prop `proposalNumber` to avoid extra round trip).
- Call `supabase.functions.invoke('gmail-send', { body: { to: adminEmail, subject: 'Proposal Signed — <number>', html: <table with customer name, proposal #, selected tier, payment method, link to https://<origin>/admin/proposals> } })`.
- Wrap in try/catch — never block the success UI if email fails (just `console.error`).

Add `proposalNumber: string` prop to `SignatureDialog` and pass it from `PublicProposal.tsx`.

### Technical summary

1. Migration: create `proposal_line_items` table + grants + RLS + index; add `rejection_reason`, `rejected_at` columns to `proposals`; add public UPDATE policy on `proposals` for decline-by-token if not already present.
2. Edit `src/pages/admin/Proposals.tsx` — real `share_token` in `ShareModal`.
3. Edit `src/components/admin/ProposalGenerator.tsx` — upsert into `proposal_line_items` in `saveLines`, hydrate from it.
4. Edit `src/pages/PublicProposal.tsx` — fetch line items from new table; add Decline button + dialog wiring.
5. New file `src/components/proposal/DeclineDialog.tsx`.
6. Edit `src/components/proposal/SignatureDialog.tsx` — add `proposalNumber` prop + admin email via `gmail-send`.

No edge function changes needed (reuses existing `gmail-send`).
