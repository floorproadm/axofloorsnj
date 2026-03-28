

## Plano: 3 Melhorias no Dashboard Admin

### 1. 4º MetricCard — "Proposals"
- Buscar contagem de propostas com status `sent` ou `draft` da tabela `proposals`
- Adicionar um 4º `MetricCard` com ícone `FileText`, label "Proposals", value = contagem de propostas abertas, sub = valor total em pipeline
- Grid de 4 cards com `flex gap-3` (já funciona, só adicionar o 4º)

### 2. Mini calendário semanal
- Barra visual de 7 dias (Dom–Sab) entre a Agenda header e os cards de agenda
- Cada dia mostra a letra do dia + um dot indicator se tem appointments naquele dia
- Dia atual highlighted com bg accent
- Usa os dados de `weekAppointments` já disponíveis (contém `appointment_date`)
- Componente inline simples, sem novo arquivo

### 3. Recent Activity feed
- Nova query busca as últimas 10 atividades combinando:
  - `leads` criados recentemente (últimas 48h)
  - `proposals` com `sent_at` recente
  - `payments` com status `confirmed` recentes
- Combina, ordena por data, e mostra numa lista compacta com ícone por tipo + timestamp relativo (formatDistance)
- Nova section abaixo da Agenda com header "Recent Activity" + link "Ver tudo"

### Arquivos alterados
| Arquivo | Ação |
|---------|------|
| `src/pages/admin/Dashboard.tsx` | Adicionar 4º MetricCard, mini calendário, query de activity feed, nova section |

### Layout no desktop (lg)
No desktop, o layout atual é single-column. As 3 adições mantêm o mesmo padrão:
- 4 MetricCards em row
- Mission Control
- Agenda (com mini calendário no topo)
- Recent Activity (nova section)

