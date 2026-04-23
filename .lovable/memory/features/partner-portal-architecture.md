---
name: Partner Portal Architecture
description: Partner-facing portal at /partner/* lets partners send referrals and track commissions. Email/password auth.
type: feature
---

# Partner Portal (MVP)

## Routes
- `/partner/auth` — Login dedicated to partners (email/password). Verifies the user is in `partner_users` table after sign-in; otherwise signs out.
- `/partner/dashboard` — Mobile-first dashboard with KPIs (Total, Conversion, Earned), commission rate banner, list of referred leads with stage badges, and "New Lead" sheet.

## Database
- `partner_users` table links `auth.users.id` → `partners.id` (1:1 per partner). Created via SECURITY DEFINER function `link_partner_user(p_partner_id, p_user_id)`.
- Helper: `get_partner_id_for_user()` and `get_partner_org_for_user()` resolve the logged-in partner.
- RLS adicional:
  - `partners`: parceiro lê o próprio registro (`id = get_partner_id_for_user()`).
  - `leads`: parceiro só lê leads onde `referred_by_partner_id = get_partner_id_for_user()`.
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
