## Objective
Fix the empty body of drip #6 (14-day delay, subject "Is there something stopping you?") in the `proposal_sent` automation sequence by injecting a professional, empathetic follow-up message via a targeted SQL UPDATE migration.

## Context
- Sequence: `proposal_sent` — Passive Proposal Follow Up
- Drip: #6, delay_days = 14, subject = "Is there something stopping you?"
- Issue: `message_template` is currently blank/empty

## Proposed SQL Migration
```sql
-- Fix empty message_template for drip #6 in proposal_sent sequence
UPDATE automation_drips
SET message_template = '<professional re-engagement copy using {{first_name}} and {{company_name}}>'
WHERE id = (
  SELECT d.id
  FROM automation_drips d
  JOIN automation_sequences s ON s.id = d.sequence_id
  WHERE s.stage_key = 'proposal_sent'
    AND d.delay_days = 14
    AND d.subject = 'Is there something stopping you?'
  LIMIT 1
);
```

## Message Requirements
- Tone: Consultative, empathetic, human — matching the rest of the sequence
- 14 days after proposal was sent
- Ask if there's a question, concern, or obstacle that can be resolved
- Include `{{first_name}}` and `{{company_name}}` variables where natural
- Keep it concise but warm; avoid sales pressure
- End with a soft CTA (reply or call)

## Implementation Steps
1. Write the UPDATE migration with the interpolated message body
2. No frontend or TypeScript changes required (pure data fix)
3. Approve and execute the migration

No code changes needed — this is a single SQL UPDATE to fix missing drip content.