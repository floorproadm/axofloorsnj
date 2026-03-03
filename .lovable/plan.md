
# Partner Pipeline Board View

## Overview
Add a Kanban-style "Board" view to `/admin/partners` for partner acquisition pipeline management. The current List view remains the **default** when entering the page. A toggle lets the user switch to Board view.

## Pipeline Stages (based on your Notion MVP)
Expanding the current 4 statuses to 6 pipeline stages:

```text
Prospect → Contacted → Meeting Scheduled → Trial/First Job → Active → Inactive
```

## What Changes

### 1. Database Migration: Add new partner statuses
- Add `contacted` and `meeting_scheduled` and `trial_first_job` as valid status values in the `partners` table
- No schema change needed since `status` is already a `text` column -- just update the constants

### 2. Update `usePartnersData.ts`
- Expand `PARTNER_STATUSES` to include the new stages:
  - `prospect` -> "Prospect"
  - `contacted` -> "Contacted" 
  - `meeting_scheduled` -> "Meeting Scheduled"
  - `trial_first_job` -> "Trial / First Job"
  - `active` -> "Active"
  - `inactive` -> "Inactive"
  - `churned` -> "Perdido" (kept but hidden from board -- off-pipeline)
- Add `PARTNER_PIPELINE_STAGES` array defining the ordered pipeline
- Add `PARTNER_STAGE_CONFIG` with colors per stage (matching Notion: green for Prospect, blue for Contacted, orange for Meeting Scheduled, yellow for Trial, green for Active, red for Inactive)

### 3. Update `Partners.tsx` (main page)
- Add `viewMode` state (`'list' | 'board'`, default `'list'`)
- Add a List/Board toggle in the header area (same pattern as LinearPipeline)
- When `viewMode === 'board'`:
  - Render a new `PartnerPipelineBoard` component
  - Horizontal scroll with columns per stage
  - Each column shows count and partner cards
  - Cards show: avatar initials, contact name, company name, partner type, referral count
  - Clicking a card opens the existing `PartnerDetailPanel`
- When `viewMode === 'list'`:
  - Render the existing list view (unchanged, current behavior)
- The search and filters remain shared between both views

### 4. New Component: `PartnerPipelineBoard.tsx`
- Located at `src/components/admin/PartnerPipelineBoard.tsx`
- Receives `partners` (filtered), `onSelectPartner`, and `onNewPartner` as props
- Groups partners by status into pipeline stage columns
- Each column:
  - Header with stage name, color dot, and count badge
  - Scrollable card list
  - "+ Novo Partner" button at bottom of Prospect column
- Each card:
  - Avatar with initials (colored by partner type)
  - Contact name (bold) and company name
  - Partner type badge
  - Referral count if > 0
  - Risk indicator if last contact > 30 days
- Drag-and-drop NOT included in V1 (status change happens in detail panel)
- Mobile: horizontal scroll with `overflow-x-auto`, columns at `w-[220px]`

### 5. Update `NewPartnerDialog.tsx`
- Add the new statuses to the status dropdown so new partners can be created at any stage

### 6. Update `PartnerDetailPanel.tsx`
- The status dropdown in the edit form already uses `PARTNER_STATUSES`, so it will automatically pick up the new stages

## Files Modified
1. `src/hooks/admin/usePartnersData.ts` -- add pipeline stages + config
2. `src/pages/admin/Partners.tsx` -- add view toggle + board rendering
3. `src/components/admin/PartnerPipelineBoard.tsx` -- new board component
4. `src/components/admin/NewPartnerDialog.tsx` -- include new statuses in form

## What Stays the Same
- List view is untouched and remains the default
- Detail panel behavior unchanged
- No database migration needed (status is already a text field)
- No backend changes required
