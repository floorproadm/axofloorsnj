## Diagnóstico

O site hoje trata 4 serviços com peso igual e linguagem corporativa ("Premium Flooring Solutions", "Lifetime Structural Integrity"). O cliente leigo não sabe a diferença entre "Sanding & Refinishing" e "Hardwood Flooring" — e essas duas categorias confundem porque **S&F acontece nas duas** (em piso novo após instalação, e em piso velho como refinish).

A referência (1-Day Refinishing Newark) acerta em 3 coisas: foco brutal num serviço por página, linguagem direta de quem fala com dono de casa, e CTA repetitivo de orçamento online.

## Arquitetura nova: 3 Pilares

```text
MENU PÚBLICO
├── Refinishing          ← piso velho/existente (volume)
├── Installation         ← piso novo (ticket alto)
├── Staircase            ← diferencial competitivo
└── Gallery / About / Contact

RODAPÉ / SECUNDÁRIO
└── Vinyl Plank          ← sai do menu principal
```

Os 3 pilares têm peso visual igual na Home, mesma estrutura de página, mesmo padrão de CTA. Vinyl continua existindo (SEO) mas não compete por atenção.

## O que muda em cada página

### 1. Home (`src/pages/Index.tsx`)
- Seção de serviços: de **4 cards** para **3 cards** (Refinishing / Installation / Staircase) + linha "Also: Vinyl Plank" pequena abaixo
- Reescrever copy dos cards em linguagem de cliente: "Make old floors look brand new" em vez de "Restore your floors to like-new condition with a dustless, precision process"
- Manter o resto da Home (Hero, Process, Testimonials, CTA wizard) como está

### 2. `/refinishing` (renomear `/sanding-and-refinish`)
Página-âncora no estilo 1-Day. Estrutura:
- Hero: "Don't Replace Your Floors — Restore Them" + foto before/after grande + CTA único
- Seção "3 ways we refinish" (educativa, igual 1-Day):
  - **Sanding & Refinishing** — full sand + stain + finish
  - **Dustless Sanding** — same process, zero dust
  - **Complete Restoration** — boards damaged, includes repair
- Before/After gallery dominante (não card pequeno)
- Por que refinish em vez de replace: tabela curta (custo, tempo, sustentabilidade)
- FAQ educativo: "How much does it cost?", "How long does it take?", "Can I be home?", "How long until I can walk on it?"
- CTA final: Smart Estimate

### 3. `/installation` (renomear `/hardwood-flooring`)
- Hero: "New Hardwood Floors — Installed and Finished by One Team"
- Pitch principal: **diferencial é entregar piso novo + S&F na mesma jornada** (não tem que contratar instalador + lixador separado)
- Sub-seção: tipos (solid hardwood, engineered, prefinished vs unfinished)
- Timeline visual: Day 1 install → Day 2 sand → Day 3 stain → Day 4 finish
- FAQ: "Solid vs engineered?", "Prefinished vs site-finished?", "How long to walk on it?"

### 4. `/staircase` (mantém URL, reescreve)
- Hero: "Stairs That Become the Centerpiece"
- 4 sub-seções claras (resolve a confusão do catálogo):
  - **Refinish existing stairs** — same as floor refinish, but stairs
  - **New treads & risers** — replace worn steps
  - **Railings** — install or replace
  - **Balusters** — install or replace
- Cada sub-seção: 1 foto + 2 linhas + preço base ("From $X per step")
- FAQ + CTA

### 5. `/vinyl-plank` (mantém, despromove)
- Tira do menu principal, mantém no rodapé e na rota
- Sem mudança de conteúdo agora

### 6. Header (`src/components/shared/Header.tsx`)
- Menu Services dropdown: 3 itens em vez de 4 (Refinishing, Installation, Staircase)
- "Also Available: Vinyl Plank" como link menor no fim do dropdown

### 7. Footer (`src/components/shared/Footer.tsx`)
- Atualizar lista de links de serviço pra refletir os 3 pilares
- Vinyl Plank no rodapé como "Other Services"

## Padrão visual repetido nas 3 páginas-pilar

Todas seguem o mesmo esqueleto (consistência = confiança):

```text
1. Hero       → 1 frase de problema/solução + before/after ou foto real + 1 CTA
2. 3 opções   → educar sobre as sub-modalidades do serviço
3. Galeria    → before/after dominante (não card pequeno)
4. Por que    → tabela ou bullets curtos
5. Processo   → 3-4 passos visuais
6. FAQ        → 4-6 perguntas que cliente leigo realmente faz
7. CTA final  → Smart Estimate único
```

## Tom de voz (regra para todas)

- **Antes**: "Premium Flooring Solutions in New Jersey delivered with precision and care"
- **Depois**: "Old floors don't always need replacing. Most just need refinishing."
- Frases curtas, 1 ideia por linha, zero adjetivo de marketing vazio ("premium", "expert", "elegant" — só usar se a linha morrer sem)
- Manter Woody's Guarantee, 10-Year Warranty, 500+ Homes — esses são fatos, não fluff
- Respeitar minimum budgets (já em memória): $1.8k refinish, $3.5k install — mencionar em FAQ

## Detalhes técnicos

- Rotas: adicionar redirects 301 de `/sanding-and-refinish` → `/refinishing` e `/hardwood-flooring` → `/installation` no `App.tsx` (manter SEO)
- SEO: atualizar `SEOHead` title/description de cada página com keyword principal (Refinishing, Hardwood Installation, Staircase Renovation)
- Manter componente `Hero` compartilhado — só trocar props
- Antes/Depois: aproveitar `Portfolio` ou `MediaRenderer` existente, sem criar componente novo agora
- FAQ: usar `Accordion` do shadcn (já no projeto)
- Atualizar sitemap.xml com novas rotas

## Fora de escopo (não nesse plano)

- Não vou mexer em `/quiz`, `/floor-diagnostic`, `/contact`, lead magnets — funcionam
- Não vou redesenhar Header/Footer visualmente, só atualizar links
- Não vou criar páginas novas de localização (Newark, Jersey City) — fica pra fase 2 de SEO
- Não vou trocar imagens — uso as que já existem em `src/assets/`

## Entregáveis

1. `src/pages/Index.tsx` — seção de serviços de 4→3
2. `src/pages/Refinishing.tsx` (novo, baseado em SandingRefinish.tsx)
3. `src/pages/Installation.tsx` (novo, baseado em HardwoodFlooring.tsx)
4. `src/pages/Staircase.tsx` — reescrita com 4 sub-seções
5. `src/components/shared/Header.tsx` — menu atualizado
6. `src/components/shared/Footer.tsx` — links atualizados
7. `src/App.tsx` — novas rotas + redirects
8. `public/sitemap.xml` — URLs novas

## Ordem de execução sugerida

Por ser grande, recomendo quebrar em 3 mensagens:
- **Msg 1**: Refazer `/refinishing` (página-âncora, valida o padrão)
- **Msg 2**: Aplicar mesmo padrão em `/installation` e `/staircase`
- **Msg 3**: Home + Header + Footer + redirects + sitemap

Se aprovar, começo pela Msg 1.
