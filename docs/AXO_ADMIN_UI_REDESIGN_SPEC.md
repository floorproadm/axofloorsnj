# AXO ADMIN — ESPECIFICAÇÃO DE REDESIGN UI/UX

> **Base**: Checkpoint `AXO_ADMIN_STATE_2026_02_03`  
> **Objetivo**: Qualquer pessoa entende o sistema em 30 segundos  
> **Escopo**: APENAS visual, hierarquia e clareza. ZERO lógica nova.

---

## 1. MAPA VISUAL DO /ADMIN

### Estrutura Atual

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER                                   │
│  [Logo] [Título da Página] [User Menu]                          │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                       │
│          │   ┌─────────────────────────────────────────────┐    │
│          │   │         ALERTAS DE TENSÃO                   │    │
│  SIDEBAR │   │  (Leads sem resposta, Follow-up, JobProof)  │    │
│          │   └─────────────────────────────────────────────┘    │
│  • Home  │                                                       │
│  • Leads │   ┌─────────────────────────────────────────────┐    │
│  • Galeria│   │         CONTEÚDO PRINCIPAL                 │    │
│          │   │     (Pipeline, Cards, Formulários)          │    │
│          │   └─────────────────────────────────────────────┘    │
│          │                                                       │
└──────────┴──────────────────────────────────────────────────────┘
```

### Ordem Ideal de Leitura (Z-Pattern Adaptado)

```
   ①                    ②                    ③
┌──────┐         ┌──────────────┐      ┌──────────┐
│ ONDE │   →     │  O QUE ESTÁ  │  →   │ QUEM SOU │
│ ESTOU│         │   PEGANDO    │      │    EU    │
│      │         │    FOGO      │      │          │
└──────┘         └──────────────┘      └──────────┘
 Sidebar          Alertas Críticos      User Menu

         ④                         ⑤
   ┌──────────────┐         ┌──────────────┐
   │   ONDE       │    →    │  DETALHES    │
   │   AGIR       │         │  QUANDO      │
   │              │         │  EXPANDIR    │
   └──────────────┘         └──────────────┘
    Pipeline/Lista          Modais/Painéis
```

### Hierarquia: Primário vs Secundário

| PRIMÁRIO (Sempre Visível) | SECUNDÁRIO (Sob Demanda) |
|---------------------------|--------------------------|
| Alertas de bloqueio | Histórico de follow-ups |
| Stage atual de cada lead | Detalhes de contato |
| Contagem por etapa | Notas internas |
| Próxima ação obrigatória | Custos detalhados |
| Indicador de JobProof | Galeria de projetos |

---

## 2. REDESIGN CONCEITUAL POR PÁGINA

### 2.1 /admin (Home/Dashboard)

#### O que o usuário PRECISA VER PRIMEIRO

```
┌─────────────────────────────────────────────────────────────────┐
│                    🔴 PAINEL DE TENSÃO                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ 3 LEADS      │ │ 2 PROPOSTAS  │ │ 1 JOB        │            │
│  │ SEM RESPOSTA │ │ SEM FOLLOW   │ │ SEM FOTO     │            │
│  │ ⚠️ Crítico   │ │ ⚠️ Atenção   │ │ 🛑 Bloqueado │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

**Lógica Visual**:
- Número GRANDE (quantidade)
- Label de contexto (o que é)
- Indicador de urgência (cor + ícone)
- Clicável → vai direto pro item

#### O que pode ficar escondido
- Métricas de performance (conversão, receita)
- Gráficos históricos
- Configurações da empresa

#### Estados com destaque visual

| Estado | Tratamento Visual |
|--------|-------------------|
| Zero pendências | Card verde com ✓ "Tudo em dia" |
| 1-2 itens | Card amarelo, pulsação suave |
| 3+ itens | Card vermelho, borda animada |

---

### 2.2 /admin/leads (Pipeline de Vendas)

#### O que o usuário PRECISA VER PRIMEIRO

