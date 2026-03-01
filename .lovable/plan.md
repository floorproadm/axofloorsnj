

# Redesign do Portal do Colaborador (FloorPro v1 Style)

Transformar o portal do colaborador atual (lista simples de projetos + upload de fotos) em uma experiencia mobile-first inspirada nos mockups FloorPro v1, com navegacao por abas, calendario semanal, checklist de tarefas e acoes rapidas.

## Estado Atual vs Destino

**Hoje**: 2 telas basicas (lista de projetos + detalhe com upload de fotos)
**Destino**: 4 abas (Home, Schedule, Docs, Profile) com UX de app nativo

## Implementacao

### 1. Layout com Bottom Navigation

Redesenhar `CollaboratorLayout.tsx` para incluir bottom nav com 4 abas: Home, Schedule, Docs, Profile. Header simplificado com logo "AXO Field" e icone de notificacao.

### 2. Home (Dashboard do Dia)

Redesenhar `CollaboratorDashboard.tsx` como dashboard operacional do dia:

- **Week Strip**: Calendario horizontal Mon-Fri mostrando a semana atual com contagem de jobs por dia e dia atual destacado
- **Today's Job Card**: Card principal com nome do job, endereco (MapPin), horario, e barra de progresso baseada nas tasks concluidas
- **Today's Tasks**: Checklist interativo usando a tabela `tasks` (via `related_project_id`), com checkbox para marcar concluido e strikethrough visual
- **Materials Section**: Lista de materiais do projeto com status de entrega (usando campo `notes` do projeto para dados estruturados inicialmente)
- **Quick Actions**: Dois botoes fixos no rodape - "Take Photo" (abre camera) e "Send Update" (abre formulario de mensagem)

Dados: Cruza `project_members` (user_id) com `appointments` (project_id + appointment_date = hoje) para identificar o job do dia.

### 3. Schedule (Agenda Semanal)

Nova pagina `CollaboratorSchedule.tsx`:

- **Week Navigator**: Header com setas esquerda/direita e "Week of [data]"
- **Daily Sections**: Lista vertical dos dias da semana, cada um com seus job cards
- **Job Card**: Nome do job, cliente, endereco, horario + duracao, contagem de membros, badge de status (scheduled/confirmed/pending)
- **Empty State**: "No jobs scheduled" para dias sem compromisso
- **"View Details"**: Link que navega ao detalhe do projeto

Dados: Query em `appointments` filtrado por projetos do colaborador (`project_members`) na semana selecionada.

### 4. Docs (Fotos do Projeto)

Mover a funcionalidade de upload/galeria que ja existe em `CollaboratorProjectDetail.tsx` para uma aba dedicada. Lista todos os projetos com suas fotos, agrupados.

### 5. Profile

Nova pagina simples `CollaboratorProfile.tsx` com nome do usuario, email, e botao de logout.

## Novas Rotas

```text
/collaborator          -> CollaboratorLayout (bottom nav)
  /collaborator        -> Home (dashboard do dia)
  /collaborator/schedule -> Schedule (agenda semanal)
  /collaborator/docs     -> Docs (fotos)
  /collaborator/profile  -> Profile
  /collaborator/project/:id -> Project Detail (mantido)
```

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/components/collaborator/CollaboratorLayout.tsx` | Reescrever - adicionar bottom nav com 4 abas |
| `src/pages/collaborator/CollaboratorDashboard.tsx` | Reescrever - week strip + today's job + tasks + quick actions |
| `src/pages/collaborator/CollaboratorSchedule.tsx` | Criar - agenda semanal com job cards por dia |
| `src/pages/collaborator/CollaboratorDocs.tsx` | Criar - galeria de fotos consolidada |
| `src/pages/collaborator/CollaboratorProfile.tsx` | Criar - perfil com logout |
| `src/hooks/useCollaboratorSchedule.ts` | Criar - hook para buscar appointments do colaborador |
| `src/App.tsx` | Editar - adicionar novas rotas do collaborator |

## Dados Existentes Utilizados

- `project_members` - vincular colaborador aos projetos
- `appointments` - compromissos com `project_id`, data, horario, duracao, status
- `tasks` - checklist com `related_project_id`
- `media_files` - fotos de progresso
- `projects` - dados do projeto (cliente, endereco, tipo)

Nenhuma migration necessaria - todas as tabelas ja existem.

