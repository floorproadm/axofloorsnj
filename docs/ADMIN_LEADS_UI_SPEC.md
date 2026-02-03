# ESPECIFICAÇÃO UI/UX: /admin/leads

> **Baseado em**: AXO_ADMIN_STATE_2026_02_03  
> **Data**: 2026-02-03  
> **Escopo**: APENAS visual/hierarquia — zero lógica  

---

## OBJETIVO DA TELA

Quando alguém abrir `/admin/leads`, deve responder em **10 segundos**:

| Pergunta | Onde encontra |
|----------|---------------|
| Quantos leads estão vivos agora? | Barra de resumo do pipeline |
| Onde estou perdendo dinheiro? | Cards de tensão |
| Quem exige ação HOJE? | Lista de ações obrigatórias |
| O que está bloqueado e por quê? | Indicadores inline + alertas |

---

## PARTE 1 — HIERARQUIA DE LEITURA

### Ordem Mental: TENSÃO → AÇÃO → DETALHE

```
┌─────────────────────────────────────────────────────────────────┐
│  PRIMEIRA DOBRA (acima do fold - 100vh)                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  BLOCO 1: ESTADO DO PIPELINE                              │  │
│  │  "Onde está o dinheiro agora"                             │  │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐              │  │
│  │  │ 12 │→│  8 │→│  5 │→│  3 │→│ 15 │ │  4 │              │  │
│  │  │Novo│ │Appt│ │Orç.│ │Prod│ │Done│ │Lost│              │  │
│  │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘              │  │
│  │  $24k    $18k   $42k   $31k   $89k                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  BLOCO 2: AÇÕES OBRIGATÓRIAS                              │  │
│  │  "O que você TEM que fazer agora"                         │  │
│  │                                                           │  │
│  │  🔴 3 leads parados há +48h — LIGAR AGORA                │  │
│  │  🔴 2 orçamentos sem follow-up — NÃO PODEM FECHAR        │  │
│  │  🟡 1 job sem fotos — BLOQUEADO PARA COMPLETED           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SEGUNDA DOBRA (scroll)                                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  BLOCO 3: LISTA OPERACIONAL                               │  │
│  │  "Todos os leads, um por um"                              │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │ 🔴 Maria Santos        ORÇAMENTO    $8,500    +72h  │ │  │
│  │  │    ⚠️ Sem follow-up registrado                      │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │ 🟡 João Pereira        VISITA       $4,200    +24h  │ │  │
│  │  │    Próximo: Agendar visita                          │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │ 🟢 Ana Costa           NOVO         $6,800    Hoje  │ │  │
│  │  │    Pronto para contato                              │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### O que fica COLAPSADO por padrão

| Elemento | Estado padrão | Motivo |
|----------|---------------|--------|
| Detalhes do lead | Colapsado | Só expande ao clicar |
| Histórico de follow-up | Colapsado | Contexto secundário |
| Leads "completed" | Oculto (filtro) | Não exige ação |
| Leads "lost" | Oculto (filtro) | Não exige ação |
| Metadados (source, criado em) | Inline mínimo | Não é prioritário |

---

## PARTE 2 — REDESIGN CONCEITUAL DO LAYOUT

### BLOCO 1: Estado do Pipeline
**Título visual**: "Onde está o dinheiro agora"

```
Estrutura:
┌──────────────────────────────────────────────────────────────┐
│  NOVO → VISITA AGENDADA → ORÇAMENTO → EM PRODUÇÃO → FECHADO │
│   12        8                5            3           15     │
│  $24k     $18k             $42k         $31k         $89k   │
│                             ↑                                │
│                        GARGALO AQUI                          │
│                     (maior valor parado)                     │
└──────────────────────────────────────────────────────────────┘
```

**Regras visuais**:
- Etapa com MAIOR VALOR em dinheiro = destaque amarelo (gargalo)
- Etapas com leads bloqueados = borda vermelha
- Valores em R$ sempre visíveis (budget agregado)
- Setas indicando fluxo linear obrigatório
- Não mostrar "completed" e "lost" na barra principal (são terminais)

**Interação**:
- Clicar no estágio = filtrar lista abaixo
- Nenhum drag-and-drop (pipeline é linear, sistema bloqueia)

---

### BLOCO 2: Ações Obrigatórias
**Título visual**: "O que você TEM que fazer agora"

```
Estrutura:
┌──────────────────────────────────────────────────────────────┐
│  🔴 CRÍTICO                                                  │
│  ├─ 3 leads parados há +48h — Ligar AGORA                   │
│  │   → Maria Santos, João Lima, Pedro Souza                 │
│  │                                                           │
│  ├─ 2 orçamentos SEM follow-up — Não podem avançar          │
│  │   → Ana Costa, Carlos Dias                               │
│  │   ⚠️ Regra: orçamento exige pelo menos 1 contato         │
│  │                                                           │
│  🟡 ATENÇÃO                                                  │
│  ├─ 1 job bloqueado por falta de fotos                      │
│  │   → Projeto #1234 (João Pereira)                         │
│  │   ⚠️ Regra: completed exige before+after                 │
└──────────────────────────────────────────────────────────────┘
```

**Regras visuais**:
- Alertas vermelhos SEMPRE no topo
- Cada alerta mostra: QUEM + POR QUE + O QUE FAZER
- Link direto para o lead/projeto afetado
- Se não houver alertas = mostrar "✅ Nenhuma ação crítica agora"

**Categorias de alerta** (ordem de prioridade):
1. Jobs travados (in_progress sem JobProof)
2. Orçamentos sem follow-up (proposal sem ação)
3. Leads parados +48h (qualquer etapa ativa)

---

### BLOCO 3: Lista Operacional
**Título visual**: "Todos os leads — um por um"

```
Estrutura de cada card:
┌──────────────────────────────────────────────────────────────┐
│  🔴│ MARIA SANTOS                    ORÇAMENTO     $8,500   │
│    │ 📍 Newark, NJ                                          │
│    │ ⚠️ Sem follow-up — Não pode avançar                    │
│    │                                    ┌─────────────────┐  │
│    │                                    │ VER DETALHES    │  │
│    │                                    └─────────────────┘  │
│    │ Parado há: 72h                          Fonte: Website │
└──────────────────────────────────────────────────────────────┘
```

**Regras visuais**:
- Indicador de status (cor) SEMPRE à esquerda
- Nome em destaque (maior, bold)
- Etapa do pipeline visível
- Valor do orçamento visível
- Tempo parado visível
- Bloqueio inline se houver
- Botão de ação principal visível

**Ordenação padrão**:
1. Leads bloqueados primeiro
2. Depois por tempo parado (maior primeiro)
3. Depois por valor (maior primeiro)

---

## PARTE 3 — SISTEMA DE SINAIS VISUAIS

### Definição de Estados

| Estado | Cor | Uso | Intensidade |
|--------|-----|-----|-------------|
| 🔴 BLOQUEADO | `hsl(0 84% 60%)` | Lead não pode avançar por regra | Border + Badge + Icon |
| 🟡 RISCO | `hsl(45 93% 47%)` | Lead parado, precisa atenção | Background leve + Icon |
| 🟢 OK | `hsl(142 76% 36%)` | Lead saudável, pode avançar | Icon apenas |
| ⚫ TERMINAL | `hsl(0 0% 45%)` | Completed ou Lost | Texto muted, sem destaque |

### Onde cada sinal aparece

```
BLOQUEADO (🔴)
├─ Barra do pipeline: borda vermelha no estágio
├─ Card do lead: barra lateral vermelha
├─ Badge: "BLOQUEADO" em vermelho
├─ Texto inline: "⚠️ Regra não cumprida: [motivo]"
└─ Botão de ação: desabilitado com tooltip explicativo