```
┌─────────────────────────────────────────────────────────────────┐
│  BARRA DE RESUMO DO PIPELINE                                    │
│  ┌────┐ → ┌────┐ → ┌────┐ → ┌────┐ → ┌────┐                    │
│  │ 5  │   │ 3  │   │ 2  │   │ 4  │   │ 12 │                    │
│  │NOVO│   │VISIT│   │PROP│   │EXEC│   │DONE│                    │
│  └────┘   └────┘   └────┘   └────┘   └────┘                    │
│                      ↑                                          │
│               [Etapa com bloqueio = destaque]                   │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│  LISTA DE LEADS (Agrupada por Etapa)                           │
│                                                                 │
│  ▼ NOVO LEAD (5)                                               │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ 🔴 João Silva     │ (201) 555-1234 │ há 3 dias │ [LIGAR]   │
│  │ 🟡 Maria Santos   │ (201) 555-5678 │ há 1 dia  │ [LIGAR]   │
│  └─────────────────────────────────────────────────────────────┘
│                                                                 │
│  ▼ PROPOSTA ENVIADA (2) ⚠️ FOLLOW-UP OBRIGATÓRIO               │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ 🛑 Carlos Lima    │ $8,500 │ 0 follow-ups │ [REGISTRAR]    │
│  │ ✅ Ana Costa      │ $12,000│ 2 follow-ups │ [AVANÇAR]      │
│  └─────────────────────────────────────────────────────────────┘
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### O que pode ficar escondido (dentro de modal/drawer)
- Endereço completo
- Histórico de notas
- Serviços solicitados detalhados
- Custos do projeto vinculado

#### Estados com destaque visual

| Estado | Indicador | Ação Visível |
|--------|-----------|--------------|
| Lead novo sem contato | 🔴 Bolinha vermelha | Botão "LIGAR" primário |
| Proposta sem follow-up | 🛑 Badge "Bloqueado" | Botão "REGISTRAR FOLLOW-UP" |
| Follow-up registrado | ✅ Check verde | Botão "AVANÇAR ETAPA" |
| Lead parado +48h | ⏰ Ícone relógio + amarelo | Highlight na linha |

---

### 2.3 /admin/leads — Detalhe do Lead (Modal)

#### Estrutura do Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  JOÃO SILVA                                    [Etapa: PROPOSTA]│
│  (201) 555-1234 | joao@email.com                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─── STATUS DO LEAD ───────────────────────────────────────┐  │
│  │                                                           │  │
│  │  ⚠️ BLOQUEIO ATIVO: Registre follow-up para avançar     │  │
│  │  [Botão: REGISTRAR FOLLOW-UP]                            │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─── PROJETO VINCULADO ────────────────────────────────────┐  │
│  │  Sanding & Refinish | 850 sqft | $8,500                  │  │
│  │  Margem: 32% ✅ (mín: 30%)                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─── HISTÓRICO ────────────────────────────────────────────┐  │
│  │  [Accordion fechado por padrão]                          │  │
│  │  • 3 notas | 0 follow-ups | Criado há 5 dias            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Cancelar]                              [Avançar para: ____]  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2.4 /admin/leads — Projeto em Execução

#### Indicação de JobProof

```
┌─────────────────────────────────────────────────────────────────┐
│  PROJETO: João Silva - Sanding & Refinish                       │
│  Status: EM EXECUÇÃO                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─── PROVA DE TRABALHO ────────────────────────────────────┐  │
│  │                                                           │  │
│  │  🛑 BLOQUEIO: Este job não pode ser finalizado           │  │
│  │                                                           │  │
│  │  ┌────────────┐    ┌────────────┐                        │  │
│  │  │            │    │            │                        │  │
│  │  │  📷 ANTES  │    │  📷 DEPOIS │                        │  │
│  │  │  ❌ Falta  │    │  ❌ Falta  │                        │  │
│  │  │            │    │            │                        │  │
│  │  └────────────┘    └────────────┘                        │  │
│  │                                                           │  │
│  │  [ENVIAR FOTOS]                                          │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Botão "FINALIZAR JOB" desabilitado e cinza]                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2.5 /admin/gallery

#### O que o usuário PRECISA VER PRIMEIRO

