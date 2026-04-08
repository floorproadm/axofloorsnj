

# Criar Página "Review Request" — Pedir Avaliação Pós-Projeto

## O que é
O HTML é uma página enviada ao cliente **após conclusão do projeto** para solicitar reviews no Google/Houzz/Facebook. Inclui:
- Hero com nota pessoal do Eduardo
- Cards de plataforma (Google preferido, Houzz, Facebook) com links diretos
- Tutorial step-by-step de como deixar review no Google
- **Draft Generator** — seleciona serviço + destaque + nome/cidade e gera texto pronto para colar
- Seção "Share Before & After" — WhatsApp/Instagram
- Referral CTA — indicar amigos
- Contact CTA Eduardo

## O que já temos vs. o que é novo

| Feature | Nosso sistema | HTML do Claude |
|---|---|---|
| ReviewsSection (público) | ✅ Exibe reviews estáticos na landing | Não exibe reviews, **pede** reviews |
| ReferralProgram page | ✅ Página completa de referral | HTML tem CTA simples |
| Google review link | ❌ Não temos | ✅ Link direto + tutorial |
| Draft generator | ❌ Não temos | ✅ Gera texto baseado em serviço/destaque |
| Copy to clipboard | ❌ Não temos | ✅ Copia draft para colar no Google |
| Photo sharing CTA | ❌ Não temos | ✅ WhatsApp + Instagram links |
| Post-project flow | ❌ Não temos nada pós-entrega | ✅ Página completa |

## Plano

### 1. Criar `src/pages/ReviewRequest.tsx`
Página pública (`/review-request`) na paleta AXO light mode com Header/Footer. Seções:

1. **Hero** — badge "Project Complete", título, nota pessoal Eduardo com avatar
2. **Platform Cards** — 3 cards (Google como "preferred", Houzz, Facebook) com links reais configuráveis
3. **How-To Steps** — 4 passos de como deixar Google review
4. **Draft Generator** — 2 selects (serviço, destaque) + 2 inputs (nome, cidade), gera texto em tempo real, botão "Copy Draft" + "Open Google Review"
5. **Share Photos** — 2 cards (WhatsApp/Text + Instagram @axofloors)
6. **Referral CTA** — card com chips de público-alvo + link para `/referral-program`
7. **Contact Eduardo** — card com tel + SMS

### 2. Atualizar `src/App.tsx`
- Adicionar rota `/review-request` → `ReviewRequest`

### Detalhes Tecnicas
- Draft generator usa state local (useState) com templates de texto por serviço/destaque
- Copy usa `navigator.clipboard.writeText` com fallback
- Toast de confirmacao via sonner
- ScrollReveal pattern identico ao WowPack/BuilderPartnerships
- Links Google/Houzz/Facebook ficam como constantes no topo (facil de trocar)
- Mobile responsive: platform grid colapsa para 1 coluna

### Arquivos
1. `src/pages/ReviewRequest.tsx` — criar
2. `src/App.tsx` — adicionar rota

