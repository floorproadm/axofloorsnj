
# Crews & Fleet — Estado Atual do Codebase

Análise feita para entender o ponto de partida antes de construir um **Crew Scheduling** dedicado. Esta resposta é só leitura/diagnóstico — nada será implementado nesta etapa.

---

## 1. Banco de dados (Supabase)

### Tabelas que JÁ existem e formam a base de crews

| Tabela | Função | Observações |
|---|---|---|
| `profiles` | Catálogo de crew members | Campos relevantes: `full_name, role, daily_rate, employment_type, region, is_active_crew, bio, avatar_url`. **Não há tabela `crew_members` separada** — todo crew vive em `profiles`. |
| `project_members` | Vínculo permanente de um colaborador a um projeto | `(project_id, user_id, role)` com role `collaborator | manager | client`. Criado na Fase 6 (Portal do Colaborador). É o que dá acesso ao chat, uploads, schedule do collaborator. |
| `appointments` | Compromissos no calendário | Tem `assigned_to uuid[]` (array desnormalizado) **e** suporta a tabela filha abaixo. |
| `appointment_assignees` | Assignment N:N de profiles a appointments | `(appointment_id, profile_id)`. RLS por org. **Existe, mas o app só usa `appointments.assigned_to` (array) hoje** — não vi nenhum INSERT em `appointment_assignees` no código de UI. |
| `labor_entries` | Pagamentos/dias trabalhados | `(project_id, crew_member_id, worker_name, daily_rate, days_worked, work_date, is_paid)`. É o lastro financeiro do crew. |
| `view_crew_earnings` | View agregada | Usada em CrewsVans/Payroll. |

### Tabelas que NÃO existem (gaps para scheduling)
- Nenhuma tabela `vans` / `vehicles` / `fleet` real — "Vans" no admin é só um filtro de `payments WHERE category='fleet'`.
- Nenhuma tabela de **availability** / **time off** / **PTO** / **vacation** / **shift**.
- Nenhuma tabela de **crew assignment a projeto com janela de tempo** (start/end date por crew em um job). Hoje o "assign" é via `appointments.assigned_to` por evento ou `project_members` permanente, sem datas.
- Nenhum conceito de **capacity** (quantos crews por dia, max jobs simultâneos).

---

## 2. Componentes React e Hooks

### Páginas
- **`src/pages/admin/CrewsVans.tsx`** (801 linhas) — hub atual, 3 abas via `?tab=`:
  - **`crew`**: lista de profiles (CRUD via dialog), filtros por região/role/employment_type.
  - **`vans`**: lista derivada de `payments.category='fleet'` (não é fleet real).
  - **`payroll`**: `labor_entries` agregadas por período, mark-paid, novo lançamento manual.
- **`src/pages/admin/LaborPayroll.tsx`** (382 linhas) — versão alternativa/legada de payroll. Rota `/admin/labor-payroll` existe.
- **`src/pages/admin/Schedule.tsx`** (1123 linhas) — calendário de **appointments**. Tem o picker "Equipe Designada" que escreve em `appointments.assigned_to` (array). É aqui que mora a única lógica de "agendar crew" hoje.

### Componentes
- **`src/components/admin/crew/CrewMemberPicker.tsx`** — combobox + quick-add usado dentro de Labor entries (`LaborForm`, JobDetail). Não tem variante multi-select nem mostra disponibilidade.
- **`src/components/admin/settings/TeamSettings.tsx`** — gestão de `project_members` (vincula user a projeto, permanente).
- **`src/components/admin/projects/ProjectDetailPanel.tsx`** — mostra `project_members` no painel lateral de projeto.

### Hooks
- **`useCrewMembers`** — lista `profiles` (com filtro `is_active_crew`).
- **`useCrewEarnings`** — view agregada.
- **`useLaborEntries` / `useAllLaborEntries` / `useAddLaborEntry` / `useMarkLaborPaid` / `useDeleteLaborEntry`**.
- **`useQuickAddCrewMember`** — cria profile minimal.
- **`useCollaboratorSchedule`** — *do lado do colaborador*: lê `appointments` da semana onde `project_id ∈ projetos do user via project_members`. **Esse é o canal pelo qual o crew "vê" sua agenda hoje.**

### Rotas existentes
```
/admin/crews          → CrewsVans (tabs: crew | vans | payroll)
/admin/labor-payroll  → LaborPayroll (legada)
/admin/schedule       → Schedule (appointments com assigned_to[])
/collaborator/schedule → CollaboratorSchedule (read-only do crew)
```

---

## 3. Lógica de scheduling/assignment que JÁ existe

Existe parcial, em 3 camadas desconectadas:

1. **`appointments.assigned_to[]`** (multi-select de profiles por evento) — escrita em `Schedule.tsx` via "Equipe Designada". É o mais próximo de "agendar crew em um job".
2. **`project_members`** (vínculo permanente sem datas) — usado para Portal do Colaborador (chat, uploads, ver appointments do projeto).
3. **`labor_entries.work_date + crew_member_id`** — registro **a posteriori** de quem trabalhou em que dia. Funciona como "schedule histórico" mas não é planejamento.

### O que NÃO existe (gaps reais para Crew Scheduling)
- Visão **calendar por crew member** (quem está fazendo o quê em cada dia).
- Visão **timeline por projeto** com janelas de execução (start/end por crew).
- **Detecção de conflito** (mesmo crew em 2 jobs no mesmo dia/horário).
- **Disponibilidade** (PTO, day off, capacidade diária).
- **Drag-and-drop** para reagendar/reatribuir.
- **Sync com `labor_entries`** (auto-gerar labor entry quando crew completa um dia agendado).
- Tabela `appointment_assignees` existe mas está **órfã** (UI nunca grava nela; é o lugar "limpo" para multi-assign caso queiramos migrar do array).

---

## 4. Recomendação de ponto de partida

Quando você quiser implementar Crew Scheduling, decisões-chave a fechar antes:

1. **Modelo**: estender `appointments` (já tem date+time+assigned_to+project_id, é o caminho mais rápido) **ou** criar uma tabela nova `crew_assignments(project_id, crew_member_id, start_date, end_date, status)` para planejamento de janelas multi-dia independente de eventos pontuais?
2. **Migrar `assigned_to[]` → `appointment_assignees`** (tabela já existe com RLS pronta) para permitir queries por crew member sem `unnest`.
3. **Capacity/disponibilidade**: criar `crew_unavailability(crew_member_id, start_date, end_date, reason)`?
4. **Onde mora a UI**: nova aba `schedule` dentro de `/admin/crews` (timeline por crew) ou nova view dentro de `/admin/schedule` (toggle "By Day | By Crew | By Project")?

Posso seguir com um plano de implementação assim que você definir o modelo (#1) e a localização da UI (#4).
