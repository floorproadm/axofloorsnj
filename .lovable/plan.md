

# Partner Hub — Upgrade Visual Completo (Nivel MaidPad)

Baseado na referencia do MaidPad, o painel de detalhes precisa de botoes de acao grandes e coloridos, info cards estruturados, avatar com cor por tipo, e uma hierarquia visual mais rica. A lista tambem precisa de mais informacao contextual.

## Mudancas no PartnerDetailPanel.tsx (reescrita major)

### Header Enriquecido
- Avatar maior (56px) com cor de fundo baseada no tipo do partner:
  - builder = blue, realtor = purple, gc = orange, designer = pink
- Nome + empresa em hierarquia clara com badges de status, tipo e zona
- Banner sutil "Em Risco" se sem contato ha 30+ dias
- Botao X para fechar (mobile) e Pencil para editar

### Quick Action Bar (estilo MaidPad)
- 3 botoes grandes em grid horizontal abaixo do header:
  - **Ligar** (Phone, fundo emerald) abre `tel:`
  - **Mensagem** (MessageSquare, fundo blue) abre `sms:`
  - **Email** (Mail, fundo amber) abre `mailto:`
- Cada botao com icone + texto, fundo colorido suave, hover escurecido

### Stats Row com Cards
- 3 cards individuais com icone, fundo colorido sutil e borda:
  - Indicacoes (Users, fundo blue)
  - Convertidos (TrendingUp, fundo green)
  - Conversao % (icone BarChart, fundo amber)

### Tab "Geral" — Info Cards em Grid
- Substituir linhas de texto por cards estruturados em grid 2 colunas:
  - "Ultimo Contato" com Calendar + indicador visual se > 30 dias (texto vermelho)
  - "Proxima Acao" com ArrowUpRight + data + nota
  - "Service Zone" com MapPin
  - "Tipo" com Building
  - "Criado em" com Calendar
- Botoes de acao (Editar, Registrar Contato, Excluir) permanecem abaixo

### Tab "Indicacoes" — sem mudancas estruturais (ja funciona bem)

### Tab "Notas" — sem mudancas estruturais

## Mudancas no PartnerListItem.tsx

- Adicionar contagem de indicacoes como subtexto ("X indicacoes")
- Data de ultimo contato relativa usando `formatDistanceToNow` do date-fns ("ha 3d")
- Se nunca contatado: "Sem contato" em texto vermelho suave
- Borda esquerda colorida para partners "em risco" (amber) ou "churned" (red)
- Avatar com cor baseada no tipo do partner (mesma paleta do detail panel)

## Mudancas no Partners.tsx

- Adicionar mini stats no topo da coluna esquerda (antes da busca):
  - 3 numeros em linha: "X ativos | Y em risco | Z indicacoes"
  - Compacto, sem ocupar muito espaco vertical

## Arquivos a Modificar

1. `src/components/admin/PartnerDetailPanel.tsx` — quick action bar, info cards, avatar colorido
2. `src/components/admin/PartnerListItem.tsx` — info contextual, borda de risco, avatar colorido
3. `src/pages/admin/Partners.tsx` — mini stats no header da lista

## Sem Alteracao

- `src/hooks/admin/usePartnersData.ts`
- `src/components/admin/NewPartnerDialog.tsx`
- Database schema
- Sidebar / rotas

## Detalhes Tecnicos

### Avatar Colors por Tipo
```text
builder:  bg-blue-500/15 text-blue-700
realtor:  bg-purple-500/15 text-purple-700
gc:       bg-orange-500/15 text-orange-700
designer: bg-pink-500/15 text-pink-700
```

### Quick Action Button Pattern
```text
<a href="tel:..." class="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 transition-colors">
  <Phone size=20 />
  <span class="text-xs font-medium">Ligar</span>
</a>
```

### Info Card Pattern
```text
<div class="bg-muted/30 rounded-lg p-3 border border-border/30">
  <div class="flex items-center gap-2 text-xs text-muted-foreground mb-1">
    <Icon size=14 /> Label
  </div>
  <p class="text-sm font-semibold">Value</p>
</div>
```

### At Risk Detection (reutilizado)
```typescript
const isAtRisk = partner.status === "active" &&
  (!partner.last_contacted_at ||
   !isAfter(new Date(partner.last_contacted_at), subDays(new Date(), 30)));
```

