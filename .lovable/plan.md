
# Quick Create Menu for Schedule

## Overview
Replace the single "Novo" button on `/admin/schedule` with a dropdown menu (using `DropdownMenu`) that offers two creation paths:

1. **New Task** -- Opens the existing `AppointmentModal` directly (current behavior)
2. **Template (Task/Event)** -- Opens a new template picker dialog with pre-configured appointment templates

## Changes

### 1. Add Dropdown Menu to "Novo" Button
**File:** `src/pages/admin/Schedule.tsx`

Replace the current `<Button onClick={openNew}>` with a `DropdownMenu` component:
- Trigger: Same styled button with `Plus` icon and "Novo" text
- Two menu items:
  - "Novo Agendamento" (calendar icon) -- calls `openNew()` as before
  - "Usar Template" (copy/layout icon) -- opens a template picker dialog

### 2. Create Template Picker Dialog
**File:** `src/pages/admin/Schedule.tsx` (inline component)

Add a `TemplatePickerDialog` component with pre-defined templates such as:
- **Medição Residencial** -- pre-fills: type=measurement, duration=1h, time=09:00
- **Produção (Dia Inteiro)** -- pre-fills: type=production, duration=8h, time=07:00
- **Follow-up Rápido** -- pre-fills: type=follow_up, duration=0.5h, time=14:00
- **Entrega e Inspeção** -- pre-fills: type=delivery, duration=2h, time=10:00

Each template card shows the type color, name, estimated duration, and default time. Clicking a template opens the existing `AppointmentModal` pre-filled with those values.

## Technical Details

### Components Used
- `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` (already available in the project)
- Existing `AppointmentModal` (reused with pre-filled data)
- `Dialog` for the template picker

### State Changes
- Add `templateDialogOpen` state boolean
- Add optional `defaultValues` parameter support to `AppointmentModal` (or set `editingAppointment` with template data)

### Template Data Structure
```text
TEMPLATES = [
  { label, type, duration_hours, default_time, icon }
]
```

When a template is selected, the appointment modal opens with the template fields pre-populated while leaving customer/project fields empty for the user to fill in.

### Files Modified
- `src/pages/admin/Schedule.tsx` -- Add dropdown menu, template picker, and template data
