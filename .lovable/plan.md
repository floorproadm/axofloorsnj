

# Converter 2 HTMLs do Claude Code em Paginas React AXO

## Analise Comparativa

### O que o Claude Code fez (HTMLs)
- **Paleta**: Dark mode (#0f0f0c, #C9A84C gold) com Playfair Display + DM Sans
- **Estilo**: Minimalista editorial, cards escuros, bordas gold sutis, fade-in animations
- **GC Pack**: Subnav sticky, tabela de serviços, process steps, SLAs, billing 30/40/30, formulario de scope
- **Partner Program**: Tiers (Preferred/Strategic/Elite), segments por tipo, guarantees, CTA com contato

### O que o AXO já tem (React)
- **Paleta**: Light mode (navy #0B1426 + gold #FFCC00) com Montserrat + Roboto
- **Pages existentes**: `BuilderPartnerships.tsx` (rota `/builder-offer`) e `Realtors.tsx` (rota `/realtors`)
- **Componentes reutilizados**: Header, Footer, Hero, Button, Card — tudo no design system existente

### Problemas dos HTMLs
1. **Paleta completamente diferente** — dark mode com Playfair Display nao faz parte do design system AXO
2. **Standalone HTML** — nao reutiliza Header/Footer/componentes do React
3. **Conteudo excelente** — o copy, estrutura de seções e dados estão muito bons e devem ser aproveitados

## Plano

### 1. Reescrever `BuilderPartnerships.tsx` com conteudo do GC Pack
- Manter Header + Footer + paleta AXO (light mode, navy/gold, Montserrat/Roboto)
- Migrar todo o conteudo do GC Pack HTML: hero stats, value props (6 cards), tabela de serviços, 6-step process, SLAs com checkmarks, division of responsibility (AXO vs GC), communication protocol, billing 30/40/30, e formulário de scope
- Usar componentes existentes (Card, Button) com estilo AXO
- Scroll-reveal animations com IntersectionObserver (como ja existe nas outras pages)

### 2. Criar nova page `PartnerProgram.tsx` com conteudo do Partner Program
- Nova rota `/partner-program`
- Migrar: hero com pills, stats strip, segments grid (GC/Builders/Realtors/Architects/Property Managers), 3-step how it works, tiers (Preferred/Strategic/Elite), client experience promises, Woody's Guarantee (30d/10yr/5yr), CTA com contato Eduardo
- Tudo na paleta AXO light mode com componentes React existentes

### 3. Atualizar `Realtors.tsx`
- Linkar para a nova page `/partner-program` em vez de ter conteudo duplicado sobre tiers

### 4. Atualizar rotas em `App.tsx`
- Adicionar rota `/partner-program` → `PartnerProgram`

### Arquivos
1. `src/pages/BuilderPartnerships.tsx` — reescrever com conteudo GC Pack
2. `src/pages/PartnerProgram.tsx` — criar nova page
3. `src/App.tsx` — adicionar rota
4. `src/pages/Realtors.tsx` — ajuste menor de link

