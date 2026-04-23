

# Fase 2 + Fase 3 — Client Portal, Stripe Deposit & Two-Way SMS

Plano consolidado para fechar o ciclo Cliente → Pagamento → Comunicação no AXO OS. Cada fase é independente e pode ser aprovada/executada separadamente.

---

## FASE 2 (P1) — Client Portal `/portal/:token`

**Objetivo:** Eliminar perguntas "Onde está minha proposta?" / "Quando começa?" sem fricção de login.

### Rota e padrão de acesso
- Nova rota pública `/portal/:token` (mesmo padrão sem-auth do `/proposal/:token` e `/invoice/:token`).
- Token único por **cliente** (`customers.portal_token`), gerado automaticamente, copiável pelo admin no PartnerDetailPanel/CustomerDetail.

### Estrutura da página (mobile-first, light mode, navy/gold AXO)
```text
┌─────────────────────────────────────┐
│  Logo AXO   ·   Hi, {first_name}    │
├─────────────────────────────────────┤
│  Tabs: Proposals · Invoices · Status │
├─────────────────────────────────────┤
│  [Tab content cards]                 │
├─────────────────────────────────────┤
│  Need help? (732) 351-8653 · sms    │
└─────────────────────────────────────┘
```

**Tab 1 — Proposals:** lista de propostas do cliente com badges (`Awaiting Approval` / `Approved` / `Expired`). Cada item linka para `/proposal/:share_token` (já existe).

**Tab 2 — Invoices:** lista com `Payment Due` / `Paid` / amount. Botão "View & Pay" linka para `/invoice/:share_token`.

**Tab 3 — Project Status:** timeline visual por projeto:
```text
● Approved → ● Scheduled → ○ In Progress → ○ Completed
```
Mostra `start_date`, `next_action`, e contato direto do PM.

### Banco de dados (Fase 2)
```sql
ALTER TABLE public.customers
  ADD COLUMN portal_token text UNIQUE
    DEFAULT encode(gen_random_bytes(24), 'hex');

CREATE INDEX idx_customers_portal_token ON public.customers(portal_token);

-- RLS público por token
CREATE POLICY customers_public_read_by_token ON public.customers
  FOR SELECT TO anon
  USING (portal_token IS NOT NULL);

CREATE POLICY proposals_public_list_by_customer ON public.proposals
  FOR SELECT TO anon
  USING (customer_id IN (SELECT id FROM public.customers WHERE portal_token IS NOT NULL));

CREATE POLICY invoices_public_list_by_customer ON public.invoices
  FOR SELECT TO anon
  USING (project_id IN (
    SELECT p.id FROM public.projects p
    WHERE p.customer_id IN (SELECT id FROM public.customers WHERE portal_token IS NOT NULL)
  ));

CREATE POLICY projects_public_list_by_customer ON public.projects
  FOR SELECT TO anon
  USING (customer_id IN (SELECT id FROM public.customers WHERE portal_token IS NOT NULL));
```

### Admin: botão "Copy Portal Link"
- No `PartnerDetailPanel` (cliente) e em `LeadDetail` após conversão: botão `Copy Portal Link` + `Send via SMS`.

### Microcopy (US, sem hype)
- ✅ "Your AXO Portal — Proposals, Invoices & Project Updates"
- ✅ "Project Status: In Progress · Sanding scheduled for Apr 28"
- ❌ Sem "🎉 Welcome!" — manter Senior Operator aesthetic.

---

## FASE 3A (P1) — Stripe Deposit no `/proposal/:token`

**Objetivo:** Aceitar 30% de depósito online no momento da assinatura (reduz tempo de fechamento de dias para minutos).

### Decisão de provider
Usar **Lovable Built-in Stripe Payments** (`enable_stripe_payments`) — sem onboarding manual, ambiente de teste imediato. Não usar BYOK Stripe.

