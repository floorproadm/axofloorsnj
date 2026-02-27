

# Partner Hub — Redesign Master-Detail (Estilo MaidPad)

## Problema
A tela atual de Partners usa um layout de lista simples + modal de detalhes. Comparado ao MaidPad (referencia enviada), falta a experiencia de **master-detail lado a lado**: lista de parceiros na esquerda, painel de detalhes com abas na direita.

## Nova Arquitetura Visual

```text
Desktop (>=768px):
+-------------------+----------------------------------+
| Lista Partners    |  PARTNER DETAIL                  |
| [Busca]           |  Nome / Empresa / Status         |
| [+ Novo Partner]  |  Phone / Email / #ID             |
| [Filtros]         |  [N] Partner Notes        [+]    |
|                   |                                  |
| * Alice Smith  >  |  [Geral] [Indicacoes] [Notas]    |
|   John's Friend   |                                  |
| * Bob Builder  >  |  (conteudo da aba ativa)         |
| * Carlos GC    >  |                                  |
|                   |                                  |
+-------------------+----------------------------------+

Mobile (<768px):
Lista full-width -> ao clicar, abre painel de detalhe
(sheet/drawer de baixo ou navegacao inline)
```

## O Que Muda

### 1. Partners.tsx — Layout Master-Detail
- Substituir layout de lista unica + modal por layout de **duas colunas** (desktop)
- **Coluna esquerda** (~320px, fixa): busca, filtros compactos, botao "+ Novo Partner", lista scrollavel de partners com indicador de selecao ativa
- **Coluna direita** (flex-1): painel de detalhes inline (sem modal)
- **Mobile**: lista full-width; ao selecionar, mostra detalhe via Drawer (vaul) ou navegacao condicional
- Stats cards movidos para o topo do painel direito ou removidos (foco no detalhe)

### 2. Coluna Esquerda — Lista de Partners
- Cada item mostra: nome do contato, empresa (subtitulo), icones de acao rapida (telefone, email)
- Status indicator (bolinha colorida ao lado do nome)
- Ordenacao por nome (default) com dropdown para trocar
- Item selecionado com fundo highlight (como MaidPad azul/roxo)
- Scroll area independente da coluna direita

### 3. Coluna Direita — Painel de Detalhes com Abas
**Header do Partner:**
- Avatar placeholder com iniciais
- Nome grande + empresa + status badge
- Email e telefone clicaveis (tel: e mailto:)
- ID do partner (#numero)
- Botao de editar (icone de lapis)

**Notas do Partner (collapsible):**
- Contador de notas + botao expandir

**Abas (Tabs):**
- **Geral**: dados cadastrais, service zone, tipo, datas (ultimo contato, proxima acao), acoes (editar, registrar contato, excluir)
- **Indicacoes**: lista de leads referidos por este partner (query em `leads` filtrando por `referred_by_partner_id`), stats de conversao
- **Notas**: historico de notas/observacoes sobre o relacionamento

### 4. PartnerDetailPanel.tsx (novo componente)
- Substitui o `PartnerDetailModal.tsx` (modal removido)
- Renderizado inline na coluna direita
- Usa Tabs do Radix UI para as abas
- Inclui toda a logica de edicao inline que ja existe

### 5. PartnerListItem.tsx (novo componente)
- Componente de item da lista lateral
- Mostra: avatar (iniciais), nome, empresa, status dot, icones de telefone/email como acoes rapidas
- Estado selected com highlight visual

### 6. Mobile Experience
- Em telas < 768px, a lista ocupa 100% da largura
- Ao selecionar um partner, o detalhe abre em um Drawer (vaul) que sobe de baixo
- Botao de voltar no header do drawer para retornar a lista

## Arquivos

### Criar
- `src/components/admin/PartnerDetailPanel.tsx` — painel de detalhes com abas (substitui modal)
- `src/components/admin/PartnerListItem.tsx` — item compacto da lista lateral

### Modificar
- `src/pages/admin/Partners.tsx` — reescrever layout para master-detail com duas colunas
- `src/components/admin/PartnerDetailModal.tsx` — pode ser removido ou mantido como fallback

### Sem alteracoes
- `src/hooks/admin/usePartnersData.ts` — hook permanece igual
- `src/components/admin/NewPartnerDialog.tsx` — dialog de criacao permanece igual
- Sidebar, rotas, banco de dados — sem mudancas

## Detalhes Tecnicos

### Responsive Strategy
- Desktop: `flex` com `w-[340px]` para coluna esquerda e `flex-1` para direita
- Separador vertical entre colunas
- Mobile: `useIsMobile()` hook para alternar entre layout side-by-side e drawer
- ScrollArea independente para cada coluna no desktop

### Tabs Implementation
- Usar `@radix-ui/react-tabs` (ja instalado via shadcn)
- Tab "Geral" mostra dados atuais do partner detail
- Tab "Indicacoes" faz query: `supabase.from("leads").select("*").eq("referred_by_partner_id", partner.id)`
- Tab "Notas" mostra campo de notas editavel

### Quick Actions na Lista
- Icone de telefone: `<a href="tel:...">`
- Icone de mensagem/email: `<a href="mailto:...">`
- Click no item inteiro: seleciona para o painel direito