RISCO (🟡)
├─ Barra do pipeline: fundo amarelo claro no estágio
├─ Card do lead: ícone de alerta amarelo
├─ Badge: "+48h PARADO" em amarelo
└─ Ordenação: sobe para o topo da lista

OK (🟢)
├─ Card do lead: ícone verde discreto
├─ Botão de ação: ativo e destacado
└─ Sem badges extras (limpo)

TERMINAL (⚫)
├─ Card do lead: texto em cinza
├─ Oculto por padrão (filtro "Ativos")
└─ Sem ações disponíveis
```

### Regras de Bloqueio Visual (do checkpoint)

| Situação | Sinal | Texto |
|----------|-------|-------|
| Lead em "proposal" sem follow-up | 🔴 | "Registre um contato para avançar" |
| Lead em "proposal" sem projeto vinculado | 🔴 | "Vincule um projeto para enviar orçamento" |
| Projeto sem margem calculada | 🔴 | "Calcule a margem antes de enviar" |
| Projeto com margem < mínimo | 🔴 | "Margem abaixo do mínimo (X%)" |
| Projeto in_progress sem JobProof | 🔴 | "Envie fotos before/after para fechar" |
| Lead parado +48h | 🟡 | "Sem atualização há X dias" |
| Lead parado +24h | 🟡 | "Atenção: pode esfriar" |

---

## PARTE 4 — MICROCOPY (Linguagem de Dono de Flooring)

### Títulos e Labels

| Antes (genérico) | Depois (operacional) |
|------------------|----------------------|
| "Leads" | "Contatos" |
| "Pipeline" | "Caminho até o Dinheiro" |
| "Lead Status" | "Onde está esse dinheiro" |
| "Follow-up Required" | "Você precisa agir aqui" |
| "New Lead" | "Novo Contato" |
| "Appointment Scheduled" | "Visita Marcada" |
| "Proposal Sent" | "Orçamento Enviado" |
| "In Production" | "Em Produção" |
| "Completed" | "Job Fechado" |
| "Lost" | "Perdido" |
| "Actions" | "O que fazer" |
| "Details" | "Ver mais" |
| "Filter" | "Mostrar" |
| "Search" | "Buscar cliente" |
| "Export" | "Baixar lista" |

### Mensagens de Bloqueio

| Antes (técnico) | Depois (claro) |
|-----------------|----------------|
| "Transition blocked: follow_up_required" | "❌ Registre pelo menos 1 contato antes de avançar" |
| "Margin validation failed" | "❌ Margem muito baixa — ajuste o orçamento" |
| "JobProof incomplete" | "❌ Envie fotos do antes e depois para fechar" |
| "Invalid transition" | "❌ Siga a ordem: Novo → Visita → Orçamento → Produção → Fechado" |

### Mensagens de Sucesso

| Situação | Texto |
|----------|-------|
| Lead avançou de etapa | "✅ [Nome] avançou para [Etapa]" |
| Follow-up registrado | "✅ Contato registrado — agora pode avançar" |
| JobProof completo | "✅ Fotos enviadas — pode fechar o job" |
| Job fechado | "🎉 Job fechado! +$X no bolso" |

### Tooltips Educativos

| Elemento | Tooltip |
|----------|---------|
| Badge "BLOQUEADO" | "Este lead não pode avançar até você cumprir a regra indicada" |
| Etapa "Orçamento" | "Leads aqui precisam de pelo menos 1 follow-up para avançar" |
| Botão desabilitado | "Ação bloqueada: [motivo específico]" |
| Indicador +48h | "Lead sem atualização há mais de 2 dias — pode estar esfriando" |

---

## PARTE 5 — ESTADOS DE TELA (Edge Cases)

### Estado: Nenhum lead

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│     📭 Nenhum contato ainda                                  │
│                                                              │
│     Leads novos vão aparecer aqui quando                     │
│     alguém preencher o formulário do site.                   │
│                                                              │
│     Enquanto isso, você pode:                                │
│     → Adicionar um lead manualmente                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### Estado: Todos leads bloqueados

```
┌──────────────────────────────────────────────────────────────┐
│  🔴 ATENÇÃO: Todos os leads estão travados                   │
│                                                              │
│  Você tem 5 leads que não podem avançar.                     │
│  Resolva os bloqueios para liberar o dinheiro:               │
│                                                              │
│  → 3 orçamentos sem follow-up                                │
│  → 2 jobs sem fotos before/after                             │
│                                                              │
│  [VER DETALHES DE CADA UM]                                   │
└──────────────────────────────────────────────────────────────┘
```

---

### Estado: Follow-up vencido

```
Card do lead:
┌──────────────────────────────────────────────────────────────┐
│  🔴│ MARIA SANTOS                    ORÇAMENTO     $8,500   │
│    │                                                         │
│    │ ⏰ Follow-up vencido há 3 dias                          │
│    │ Você prometeu ligar em 30/01 — não ligou                │
│    │                                                         │
│    │ ┌────────────────────────────────────────────────────┐ │
│    │ │ 📞 REGISTRAR CONTATO AGORA                         │ │
│    │ └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