```
┌─────────────────────────────────────────────────────────────────┐
│  GALERIA DE TRABALHOS                          [+ NOVO PROJETO] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─── FILTROS ──────────────────────────────────────────────┐  │
│  │  [Todas] [Sanding] [Staining] [Vinyl] [Staircase]        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                   │
│  │ 📷     │ │ 📷     │ │ 📷     │ │ 📷     │                   │
│  │        │ │        │ │        │ │        │                   │
│  │ Newark │ │ Jersey │ │ Hobok..│ │ Union  │                   │
│  │ ⭐     │ │        │ │ ⭐     │ │        │                   │
│  └────────┘ └────────┘ └────────┘ └────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### O que pode ficar escondido
- Descrição completa do projeto
- Detalhes técnicos
- Opções de organização de pastas

---

## 3. SISTEMA DE SINAIS VISUAIS

### 3.1 Paleta de Estados

```
┌─────────────────────────────────────────────────────────────────┐
│                     ESTADOS DO SISTEMA                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🛑 BLOQUEIO (Ação impossível)                                 │
│     Cor: Vermelho escuro — hsl(0, 72%, 45%)                    │
│     Uso: JobProof faltando, margem abaixo do mínimo            │
│     Ícone: 🛑 ou ⛔                                             │
│     Texto: "BLOQUEADO" em caps                                  │
│                                                                 │
│  ⚠️ RISCO (Ação atrasada)                                      │
│     Cor: Âmbar/Laranja — hsl(38, 92%, 50%)                     │
│     Uso: Follow-up pendente, lead parado +48h                  │
│     Ícone: ⚠️ ou ⏰                                             │
│     Texto: "ATENÇÃO" ou "PENDENTE"                              │
│                                                                 │
│  ✅ SUCESSO (Condição satisfeita)                               │
│     Cor: Verde — hsl(142, 71%, 45%)                            │
│     Uso: Margem saudável, JobProof completo, follow-up feito   │
│     Ícone: ✅ ou ✓                                              │
│     Texto: "OK" ou "PRONTO"                                     │
│                                                                 │
│  🔵 NEUTRO (Aguardando)                                        │
│     Cor: Azul/Cinza — hsl(215, 20%, 65%)                       │
│     Uso: Estados intermediários, sem urgência                   │
│     Ícone: ○ ou •                                               │
│     Texto: Apenas label do estado                               │
│                                                                 │
│  ⚫ TERMINAL (Finalizado)                                       │
│     Cor: Cinza escuro — hsl(0, 0%, 35%)                        │
│     Uso: Completed, Lost (estados finais)                       │
│     Ícone: 🔒                                                   │
│     Texto: "FECHADO" ou "PERDIDO"                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Aplicação por Contexto

| Contexto | Estado | Cor | Comportamento |
|----------|--------|-----|---------------|
| Lead sem contato inicial | RISCO | Âmbar | Badge + destaque na linha |
| Lead +48h parado | RISCO | Âmbar | Ícone relógio + texto "há X dias" |
| Proposta sem follow-up | BLOQUEIO | Vermelho | Card com borda vermelha, botão obrigatório |
| Follow-up registrado | SUCESSO | Verde | Check ao lado do nome |
| Margem < mínimo | BLOQUEIO | Vermelho | Número em vermelho, tooltip explicativo |
| Margem >= mínimo | SUCESSO | Verde | Número em verde |
| JobProof incompleto | BLOQUEIO | Vermelho | Placeholder com X, botão upload |
| JobProof completo | SUCESSO | Verde | Thumbnails com check |
| Projeto completed | TERMINAL | Cinza | Linha com opacidade reduzida |
| Lead lost | TERMINAL | Cinza | Strikethrough no nome |

### 3.3 Hierarquia de Alertas

```
         ┌───────────────────┐
         │     BLOQUEIO      │  ← Maior prioridade
         │   (vermelho)      │     Impede ação
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │      RISCO        │  ← Média prioridade
         │    (âmbar)        │     Requer atenção
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │     SUCESSO       │  ← Confirmação
         │    (verde)        │     Pode prosseguir
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │     NEUTRO        │  ← Menor prioridade
         │    (cinza)        │     Informativo
         └───────────────────┘
```

---

## 4. MICROCOPY — LINGUAGEM DE OPERADOR

### 4.1 Títulos de Página

| Atual (Genérico) | Novo (Operacional) |
|------------------|---------------------|
| Dashboard | Painel de Tensão |
| Leads | Pipeline de Vendas |
| Gallery | Portfólio de Jobs |
| Settings | Configurações |