### Fluxo
1. Cliente clica `Approve & Sign` em `/proposal/:token`.
2. Após assinar (já existe), sheet aparece: `How would you like to pay the 30% deposit?`
   - **[Pay Now — $X via Card]** → Stripe Checkout (one-time payment, modo `sandbox`/`live`)
   - **[I'll pay by Check / Zelle]** → mostra instruções, marca `payment_method = 'manual'`
3. Webhook do Stripe (`stripe-webhook` edge function):
   - Marca `proposal_signatures.payment_status = 'deposit_paid'`
   - Cria registro em `payments` (category=`received`, status=`completed`)
   - Cria invoice automática 30% com status `paid`
   - Notifica admin via `notifications`

### Banco de dados (Fase 3A)
```sql
ALTER TABLE public.proposal_signatures
  ADD COLUMN payment_method text,            -- 'stripe' | 'check' | 'zelle'
  ADD COLUMN payment_status text DEFAULT 'pending', -- 'pending' | 'deposit_paid' | 'skipped'
  ADD COLUMN stripe_session_id text,
  ADD COLUMN deposit_amount numeric,
  ADD COLUMN deposit_paid_at timestamptz;

ALTER TABLE public.proposals
  ADD COLUMN deposit_percent numeric DEFAULT 30;
```

### Edge Functions
- `create-deposit-session` — recebe `proposal_id` + `selected_tier`, calcula 30%, cria Stripe Checkout Session, retorna URL.
- `stripe-webhook` — handler `checkout.session.completed`, atualiza signature + cria payment + invoice.

### Configuração necessária
- Pro plan ativo (pré-requisito Lovable Payments).
- Eligibility check via `recommend_payment_provider` antes de habilitar.

---

## FASE 3B (P2) — Two-Way SMS Inbox

**Objetivo:** Centralizar conversas SMS cliente↔empresa em uma inbox dentro do admin (em vez de múltiplos celulares pessoais).

### Pré-requisitos críticos
- **Twilio Connector** (já temos secrets `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`) — migrar para connector gateway p/ refresh automático.
- **A2P 10DLC Brand + Campaign Registration** — obrigatório nos EUA. Lead time **2-4 semanas**, custo ~$15 setup + $10/mês. Sem isso, mensagens são bloqueadas pelas carriers.
- Habilitar **SMS Pumping Protection** + **Geo Permissions (US-only)** no console Twilio.

### Estrutura de dados
```sql
CREATE TABLE public.sms_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  customer_id uuid REFERENCES customers(id),
  lead_id uuid REFERENCES leads(id),
  customer_phone text NOT NULL,
  last_message_at timestamptz DEFAULT now(),
  unread_count int DEFAULT 0,
  status text DEFAULT 'open',   -- 'open' | 'archived'
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.sms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES sms_conversations(id) ON DELETE CASCADE,
  direction text NOT NULL,      -- 'inbound' | 'outbound'
  body text NOT NULL,
  twilio_sid text,
  status text,                  -- 'queued' | 'sent' | 'delivered' | 'failed'
  sent_by uuid,                 -- user_id (NULL para inbound)
  created_at timestamptz DEFAULT now()
);

ALTER PUBLICATION supabase_realtime ADD TABLE sms_messages;
```

### UI — `/admin/inbox`
- Layout 2 colunas (Linear/Notion-style): lista de conversas (esquerda) · thread (direita).
- Indicador de unread, link para Lead/Customer/Project.
- Quick replies (templates de `automations`).
- Mobile: stack vertical com back button.

### Edge Functions
- `sms-send` — envia via Twilio gateway, persiste outbound, atualiza `last_message_at`.
- `sms-webhook` (Twilio inbound) — recebe POST do Twilio, faz match por `customer_phone`, cria conversation se nova, dispara notification ao admin atribuído.

### Integração com pipeline
- Botão "Reply via SMS" em `LeadDetail`, `JobDetail` e `PartnerDetailPanel` abre a thread direto na inbox.
- Mensagens inbound em leads `proposal_sent` resetam o `follow_up_required` (sinal de engajamento).

---

## Detalhes técnicos transversais

**Storage:**
- `proposal-signatures` (já existe) — sem mudanças.
- Sem novos buckets necessários.

**Notifications:**
- Reaproveitar tabela `notifications` para alertas de:
  - "Deposit received: $X from {customer}"
  - "New SMS from {customer}: {preview}"

**Realtime:**
- `sms_messages` já incluído no plano (ALTER PUBLICATION).
- Portal não precisa de realtime (refresh on tab focus é suficiente).

**Segurança:**
- Stripe webhook valida assinatura (`STRIPE_WEBHOOK_SECRET`).
- Twilio webhook valida `X-Twilio-Signature`.
- Rate limit no `sms-send` (max 30 msgs/min por org) — store em tabela `rate_limits`.

---

## Ordem de execução recomendada

| Ordem | Bloco | Tempo estimado | Dependência externa |
|---|---|---|---|
| 1 | **Fase 2** Client Portal | ~30min | Nenhuma |
| 2 | **Fase 3A** Stripe Deposit | ~45min | Pro plan + eligibility check |
| 3 | **Fase 3B** SMS Inbox | ~1h código | A2P 10DLC registration (2-4 sem) |

**Sugestão:** executar **Fase 2 + Fase 3A** juntas (alto ROI imediato, sem bloqueios externos). Fase 3B só faz sentido iniciar registro 10DLC em paralelo — código fica pronto, mas envio real depende da aprovação carrier.

---

## Pergunta antes de implementar

Confirme qual bloco executar:
- **A)** Apenas Fase 2 (Client Portal)
- **B)** Fase 2 + Fase 3A (Portal + Stripe deposit) ← recomendado
- **C)** Fase 2 + 3A + 3B (tudo, ciente do bloqueio 10DLC)