### Estado: Lead tentando ir para WON mas bloqueado

```
Modal de ação:
┌──────────────────────────────────────────────────────────────┐
│  ❌ BLOQUEADO: Não é possível fechar este job                │
│                                                              │
│  Antes de marcar como "Fechado", você precisa:               │
│                                                              │
│  ☐ Enviar foto do ANTES                                      │
│  ☐ Enviar foto do DEPOIS                                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📷 ENVIAR FOTOS AGORA                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Por que isso existe?                                        │
│  → Fotos são obrigatórias para garantir qualidade            │
│  → Elas também vão para sua galeria de projetos              │
└──────────────────────────────────────────────────────────────┘
```

---

### Estado: Lead saudável pronto para avançar

```
Card do lead:
┌──────────────────────────────────────────────────────────────┐
│  🟢│ ANA COSTA                       VISITA       $6,800    │
│    │ 📍 Jersey City, NJ                                      │
│    │ Visita agendada para amanhã às 10h                      │
│    │                                                         │
│    │ ┌────────────────────────────────────────────────────┐ │
│    │ │ ✅ MARCAR VISITA REALIZADA                         │ │
│    │ └────────────────────────────────────────────────────┘ │
│    │                                                         │
│    │ Próximo passo: Enviar orçamento                         │
└──────────────────────────────────────────────────────────────┘
```

