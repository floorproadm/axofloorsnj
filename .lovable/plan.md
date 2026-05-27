## Objetivo
Deixar o sistema de automações 100% funcional com email-only: converter SMS pendentes em email, adicionar rodapé de opt-out em todos os drips e popular as variáveis de agendamento no engine.

## Observações da auditoria (antes de mudar)

**SMS drips encontrados (5, não 4):**
| ID | Sequência | Stage | Delay |
|---|---|---|---|
| `9237ede4…` | Aggressive New Lead Follow Up | `cold_lead` | 0d *(será convertido)* |
| `7cd4f2f6…` | Aggressive New Lead Follow Up | `cold_lead` | 4d *(será convertido)* |
| `10822afb…` | Passive Proposal Follow Up | `proposal_sent` | 3d *(será convertido)* |
| `0ec04612…` | Cancelled Appointment | `warm_lead` | 1d *(será convertido)* |
| `6eeea762…` | Appointment Information | `estimate_scheduled` | 0d *(não está na sua lista — mantenho como SMS / skipped)* |

Confirma deixar esse 5º SMS (`Appointment Information`) como está? Sigo a sua lista de 4.

**Edge function `unsubscribe` não existe.** Você pediu apenas para gerar a URL `…/functions/v1/unsubscribe?lead_id=…` e injetar como `{{unsubscribe_url}}`. Vou fazer só isso — o link existirá mas retornará 404 até a função ser criada. Se quiser, faço a função num passo seguinte (toggle simples num campo `unsubscribed_at` na tabela `leads` + página de confirmação).

## Mudanças

### 1. Migration SQL (uma única migration)

**1a. Converter os 4 SMS → email** via `UPDATE automation_drips` por `id`, setando `channel='email'`, `subject` e `message_template` novos:

- **`9237ede4` — cold_lead 0d (Welcome imediato)**  
  Subject: `We got your quote request, {{first_name}}!`  
  Body: agradecimento imediato em nome de `{{salesperson_name}}` / `{{company_name}}`, confirma que recebemos o pedido (`{{services}}`), próximo passo é agendar a visita técnica via `{{view_request_button}}` ou ligar `{{company_phone}}`. Tom = mesmo da sequência "Aggressive New Lead Follow Up".

- **`7cd4f2f6` — cold_lead 4d (Quick check-in)**  
  Subject: `Still need help with your project, {{first_name}}?`  
  Body curto, 2-3 frases, pergunta se ainda precisa de ajuda, CTA `{{view_request_button}}`. Casa entre os drips 3d ("Are you still interested…") e 5d ("Availability this week").

- **`10822afb` — proposal_sent 3d**  
  Subject: `Any questions about your proposal, {{first_name}}?`  
  Body: `{{salesperson_name}}` faz check-in, oferece esclarecer dúvidas, CTA duplo `{{view_quote_button}}` + ligar. Casa entre 1d ("Have you had a chance…") e 4d ("Ok, we just couldn't wait…").

- **`0ec04612` — warm_lead Cancelled 1d**  
  Subject: `Sorry we missed you, {{first_name}} — let's reschedule`  
  Body: empático sobre o cancelamento, oferece reagendar via `{{view_request_button}}`. Casa com o 3d "Touching base - still interested?" da mesma sequência.

**1b. Adicionar rodapé de opt-out** em **todos** os drips com `channel='email'` (inclui os 4 recém-convertidos) via `UPDATE automation_drips … SET message_template = message_template || '<footer html>' WHERE channel='email' AND message_template NOT LIKE '%unsubscribe_url%'`. Guard `NOT LIKE` para ser idempotente.

Rodapé exato (conforme pedido):
```html
<br><hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="font-size:12px;color:#999;text-align:center">To unsubscribe from these emails, <a href="{{unsubscribe_url}}">click here</a>.</p>
```

### 2. Edit `supabase/functions/automation-engine/index.ts`

**2a. `{{unsubscribe_url}}`** — adicionar ao bloco `vars`:
```ts
unsubscribe_url: `${supabaseUrl}/functions/v1/unsubscribe?lead_id=${lead.id}`,
```

**2b. Appointment vars** — antes do `vars`, fazer lookup do próximo agendamento do lead:
```ts
const { data: nextAppt } = await supabase
  .from("appointments")
  .select("appointment_date, appointment_time, location")
  .eq("organization_id", log.organization_id)
  .eq("customer_id", lead.customer_id)            // appointments usa customer_id
  .gte("appointment_date", new Date().toISOString().slice(0,10))
  .in("status", ["scheduled", "confirmed"])
  .order("appointment_date", { ascending: true })
  .order("appointment_time", { ascending: true })
  .limit(1)
  .maybeSingle();
```
Fallback: se `lead.customer_id` é null ou não há resultado → strings vazias (já é o comportamento atual). Formatar `appointment_date` como `MMM D, YYYY` e `appointment_time` como `h:mm AM/PM` para leitura humana; `appointment_location` = `nextAppt?.location || lead.address || ""`.

Nota: a tabela `appointments` se liga ao lead via `customer_id`, não `lead_id`. Se o lead ainda não tem `customer_id`, as vars ficam vazias (comportamento aceitável — atualmente já ficam vazias).

### 3. Sem mudanças em UI

Tudo é backend (SQL + edge function). Os drips reaparecem como "Email" no `/admin/automations` automaticamente.

## Validação pós-deploy
1. `SELECT channel, COUNT(*) FROM automation_drips GROUP BY channel;` → 0 SMS (exceto o 5º se mantido).
2. `SELECT COUNT(*) FROM automation_drips WHERE channel='email' AND message_template NOT LIKE '%unsubscribe_url%';` → 0.
3. Logs do `automation-engine` mostram envio com `{{appointment_date}}` interpolado em drips de `estimate_scheduled`.

## Pergunta antes de implementar
1. Manter o 5º SMS (`Appointment Information`, `estimate_scheduled` 0d) como está, ou converter também?
2. Quer que eu **também** crie a edge function `unsubscribe` (marca `leads.unsubscribed_at` + cancela enrollments ativos + página de confirmação)?