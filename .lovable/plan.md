

## Sugestões de Melhoria — Pipeline de Vendas (`/admin/leads`)

### Sobre o nome da página

O título **"Pipeline de Vendas"** faz sentido técnico, mas para apresentar a outros donos de empresa de flooring pode soar abstrato. Sugestões:
- **"Leads & Vendas"** — mais direto
- **"Funil de Vendas"** — termo mais popular em português  
- **"Oportunidades"** — linguagem CRM moderna

### Melhorias de UI/UX propostas

**1. Barra de saúde do funil (Conversion Funnel Bar)**
- Adicionar uma barra visual horizontal mostrando a proporção de leads em cada estágio como segmentos coloridos
- Dá uma visão instantânea de onde os leads estão concentrados (gargalos ficam óbvios)

**2. Busca/filtro rápido por nome**
- Campo de busca no topo para localizar um lead específico rapidamente (hoje não existe)
- Essencial quando o pipeline cresce

**3. Indicadores de conversão entre estágios**
- Entre cada coluna do board, mostrar a taxa de conversão (ex: "65%" entre Cold Lead → Warm Lead)
- Permite identificar onde o funil perde mais leads

**4. Contador de dias médios por estágio**
- No header de cada coluna, mostrar "Avg: 3.2 dias" — tempo médio que leads ficam naquele estágio
- Identifica gargalos operacionais

**5. Ações rápidas no card com swipe (mobile)**
- No mobile, permitir swipe left no card para revelar ações (ligar, agendar, avançar)
- Evita ter que abrir o modal para ações simples

**6. Separar botões de ação por contexto**  
- Hoje todos os 4 botões (New Lead, Appt, Proposal, Request) têm o mesmo estilo `bg-primary`
- Diferenciar visualmente: "New Lead" como primary, os outros como `outline` ou `secondary`

**7. Modo "Atenção" — filtro de leads que precisam de ação**
- Botão toggle "Needs Action" que filtra apenas leads com alertas (stale, blocked, overdue follow-up)
- Para o dono ver rapidamente "o que preciso fazer agora"

### Arquivos alterados
| Arquivo | Ação |
|---------|------|
| `src/pages/admin/LeadsManager.tsx` | Renomear título |
| `src/pages/admin/components/LinearPipeline.tsx` | Funnel bar, busca, conversão entre estágios, avg days, botões diferenciados, filtro "Needs Action" |

### Impacto
Tudo visual/UX — sem mudança de lógica de backend ou pipeline.

