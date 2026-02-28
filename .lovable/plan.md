

## Mission Control -- Tarefas + Alertas Unificados

### Problema Atual
O dashboard mostra alertas automaticos (SLA, follow-ups) mas nao tem onde criar tarefas manuais, delegar para colaboradores ou acompanhar execucao. Tudo e efemero e sem responsavel.

### Solucao
Criar uma tabela `tasks` no banco e transformar a secao "Acoes Urgentes" do dashboard em um **Mission Control** com duas camadas:
1. **Alertas do Sistema** (automaticos, vindos do SLA engine -- como ja existe)
2. **Tarefas Manuais** (criadas pelo admin, delegaveis a colaboradores)

### Nova Tabela: `tasks`

| Coluna | Tipo | Default | Notas |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| title | text | NOT NULL | Descricao curta da tarefa |
| description | text | NULL | Detalhes opcionais |
| status | text | 'pending' | pending, in_progress, done |
| priority | text | 'medium' | low, medium, high, urgent |
| assigned_to | uuid | NULL | FK -> profiles.user_id |
| related_project_id | uuid | NULL | FK -> projects.id |
| related_lead_id | uuid | NULL | FK -> leads.id |
| due_date | date | NULL | Data limite |
| created_by | uuid | NOT NULL | auth.uid() |
| completed_at | timestamptz | NULL | |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | now() | |

RLS: admin full access, authenticated users can read tasks assigned to them.

### Mudancas no Dashboard

O dashboard atual fica com 3 blocos verticais:
1. **Metric Cards** (Pipeline, Semana, Leads) -- sem mudanca
2. **Mission Control** (substitui "Acoes Urgentes") -- 2 sub-secoes:
   - Alertas do Sistema (SLA breaches, leads sem contato, etc -- automatico)
   - Minhas Tarefas (tarefas manuais com status, assignee, due date)
3. **Agenda do Dia** -- sem mudanca

### Arquivos a Criar

1. **SQL Migration** -- Tabela `tasks` + RLS + trigger updated_at
2. **`src/hooks/useTasks.ts`** -- Hook com:
   - `useTasks()` -- lista tarefas (filtro por status/assignee)
   - `createTask` mutation
   - `updateTask` mutation (status, assignee)
   - `deleteTask` mutation
3. **`src/components/admin/dashboard/MissionControl.tsx`** -- Componente unificado com:
   - Secao de alertas automaticos (reutiliza dados existentes do `useDashboardData`)
   - Secao de tarefas manuais com cards compactos
   - Botao "+ Tarefa" inline para criacao rapida
4. **`src/components/admin/dashboard/NewTaskDialog.tsx`** -- Dialog para criar tarefa:
   - Titulo (obrigatorio)
   - Descricao (opcional)
   - Prioridade (low/medium/high/urgent)
   - Assignee (select de profiles)
   - Projeto/Lead vinculado (opcional)
   - Due date (opcional)

### Arquivos a Modificar

5. **`src/pages/admin/Dashboard.tsx`** -- Substituir bloco `PriorityTasksList` pelo novo `MissionControl`
6. **`src/contexts/LanguageContext.tsx`** -- Traducoes para labels de tarefas

### Design do Card de Tarefa

Cada tarefa aparece como um item compacto no Mission Control:

```text
[dot-color] [priority-icon] Titulo da tarefa          [avatar] [due]
```

- Dot color: urgente=vermelho, alta=amarelo, media=cinza
- Click abre quick-edit inline (toggle status, reatribuir)
- Swipe ou checkbox para marcar como done

### Fluxo para Agentes Externos

As tarefas ficam acessiveis via tabela `tasks` no banco. Um agente pode:
- Criar tarefas via INSERT
- Atualizar status via UPDATE
- Consultar pendencias via SELECT com filtros
- Vincular a leads/projetos existentes via `related_lead_id` / `related_project_id`

### Detalhes Tecnicos

- A secao de alertas continua usando `useDashboardData()` (sem duplicacao de queries)
- Tarefas manuais sao fetched com um `useQuery` separado na tabela `tasks`
- O componente `MissionControl` recebe ambos os datasets e renderiza unificado
- Assignee mostra avatar+nome do profile vinculado
- Tarefas concluidas ficam ocultas por default (toggle "Ver concluidas")

