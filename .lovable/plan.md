
User wants inline creation directly from the ProjectDetailPanel side sheet. Currently each tab shows "No measurements yet" / "No materials" / "No invoices yet" as dead-end empty states. He wants to create them right there without navigating away.

Let me check existing hooks/components for reuse:
- `useMeasurements` has `useCreateMeasurement` + `useUpsertArea`
- `useMaterialCosts` likely has create mutations
- `useLaborEntries` likely has create mutations  
- `useInvoices` has `useCreateInvoice`
- `InlineInvoiceForm` already exists in `InvoicesPaymentsSection` (from JobDetail)

Strategy: keep the side sheet lightweight. Don't dump full forms in there — that breaks the "quick preview" pattern. Instead use compact inline mini-forms (1-2 line inputs) that capture the essentials, with "Open full form" link for advanced cases.

Let me design the 3 quick-add patterns:

**Measurements tab:**
- Top: `+ Add measurement` button → reveals inline row: [date input] [sqft input] [Save]
- Creates a `project_measurement` with status='draft', then user can open full editor later
- Already-listed measurements stay clickable to navigate to MeasurementsManager

**Costs tab (split Materials + Labor):**
- Materials: `+ Add material` → reveals inline row: [description] [supplier] [$amount] [Save]
- Labor: `+ Add labor` → reveals: [worker name] [days] [daily rate] [Save]
- Both create directly via existing hooks

**Invoices tab:**
- `+ New invoice` → inline mini-form: [description (single line item)] [amount] [due date] [Save]
- Auto-generates invoice_number, status='draft', creates 1 line item
- For complex invoices with phases/multiple items, link to "Open full invoice" after creation

Need to verify hooks exist:
