
# New Job Quick Action Modal

## Overview
When clicking "Novo Job" in the Quick Actions drawer, instead of just navigating to `/admin/jobs`, a clean modal will open with a simple form to create a new job -- inspired by the reference image you shared.

## User Flow
1. User taps the FAB (+) on the bottom nav
2. Taps "Novo Job" in the quick actions grid
3. The quick actions drawer closes and a Dialog opens with:
   - Title: **"New Job"**
   - Field: **Job address** (text input with placeholder "Enter address and select")
   - Field: **Customer name** (required to create a project)
   - Field: **Customer phone** (required by the database)
   - Field: **Project type** (select with common options like Sanding, Refinishing, etc.)
   - Button: **"Continue"** (gradient style, creates the project and navigates to the job detail)
4. On submit, a new project is created in the database and the user is taken to the Jobs page with the new job's control modal open

## Design
- Clean, minimal modal matching the reference screenshot style
- Large centered title "New Job"
- Simple form fields with clear labels
- Full-width gradient "Continue" button at the bottom
- Close (X) button in the top-right corner

## Technical Details

### File: `src/components/admin/NewJobDialog.tsx` (new)
- New component with a Dialog containing the creation form
- Uses `supabase` to insert into the `projects` table
- Required fields: `customer_name`, `customer_email` (can default to empty), `customer_phone`, `project_type`, `address`
- On success: closes the dialog, shows a toast, and navigates to `/admin/jobs`
- Uses react-hook-form with zod validation for input safety

### File: `src/components/admin/MobileBottomNav.tsx` (modify)
- Import `NewJobDialog`
- Add state `newJobOpen` to control the dialog
- Update `handleQuickAction("job")` to set `newJobOpen = true` instead of navigating
- Render the `NewJobDialog` component

### Database
- No schema changes needed -- the `projects` table already has all required columns with sensible defaults (`project_status` defaults to `'pending'`)
