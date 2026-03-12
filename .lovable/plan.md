

## Plan: Add Quick Quote Feature to Lead Pipeline

### What's Being Done
Copy the two uploaded files into the project, with fixes for multi-tenancy compliance and database schema requirements.

### Issues in Uploaded Files That Need Fixing

1. **`QuickQuoteSheet.tsx`** — The `proposals` insert (line 166-178) is missing **required fields**: `customer_id` and `project_id` (both are NOT NULL in the schema). Since Quick Quote operates on leads that may not yet have a project/customer, the component needs to either:
   - Create a customer + project on the fly before inserting the proposal, OR
   - Skip proposal creation and just store the quote data differently

2. **`LinearPipeline.tsx`** — The `leads.insert` call (line 145) is missing `organization_id` (required after multi-tenancy migration). Needs `organization_id: AXO_ORG_ID`.

### Proposed Approach

**File 1: `src/components/admin/QuickQuoteSheet.tsx`** — Create from uploaded content with these fixes:
- In `handleSave`, before inserting the proposal: create a customer record from the lead data, then create a project record, then insert the proposal with valid `customer_id` and `project_id`.
- Also update the lead's `converted_to_project_id` field.

**File 2: `src/pages/admin/components/LinearPipeline.tsx`** — Replace with uploaded content, adding:
- `import { AXO_ORG_ID } from "@/lib/constants"` 
- `organization_id: AXO_ORG_ID` to the leads insert on line 145

### Files Changed
| File | Action |
|------|--------|
| `src/components/admin/QuickQuoteSheet.tsx` | Create (from upload + fixes) |
| `src/pages/admin/components/LinearPipeline.tsx` | Replace (from upload + org_id fix) |

