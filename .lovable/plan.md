

# Referral Booster — Sistema de Indicação Gamificado

## Visão Geral
Transformar a página estática de referral em um sistema funcional onde clientes criam conta, recebem link/QR code personalizado, indicam amigos e acumulam créditos por cada indicação convertida.

## Arquitetura

### 1. Database (3 novas tabelas)

**`referral_profiles`** — Perfil do indicador (cliente)
- `id`, `name`, `email`, `phone`, `referral_code` (único, ex: "AXO-SARAH-7K2"),  `qr_code_url`, `total_credits` (acumulado), `total_referrals`, `total_converted`, `created_at`
- RLS: public insert, own read/update

**`referrals`** — Cada indicação feita
- `id`, `referrer_id` (FK referral_profiles), `referred_name`, `referred_email`, `referred_phone`, `status` (pending / contacted / converted / expired), `lead_id` (FK leads, nullable), `credit_amount`, `credited_at`, `created_at`
- RLS: referrer can read own, admin all

**`referral_rewards`** — Histórico de créditos/resgates
- `id`, `referrer_id`, `referral_id` (nullable), `type` (credit / redemption), `amount`, `description`, `created_at`
- RLS: referrer can read own, admin all

### 2. Lógica de Créditos
- Cada indicação convertida (lead vira projeto) = crédito de 7-10% do valor do projeto
- Admin pode ajustar % via `company_settings` (novo campo `referral_commission_percent`, default 7)
- Créditos são aplicáveis em serviços futuros ou resgatáveis como gift card

### 3. Página Pública `/referral-program` (Redesign)
- **Formulário de cadastro**: Nome, email, telefone → gera `referral_code` automaticamente
- **Dashboard do indicador** (após cadastro):
  - Link personalizado com código (`axofloors.com?ref=AXO-SARAH-7K2`)
  - **QR Code** gerado dinamicamente (biblioteca JS, sem API externa)
  - **Cartão digital** compartilhável (imagem estilizada com logo + código)
  - Botões de share (WhatsApp, SMS, Email, Copy link)
  - **Painel de progresso**: indicações feitas, convertidas, créditos acumulados
  - **Barra de gamificação**: Tiers (Bronze 1-2 refs, Silver 3-5, Gold 6+) com badges visuais
- **Formulário de indicação**: Adicionar nome/telefone/email do amigo → cria registro em `referrals` e opcionalmente em `leads`

### 4. Integração com Pipeline Existente
- Quando lead é criado via referral link (`?ref=CODE`), o `referred_by` é linkado automaticamente
- Quando lead converte para projeto, trigger credita o referrer
- Admin vê indicações no painel de Partners/Leads

### 5. Admin — Novo tab ou seção em Partners
- Lista de referrers ativos com contagem e créditos
- Ação de "Resgatar crédito" (marcar como pago)
- Visão de ROI do programa

### 6. Componentes Novos
- `src/pages/ReferralProgram.tsx` — Redesign completo (cadastro + dashboard)
- `src/hooks/useReferralProfile.ts` — CRUD do perfil e indicações
- `src/components/referral/ReferralDashboard.tsx` — Painel pós-cadastro
- `src/components/referral/ReferralQRCode.tsx` — Gerador de QR
- `src/components/referral/ReferralCard.tsx` — Cartão digital
- `src/components/referral/ReferralTierBadge.tsx` — Badge de gamificação
- `src/components/referral/AddReferralForm.tsx` — Form para indicar amigo

### 7. QR Code
- Usar biblioteca `qrcode` (leve, sem API) para gerar QR em canvas/SVG
- QR aponta para `axofloors.com?ref=CODE`

### 8. Gamificação (Tiers)
```text
Bronze  ★       → 1-2 indicações convertidas
Silver  ★★      → 3-5 indicações convertidas  
Gold    ★★★     → 6-9 indicações convertidas
Diamond ★★★★    → 10+ indicações convertidas
```
Cada tier desbloqueia bônus visual (badge) e pode ter % maior de comissão.

### 9. Fluxo do Usuário
```text
Cliente acessa /referral-program
  → Cadastra nome/email/phone
  → Recebe código único + QR + link
  → Compartilha via WhatsApp/SMS/Email
  → Amigo acessa link → preenche formulário → vira lead
  → Admin converte lead → crédito automático ao referrer
  → Referrer vê créditos no dashboard
```

## Fora do Escopo (Fase 2)
- Push notifications para referrer
- Leaderboard público
- Integração com pagamento automático