---

### Estado: Tudo em dia (zero tensão)

```
┌──────────────────────────────────────────────────────────────┐
│  ✅ TUDO EM DIA                                              │
│                                                              │
│  Nenhum lead bloqueado.                                      │
│  Nenhum follow-up atrasado.                                  │
│  Nenhuma ação urgente.                                       │
│                                                              │
│  Continue acompanhando seus leads normalmente.               │
└──────────────────────────────────────────────────────────────┘
```

---

## PARTE 6 — TESTE FINAL DE QUALIDADE

### Pergunta crítica:

> **"Um dono de flooring com 2 funcionários entenderia essa tela sem treinamento?"**

### Checklist de validação:

| Critério | ✅ Atendido? |
|----------|-------------|
| Em 5 segundos sei quantos leads tenho | ✅ Barra de resumo visível |
| Em 10 segundos sei onde está o gargalo | ✅ Destaque no maior valor parado |
| Sei imediatamente o que está bloqueado | ✅ Cards vermelhos no topo |
| Sei exatamente O QUE fazer | ✅ Ações obrigatórias com nomes |
| Sei POR QUE algo está bloqueado | ✅ Texto inline explicativo |
| Não preciso perguntar "como avanço?" | ✅ Botões de ação claros |
| Não confundo com um CRM genérico | ✅ Linguagem de flooring |
| Entendo o fluxo linear | ✅ Setas no pipeline |

### Resposta final:

**SIM** — Um dono de flooring com 2 funcionários entenderia essa tela sem treinamento porque:

1. **Tensão vem primeiro** — Ele vê imediatamente o que está errado
2. **Ação é óbvia** — Cada bloqueio diz o que fazer
3. **Linguagem é dele** — "Job", "Orçamento", "Fechar" são termos do dia a dia
4. **Fluxo é visual** — Pipeline mostra o caminho do dinheiro
5. **Regras são explicadas** — Tooltips educam sem interromper

---

## RESUMO EXECUTIVO

| Antes | Depois |
|-------|--------|
| Lista de dados | Painel de controle |
| Tabela genérica | Fluxo operacional |
| Status sem contexto | Sinais com significado |
| Ações escondidas | Ações obrigatórias no topo |
| Termos de CRM | Linguagem de flooring |

---

**FIM DA ESPECIFICAÇÃO**

Este documento define APENAS visual/hierarquia.  
Nenhuma lógica, trigger ou regra foi alterada.  
Implementação deve seguir estas diretrizes SEM adicionar funcionalidades.
