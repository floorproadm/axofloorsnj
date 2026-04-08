

# Criar Página "WOW Pack" — Pre-Visit Guide

## O que é
O HTML "AXO-WOW-PACK" é um guia pré-visita enviado para clientes antes do site visit. Conteúdo rico: história dos fundadores, Woody's Guarantee (30d/10yr/5yr), galeria before/after, guia de stains, processo 4 etapas, timeline de instalação, 3 pacotes (Silver/Gold/Platinum) e CTA com contato Eduardo.

## Mesmo problema dos outros HTMLs
- Dark mode com Playfair Display — fora do design system AXO
- Standalone HTML sem Header/Footer/componentes React
- Conteúdo excelente que deve ser migrado na paleta AXO (light mode, navy/gold, Montserrat/Roboto)

## Plano

### 1. Criar `src/pages/WowPack.tsx` — nova página `/wow-pack`
Seções migradas do HTML, todas na paleta AXO com componentes existentes (Card, Button, Header, Footer, ScrollReveal):

1. **Hero** — eyebrow "Your Personal Pre-Visit Guide", título, subtítulo, nota pessoal do Eduardo com avatar
2. **Our Story** — grid 2 colunas com cards Ademir (Owner) e Eduardo (GM), stats, blockquote
3. **Woody's Guarantee** — 3 cards (30 Days / 10 Years / 5 Years) com seals estilizados
4. **Transformations** — 4 cards before/after com gradientes simulando cores de piso, metadata de projeto
5. **Stain Guide** — grid 6 stains (Natural Oak, Classic Brown, Espresso, Whitewash, Warm Drift, Gunmetal) com swatches coloridos + nota de custom stain
6. **Our Process** — 4 steps numerados (Diagnostic, Materials, Execution, Finishing) com tags
7. **Installation Day** — grid 2 colunas: checklist "Before We Arrive" + timeline Day 1-4
8. **Investment Options** — 3 pacotes (Silver/Gold/Platinum) com badges, includes, e nota
9. **CTA** — card "What We Do During the Visit" com 4 itens + contato Eduardo + botão call

### 2. Atualizar `src/App.tsx`
- Adicionar rota `/wow-pack` → `WowPack`

### Detalhes Técnicos
- Reutilizar o `ScrollReveal` pattern já existente em `BuilderPartnerships.tsx`
- Stain swatches via `bg-gradient-to-br` com cores Tailwind/inline
- Before/after cards com gradientes inline simulando texturas de piso (mesmo approach do HTML)
- Pacotes Silver/Gold/Platinum com bordas e badges coloridos distintos
- Mobile responsive: grids colapsam para 1 coluna

### Arquivos
1. `src/pages/WowPack.tsx` — criar nova página completa
2. `src/App.tsx` — adicionar rota

