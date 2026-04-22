

# Análise DripJobs → AXO OS: O Que Aplicar

## Estado Atual (o que já temos)
- ✅ **Lead capture forms** (`/project-wizard`, `/floor-diagnostic`, `/quiz`)
- ✅ **Sales Pipeline** 10 estágios com Kanban (`/admin/leads`)
- ✅ **Proposals** com 3 tiers (Good/Better/Best) + share token
- ✅ **Public Invoice** (`/invoice/:token`) com view tracking
- ✅ **Internal Chat** por projeto (colaborador↔admin)
- ❌ **Public Proposal page** (existe `shareToken` mas não rota pública dedicada com aceitação)
- ❌ **E-signature + deposit online**
- ❌ **Client Portal** unificado (cliente vê suas propostas/invoices/agenda visita)
- ❌ **Two-way SMS Inbox** (cliente↔empresa)

---

## Análise das 5 Telas DripJobs

| # | Tela DripJobs | Status no AXO | Veredito |
|---|---------------|---------------|----------|
| 1 | **Booking Form** público (request appt) | Temos `/project-wizard` (mais qualificador, melhor) | ⚠️ Já temos algo superior — não copiar |
| 2 | **Branded Proposal** público (cliente abre link) | Temos token mas só PDF/print no admin | 🟢 **APLICAR** |
| 3 | **E-Sign & Pay** (assinar + pagar deposit online) | Não existe | 🟢 **APLICAR (alto ROI)** |
| 4 | **Client Portal** (Proposals/Invoices/Appts/Reviews) | Pulverizado em links separados | 🟡 Aplicar versão enxuta |
| 5 | **Two-Way SMS Inbox** | Só chat interno colaborador | 🔴 Adiar (custo Twilio + 10DLC complexo) |

---

## Plano Recomendado — 3 Fases

### **FASE 1 (P0) — Public Proposal + E-Sign + Deposit** ⭐
*Maior impacto em conversão. Fecha o loop "proposta enviada → projeto aprovado" sem fricção.*

**Entregas:**
1. **Rota `/proposal/:token`** — página pública branded (header navy/gold AXO, logo, badge "Awaiting Approval/Approved/Expired")
   - Mostra: cliente, endereço, 3 tiers ou tier único, validade, "Note from AXO"
   - Trust badges: "Premium Materials · DuraSeal", "Expert Craftsmen · 10+ years", "Fully Insured · $2M coverage"
   - Auto-marca `viewed_at` no DB (já temos pattern em PublicInvoice)
2. **Aceitação inline** — botão "Approve & Sign":
   - Seleciona tier (se 3-tier)
   - Canvas de assinatura (`react-signature-canvas`) — salva PNG no Supabase Storage
   - Marca proposta como `accepted` + cria registro em `proposal_signatures` (nova tabela)
   - Trigger DB cria automaticamente o **Project + Job Costs** (já temos `convert_lead_to_project`, adaptar)
3. **Deposit opcional via Stripe** (modo MVP):
   - Botão "Pay Deposit" → Stripe Checkout (link mode, sem precisar Stripe Connect)
   - Webhook marca `deposit_paid_at` + cria invoice 30% automaticamente
   - **Decisão**: começar **sem Stripe** (botão "I'll pay by Check/Zelle" + instruções) e adicionar Stripe na Fase 2 — evita bloquear pela complexidade de onboarding

**Tabelas novas:**
- `proposal_signatures` (proposal_id, signature_url, signer_name, signed_at, ip, payment_method_chosen)

**Microcopy (US/AXO):**
- ✅ "Approve & Sign — Lock In Your Project"
- ❌ "🎉 Proposal Approved!" (sem emojis — Senior Operator aesthetic)
- ✅ "Project confirmed. We'll text you within 24h to schedule kickoff."

---

### **FASE 2 (P1) — Client Portal Enxuto**
*Reduz "Onde está minha proposta?" / "Quando começa?"*

**Rota `/portal/:customer_token`** (sidebar mobile-first, light mode):
- **My Proposals** — lista com status badges (Awaiting Approval / Approved / Expired)
- **My Invoices** — Payment Due / Paid + botão "Pay Now"
- **Project Status** — timeline visual (Approved → Scheduled → In Progress → Completed)
- **Request Visit** — formulário curto (já temos infra)
- ❌ **NÃO incluir** "Reviews" como item separado — já temos `/review-request` enviado por SMS pós-job

Token gerado por customer (não login) — mesmo padrão do PublicInvoice. Sem auth = zero fricção.

---

### **FASE 3 (P2) — Two-Way SMS Inbox** *(Adiar)*
**Por quê adiar:**
- Twilio + **10DLC registration** (A2P compliance) leva 2-4 semanas
- Custo recorrente ($1-15/mês + $0.0079/SMS)
- AXO já usa SMS via `sms:` link nativo (suficiente para volume atual)

**Quando reativar:** quando volume > 50 leads/mês ou contratar SDR.

---

## O Que NÃO Copiar do DripJobs

| Elemento DripJobs | Por quê descartar |
|---|---|
| Tema verde fluo + emojis 🎉 | Conflita com Senior Operator (navy/gold, sem hype) |
| "Booking Form" simples | `/project-wizard` qualifica melhor (rejeita budgets <$1.8k) |
| "Package Pricing" público | Estratégia AXO é consultiva — preço só após diagnóstico |
| Sidebar "Email Settings" no portal | Over-engineering para o estágio atual |

---

## Detalhes Técnicos

**Stack adicional Fase 1:**
- `react-signature-canvas` (~15KB) para assinatura digital
- Storage bucket novo: `proposal-signatures` (privado, signed URLs)
- Edge function: `accept-proposal` (valida token, salva signature, cria project, dispara notificação admin)

**Banco de dados:**
```sql
CREATE TABLE proposal_signatures (
  id uuid PK,
  proposal_id uuid FK,
  signer_name text,
  signature_url text,
  signed_at timestamptz,
  ip_address inet,
  user_agent text,
  payment_method text  -- 'check' | 'zelle' | 'stripe' (futuro)
);

ALTER TABLE proposals ADD COLUMN
  accepted_at timestamptz,
  selected_tier text,
  client_note text;  -- "Note from AXO" mostrado na public page
```

**RLS:** policy pública via token (igual `PublicInvoice`).

---

## Pergunta Antes de Implementar

Quer que eu execute apenas a **Fase 1 (Public Proposal + E-Sign sem Stripe)** agora, ou prefere também já incluir o **Client Portal mínimo (Fase 2)** no mesmo bloco?

