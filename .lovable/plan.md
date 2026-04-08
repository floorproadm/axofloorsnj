

# Análise: AXO-ESTIMATE.html e AXO-PROPOSAL.html vs. Sistema Atual

## O que o Claude Code criou (2 HTMLs — você disse 3, mas recebi 2)

### 1. AXO-ESTIMATE.html — Calculadora de Orçamento
- Layout 2 colunas: inputs à esquerda, resultado sticky à direita
- 4 service types: Refinishing, Installation, Vinyl, Custom Quote
- 3 tiers: Silver/Gold/Platinum com rate tables detalhados (price/sqft + cost/sqft + materials fraction)
- Add-ons: Staircase ($95/step), Baseboards ($8/lin ft), Water Damage ($12/sqft)
- Rate overrides: permite sobreescrever price/sqft, cost/sqft, labor rate
- Result card: preço sugerido, breakdown (labor/materials/addons/total cost/profit), margin gauge com gate 30%, duração estimada
- "Copy Estimate Text" — gera texto formatado para WhatsApp/SMS

### 2. AXO-PROPOSAL.html — Gerador de Proposta (client-facing)
- Painel gerador no topo: preenche dados do cliente, sqft, espécie, timeline, preços dos 3 tiers
- Documento bonito abaixo: hero, site assessment, AXO Transformation Method (4 fases), 3 tier cards (Silver/Gold/Platinum), timeline, Woody's Guarantee, CTA Eduardo
- Print/PDF ready

---

## O que JÁ TEMOS no sistema AXO

| Feature | Nosso sistema | HTML do Claude |
|---|---|---|
| **QuickQuoteSheet** | ✅ 3-step wizard (sqft → addons → tiers Good/Better/Best), salva proposal + cria customer/project | Não salva nada, é standalone |
| **ProposalGenerator** | ✅ Gera preview + print com 3 tiers, puxa dados do projeto | Similar mas nosso é integrado ao DB |
| **Proposals page** | ✅ Lista + Board pipeline (Draft→Sent→Viewed→Accepted→Declined), edição inline, toggle tiers/flat price | HTML não tem gestão |
| **EstimateDetailsSheet** | ✅ Sheet com detalhes de cada proposta | HTML não tem |
| **Margin validation** | ✅ Via useProposalValidation | HTML tem margin gauge visual |
| **Rate tables** | ❌ Hardcoded simples no QuickQuote | ✅ HTML tem tabelas completas por serviço × tier |
| **Breakdown visual** | ❌ Não temos | ✅ HTML tem labor/materials/addons separados |
| **Margin gauge** | ❌ Não temos gauge visual | ✅ HTML tem barra de progresso + gate pass/warn/fail |
| **Copy estimate text** | ❌ Não temos | ✅ HTML gera texto para WhatsApp |
| **Rate overrides** | ❌ Não temos | ✅ HTML permite override de price e cost per sqft |
| **Proposal document** | Básico (print window com CSS inline) | ✅ HTML tem documento profissional com seções ricas |
| **Duration estimate** | ❌ Não temos | ✅ HTML calcula dias estimados |
| **Vinyl/Custom types** | ❌ Só refinishing/installation/repair | ✅ HTML tem vinyl + custom quote mode |

---

## O que vale aproveitar (gargalos do nosso sistema)

### Prioridade Alta — melhorias concretas
1. **Rate tables completas** — nosso QuickQuote usa rates simplistas. O HTML tem price/cost/materials separados por serviço × tier
2. **Breakdown visual no resultado** — mostrar labor, materials, addons, profit separadamente
3. **Margin gauge** — barra visual com gate pass/warn/fail no QuickQuote step 3
4. **Copy estimate text** — botão para copiar texto formatado para WhatsApp/SMS
5. **Duration estimate** — calcular dias estimados baseado em sqft

### Prioridade Média
6. **Rate overrides** — permitir override manual de price/sqft e cost/sqft
7. **Vinyl + Custom service types** — adicionar ao QuickQuote
8. **Proposal document melhorado** — melhorar o print/PDF com as seções ricas (assessment, method, guarantee, CTA)

### Já temos e é melhor
- Pipeline de propostas com board Kanban
- Integração com DB (customer, project, job_costs)
- Edição inline de propostas
- Toggle tiers/flat price
- Lead → Proposal → Project flow completo

---

## Plano recomendado

Não vale criar páginas novas — vale **enriquecer o QuickQuoteSheet e o ProposalGenerator** com as boas ideias dos HTMLs:

1. **Upgrade QuickQuoteSheet** — rate tables reais, breakdown visual, margin gauge, duration, copy text, vinyl/custom types
2. **Upgrade ProposalGenerator print** — documento profissional com seções do HTML (assessment, method, guarantee, CTA)

Quer que eu faça um plano detalhado de implementação para algum desses upgrades?