### 4.2 Labels de Status do Pipeline

| Atual | Novo (Flooring) |
|-------|-----------------|
| New Lead | Novo Contato |
| Appointment Scheduled | Visita Agendada |
| Proposal | Orçamento Enviado |
| In Production | Em Execução |
| Completed | Job Fechado |
| Lost | Perdido |

### 4.3 Botões de Ação

| Contexto | Atual | Novo |
|----------|-------|------|
| Primeiro contato | "Contact" | "Ligar Agora" |
| Agendar visita | "Schedule" | "Marcar Visita" |
| Criar proposta | "Create Proposal" | "Montar Orçamento" |
| Registrar follow-up | "Add Follow-up" | "Registrar Contato" |
| Enviar fotos | "Upload" | "Enviar Fotos do Job" |
| Finalizar | "Complete" | "Fechar Job" |
| Avançar etapa | "Move to next" | "Avançar" |

### 4.4 Mensagens de Bloqueio

| Bloqueio | Mensagem Atual | Mensagem Nova |
|----------|----------------|---------------|
| JobProof faltando | "Job proof required" | "📷 Envie fotos ANTES e DEPOIS para fechar este job" |
| Margem baixa | "Margin below minimum" | "💰 Margem de X% está abaixo do mínimo (Y%). Ajuste o preço." |
| Follow-up obrigatório | "Follow-up required" | "📞 Registre pelo menos 1 contato para avançar este lead" |
| Transição inválida | "Invalid transition" | "⚠️ Não é possível pular de [A] para [B]. Siga a ordem." |

### 4.5 Mensagens de Sucesso

| Contexto | Mensagem |
|----------|----------|
| Lead avançado | "Lead movido para [ETAPA] ✓" |
| Follow-up registrado | "Contato registrado ✓" |
| JobProof completo | "Fotos enviadas ✓ Job pode ser fechado" |
| Job finalizado | "Job fechado com sucesso! 🎉" |

### 4.6 Labels dos Cards de Tensão

| Card | Título | Subtítulo Zerado | Subtítulo com Itens |
|------|--------|------------------|---------------------|
| Leads sem resposta | Leads Novos | Todos contatados ✓ | X aguardando primeiro contato |
| Propostas sem follow | Orçamentos Pendentes | Todos acompanhados ✓ | X sem follow-up registrado |
| Jobs bloqueados | Jobs Travados | Nenhum bloqueio ✓ | X aguardando fotos |

### 4.7 Tooltips Educativos

| Elemento | Tooltip |
|----------|---------|
| Badge de etapa | "Este lead está na etapa [X] do pipeline" |
| Indicador de margem | "Margem = (Preço - Custo) / Preço × 100" |
| Ícone de bloqueio | "Esta ação está bloqueada. Clique para ver o motivo." |
| Botão JobProof | "Fotos obrigatórias para provar a qualidade do trabalho" |
| Contador de follow-ups | "Quantidade de contatos registrados após envio do orçamento" |

---

## 5. RESUMO EXECUTIVO

### Princípios de Design Aplicados

1. **Tensão primeiro**: O que está pegando fogo aparece no topo
2. **Bloqueio visível**: Vermelho + ícone + texto claro do porquê
3. **Ação óbvia**: Botão primário sempre mostra o próximo passo
4. **Detalhes sob demanda**: Informação secundária em accordion/modal
5. **Linguagem de piso**: Termos que o instalador/vendedor usa no dia

### Mudanças Visuais (Sem Lógica Nova)

| Componente | Mudança |
|------------|---------|
| Header | Título contextual por página |
| Cards de tensão | Cores por nível de urgência |
| Pipeline summary | Indicador de bloqueio por etapa |
| Lista de leads | Ícones de status inline |
| Modal de detalhe | Seção de bloqueio destacada |
| Botões | Texto acional específico |
| Mensagens de erro | Português + emoji + instrução |

---

**FIM DA ESPECIFICAÇÃO**

> Este documento define APENAS UI/UX.  
> Toda lógica permanece conforme checkpoint `AXO_ADMIN_STATE_2026_02_03`.
