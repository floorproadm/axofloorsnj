

## Analysis: Quick Quote vs Novo Orçamento

### What Each Does

| Feature | Novo Orçamento | Quick Quote |
|---------|---------------|-------------|
| **Purpose** | Select an existing project, navigate to its detail page for full proposal generation | 3-step wizard (sqft → addons → tier) that auto-creates customer + project + proposal from a **lead** |
| **Input required** | An existing project (already has customer, costs, etc.) | A lead (no project yet) |
| **Output** | Navigation to project detail | Creates customer + project + proposal + moves lead to `proposal_sent` |
| **Context** | Standalone — works from anywhere | Contextual — needs a specific lead to operate on |

### Recommendation: Do NOT add Quick Quote to the "Criar" drawer

Quick Quote is **contextual** — it requires selecting a specific lead to generate the quote from. The "Criar" drawer is for **standalone creation actions** that don't need prior context (new task, new job, new lead, etc.).

Adding Quick Quote here would require an extra step (pick a lead first), which defeats the "quick" purpose and duplicates the flow already available on lead cards in the pipeline.

**"Novo Orçamento" already covers the standalone estimate use case** — it lets you pick a project and go to its detail page for full proposal generation.

### What Should Stay As-Is
- **"Novo Orçamento"** in the Criar drawer → opens `NewEstimateDialog` (project-based)
- **"⚡ Quick Quote"** on lead cards in Pipeline → opens `QuickQuoteSheet` (lead-based, contextual)

No changes needed. The two features serve different audiences in the workflow.

