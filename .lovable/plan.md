
# Diagnóstico — 3 bugs no Admin

Investigação **read-only**. Nenhum arquivo foi alterado. Abaixo o root cause de cada bug e o que sugiro fazer para corrigir.

---

## Bug 1 — Flash de borda vermelha em Captação / Leads & Vendas / Pagamentos

### O que encontrei
Procurei em todas as 3 páginas + no `AdminLayout` + nos componentes filhos por classes `border-destructive`, `border-red-*`, `ring-destructive`, `ring-red-*` aplicadas com base em estado de loading. Os principais candidatos com borda vermelha condicional são:

- `src/pages/admin/components/LinearPipeline.tsx`
  - **L1577**: `isBlocked && "ring-2 ring-destructive/40 bg-destructive/5"` (card do lead)
  - **L1682, L1762**: `isBlocked && "border-destructive/40 bg-destructive/5"` (versões alternativas)
  - Usado em **Leads & Vendas** (`LeadsManager.tsx`).
- `src/components/admin/payments/MonthlyOverview.tsx:112` — `netBalance < 0 ? "border-destructive/30" : ...` (usado em **Pagamentos**, mas com `payments=[]` durante loading `netBalance = 0` → verde, então provavelmente não é esse).
- `src/components/admin/JobMarginDisplay.tsx:66-67` — `if (!jobCost) return 'border-destructive bg-destructive/10'` (renderiza vermelho quando `jobCost` ainda não carregou).
- `src/components/admin/LeadFollowUpAlert.tsx:115` — `status.isOverdue ? "bg-red-50 border-red-200" : ...` (em **Captação** dentro do `LeadControlModal`).

### Hipótese mais provável (preciso confirmar)
O padrão é o mesmo nos três casos: **componentes que decidem cor com base em dados que ainda não chegaram** (`leads=[]`, `jobCost=null`, `payments=[]`). No primeiro render, a condição "está vazio/atrasado/sem dados" cai em vermelho; depois que o fetch resolve, a condição muda e o vermelho some — daí o flash de ~1–2s.

O suspeito mais forte para **Leads & Vendas** é o `LinearPipeline` aplicando `isBlocked`/`isStale` em cards antes do SLA Engine recomputar.

### Antes de codar
A pista de "borda vermelha" pode ser em vários elementos diferentes. **Preciso de uma confirmação visual** (screenshot ou descrição: "borda no card inteiro?", "borda em cima da página?", "ring ao redor de quê?") para apontar a linha exata. Sem isso o risco de "corrigir o lugar errado" é alto.

### Fix proposto (depois de confirmar)
Padronizar os componentes problemáticos para **só aplicar estilo de "alerta" depois que `isLoading === false`** (cor neutra durante loading, cor de estado depois). Exemplo:
```tsx
className={cn("border", !isLoading && isBlocked && "border-destructive ring-2 ring-destructive/40")}
```

---

## Bug 2 — "Generating..." aparece por alguns segundos na aba Proposal mesmo já existindo proposal

### Root cause (confirmado)
Em `src/components/admin/ProposalGenerator.tsx`:

1. Estado inicial: `proposal = null` → o JSX cai no bloco `if (!proposal)` (L626) que mostra o card **"Generate Proposal"** com o botão.
2. No mount (L247-258) roda um `useEffect` que chama `fetchProjectData(projectId, { mode: 'direct', flatPrice: 0, readOnly: true })` para hidratar uma proposal existente.
3. Esse `fetchProjectData` seta `isLoading = true` enquanto roda (L130 do `useProposalGeneration.ts`).
4. O botão "Generate Proposal" (L655-660) usa o mesmo `isLoading` do hook:
   ```tsx
   {isLoading ? <><Loader2 .../>Generating...</> : 'Generate Proposal'}
   ```

Resultado: enquanto o `readOnly: true` está rodando para descobrir se já existe proposal, o usuário vê o card de "Generate" com o botão preso em **"Generating..."** — porque o `isLoading` é compartilhado entre o auto-load silencioso e a ação manual de gerar. Quando o fetch termina e `setProposal(data)` é chamado, o JSX troca para a preview da proposal existente.

### Fix proposto
Separar os dois estados:
- Adicionar um estado local `isHydrating` no `ProposalGenerator` que cobre só o auto-load do mount.
- Enquanto `isHydrating === true && !proposal`, renderizar um skeleton/spinner neutro (sem o card de "Generate" com botão "Generating...").
- O botão "Generate Proposal" continua usando `isLoading` apenas para o clique manual.

---

## Bug 3 — Layout em grid (DESCRIPTION | QTY | UNIT PRICE | TOTAL) empilha verticalmente

### Root cause (confirmado)
Em `src/components/admin/ProposalGenerator.tsx`:

- **Header da tabela (L790)**:
  ```tsx
  className="hidden sm:grid grid-cols-[24px_1fr_90px_110px_110px_36px] gap-2 ..."
  ```
- **Linha editável (L69, no `SortableLineRow`)**:
  ```tsx
  className="grid grid-cols-1 sm:grid-cols-[24px_1fr_90px_110px_110px_36px] gap-2 ..."
  ```

Ambos usam o breakpoint **`sm:` do Tailwind = 640px**. Abaixo de 640px de **largura do container**, o grid colapsa para `grid-cols-1` (uma coluna por inputs empilhados) e o header desaparece (`hidden sm:grid`).

Por que "alguns projetos sim, outros não": **não é o projeto** — é o **container onde o `ProposalGenerator` está renderizado**. Quando ele é aberto dentro de um `Sheet`/painel lateral, ou em viewport mobile (seu preview agora está em **585px**, abaixo de 640px), o grid colapsa. Em tela cheia ele aparece corretamente.

Observação: `sm:` no Tailwind é **viewport-based**, não container-based. Mesmo dentro de um sheet estreito num desktop largo, ele expande, porque olha pra `window.innerWidth`. Mas no mobile real ou em viewport <640 (como o seu agora) sempre colapsa.

### Fix proposto
Escolher uma das opções:

1. **Forçar grid em qualquer largura** (recomendado para desktop-only): remover o prefixo `sm:` e usar `grid-cols-[24px_1fr_90px_110px_110px_36px]` + `overflow-x-auto` no wrapper, para permitir scroll horizontal em telas estreitas em vez de empilhar.
2. **Manter empilhamento mobile mas mostrar labels embutidas** em cada input (`Qty:`, `Unit:`, `Total:`) — melhor UX em mobile real.
3. **Container queries** (`@container` do Tailwind v3.4+) para reagir à largura do painel/sheet em vez do viewport.

Recomendação: **opção 1** para o caso atual (admin é desktop-first; o preview pequeno é o caso mais comum onde isso quebra) com fallback de scroll horizontal.

---

## Próximos passos

1. Bug 2 e Bug 3 estão **confirmados** — posso implementar diretamente quando aprovar.
2. Bug 1 precisa de **confirmação visual** (qual elemento exatamente fica com a borda vermelha) para garantir que o fix vai no lugar certo. Posso aplicar o fix preventivo no `LinearPipeline` + `JobMarginDisplay` + `LeadFollowUpAlert` (gating de cor por `isLoading`) se preferir uma correção mais ampla.
