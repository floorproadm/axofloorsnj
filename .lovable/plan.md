
# Referral Booster — Implementado ✅

## O que foi feito

### Database (Migration)
- **`referral_profiles`** — Perfil do indicador com `referral_code` único, contadores, créditos
- **`referrals`** — Cada indicação com status, link para lead, créditos
- **`referral_rewards`** — Histórico de créditos/resgates
- **`company_settings.referral_commission_percent`** — Campo novo (default 7%)
- RLS: public insert/read, admin all

### Frontend
- **`src/hooks/useReferralProfile.ts`** — Hook completo: register, lookup, addReferral, tiers
- **`src/components/referral/ReferralDashboard.tsx`** — Dashboard pós-cadastro com stats, share, QR, histórico
- **`src/components/referral/ReferralQRCode.tsx`** — QR code via `qrcode` lib (canvas)
- **`src/components/referral/ReferralTierBadge.tsx`** — Badge visual com progresso (Bronze→Diamond)
- **`src/components/referral/AddReferralForm.tsx`** — Form para indicar amigo (cria referral + lead)
- **`src/pages/ReferralProgram.tsx`** — Redesign completo com registro/login + dashboard

### Integração Pipeline
- **`src/utils/referral.ts`** — Utilitário `getReferralCodeFromURL()` + `buildReferralNotes()`
- **ContactForm** e **ContactSection** detectam `?ref=CODE` e marcam lead como `referral`
- Leads criados pelo formulário de indicação linkam automaticamente ao referrer

### Gamificação (Tiers)
- Starter → Bronze (1-2) → Silver (3-5) → Gold (6-9) → Diamond (10+)
- Barra de progresso visual + badges

## Fora do Escopo (Fase 2)
- Admin tab para gerenciar referrers e resgatar créditos
- Trigger automático de crédito quando lead converte
- Push notifications para referrer
- Leaderboard público
