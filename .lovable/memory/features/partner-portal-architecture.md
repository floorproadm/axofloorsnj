---
name: Partner Portal Architecture
description: Partner-facing portal at /partner/* lets partners send referrals, manage own profile and filter pipeline by stage. Email/password auth.
type: feature
---

# Partner Portal (MVP)

## Routes
- `/partner/auth` — Login dedicated to partners (email/password). Verifies the user is in `partner_users` table after sign-in; otherwise signs out.
- `/partner/dashboard` — Mobile-first dashboard with two tabs:
  - **Pipeline tab**: KPIs (Total/Conversion/Earned), commission rate banner, horizontal stage filter bar (click stage chip to filter), search input (name/phone/city), leads grouped by month.
  - **Profile tab**: Identity card with editable contact info (name, company, phone), lifetime stats (referrals/converted/rate), sign-out button.
- Header has persistent "+ New" button (always visible) opening NewReferralSheet.

## Components
- `src/components/partner/PartnerStageBar.tsx` — Horizontal scrollable chip bar with stage counts; hides empty stages unless active.
- `src/components/partner/PartnerLeadCard.tsx` — Single lead card with status badge + commission badge.
- `src/components/partner/PartnerProfileTab.tsx` — Profile view/edit + lifetime stats + logout.
- `src/components/partner/NewReferralSheet.tsx` — Bottom sheet form to submit a new lead.

## Database
- `partner_users` table links `auth.users.id` → `partners.id` (1:1 per partner). Created via SECURITY DEFINER function `link_partner_user(p_partner_id, p_user_id)`.
- Helper: `get_partner_id_for_user()` and `get_partner_org_for_user()` resolve the logged-in partner.
- RLS:
  - `partners SELECT`: parceiro lê o próprio registro (`partners_self_read`).
  - `partners UPDATE`: parceiro atualiza o próprio registro (`partners_self_update`) — usado pelo Profile tab.
  - `leads SELECT`: parceiro só lê leads onde `referred_by_partner_id = get_partner_id_for_user()`.
  - `leads INSERT`: parceiro pode inserir; trigger `enforce_partner_lead_defaults` força `lead_source='partner_referral'`, `referred_by_partner_id`, `organization_id`, `status='cold_lead'`, `priority='medium'`.

## Admin Invite Flow
- `InvitePartnerDialog` (chamado pelo botão "Manage Partner Portal Access" no `PartnerDetailModal`):
  1. Admin define email + senha inicial (com gerador automático).
  2. `supabase.auth.signUp` cria a conta.
  3. RPC `link_partner_user` vincula `user_id` ao `partner_id`.
  4. Admin compartilha credenciais manualmente (botão "Copy credentials").
- Sem signup público em `/partner/auth` — só admin convida.

## Comissões
- Calculadas client-side: `lead.budget * referral_commission_percent / 100` apenas quando `status='completed'`. `referral_commission_percent` vem de `company_settings` (default 7%).
