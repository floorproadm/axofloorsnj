

# Partner Detail: Tabs Condicionais + Tasks no Tab Notas

## Resumo
1. Apenas partners do tipo **builder** com status **active** ou **inactive** (e que tenham projetos vinculados) mostram a page completa (Geral, Projetos, Indicações, Notas).
2. Todos os outros tipos/statuses mostram apenas **Geral** e **Notas**.
3. No tab **Notas**, adicionar um botão **"Nova Tarefa"** que cria tasks vinculadas ao partner -- essas tasks aparecem automaticamente no **Mission Control** (Home).

## Mudanças no banco de dados

### Migration: Adicionar `related_partner_id` na tabela `tasks`
```sql
ALTER TABLE public.tasks
  ADD COLUMN related_partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;
```
Isso permite vincular tasks a partners, assim como ja existe `related_project_id` e `related_lead_id`.

## Arquivos modificados

### 1. `src/components/admin/PartnerDetailPanel.tsx`
- Adicionar logica condicional para mostrar tabs:
  - Se `partner.partner_type === 'builder'` E (`partner.status === 'active'` OU `partner.status === 'inactive'`) E tem projetos vinculados: mostrar todas as 4 tabs (Geral, Projetos, Indicações, Notas)
  - Caso contrario: mostrar apenas Geral e Notas
- No tab **Notas**, alem do `NotesEditor` existente, adicionar:
  - Seção "Tarefas" com lista de tasks vinculadas ao partner (`related_partner_id`)
  - Botão "Nova Tarefa" reutilizando o padrão do `NewTaskDialog` existente, passando `related_partner_id`
  - Lista de tasks com toggle de status (pending/in_progress/done) identica ao Mission Control

### 2. `src/hooks/useTasks.ts`
- Adicionar `related_partner_id` ao interface `Task` e `CreateTaskInput`
- Passar `related_partner_id` no `createTask` mutation

### 3. `src/components/admin/dashboard/NewTaskDialog.tsx`
- Aceitar prop opcional `related_partner_id` para pre-vincular a task ao partner
- Passar esse valor no `onSubmit`

### 4. `src/components/admin/dashboard/MissionControl.tsx`
- Nenhuma mudança necessaria -- ja exibe todas as tasks da tabela. Tasks criadas com `related_partner_id` aparecem automaticamente no Mission Control.

## Sugestao aceita: Contexto no Mission Control
Para melhorar a visibilidade, nas tasks que tiverem `related_partner_id`, mostrar o nome do partner como subtexto na `TaskRow` do Mission Control (igual ja faz com `assignee_name` e `due_date`). Isso requer um JOIN extra no `useTasks` para buscar o partner name.

## Fluxo do usuario
1. Abre partner detail de qualquer tipo (ex: Realtor) -- ve apenas Geral e Notas
2. Abre partner detail de um Builder ativo com projetos -- ve Geral, Projetos, Indicações, Notas
3. No tab Notas, clica "Nova Tarefa" -- abre dialog com titulo, prioridade, responsavel, prazo
4. Task criada aparece na lista dentro do tab Notas E no Mission Control do Dashboard

## Criterio de aceite
- Tabs condicionais funcionando corretamente por tipo + status
- Tasks vinculadas ao partner criadas e listadas no tab Notas
- Tasks aparecem no Mission Control automaticamente
- Coluna `related_partner_id` adicionada ao banco

