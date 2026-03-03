

## Plano: Botao "Nova Tarefa" no PartnerChecklist com Dialog Completo

### Problema
O componente `PartnerChecklist` atualmente usa apenas um input inline simples para criar tarefas. O usuario quer um botao estilo "Nova Tarefa" (como no Schedule) que abra um dialog completo com campos de prioridade, responsavel e prazo -- tudo vinculado ao parceiro via `related_partner_id`.

### Solucao

**Alterar `src/components/admin/PartnerChecklist.tsx`**:
1. Importar e integrar o componente `NewTaskDialog` existente (que ja aceita `relatedPartnerId`)
2. Substituir o input inline por um botao "Nova Tarefa" no header do checklist, ao lado do titulo "Tarefas"
3. O `NewTaskDialog` ja cria tarefas com todos os campos (titulo, descricao, prioridade, responsavel, prazo) e passa `related_partner_id` automaticamente
4. Manter a funcionalidade de toggle (checkbox) e delete existente
5. Invalidar queries `["tasks"]` e `["partner-checklist"]` no sucesso

### Detalhes tecnicos

- O `NewTaskDialog` ja tem prop `relatedPartnerId` -- basta passar `partnerId`
- O `onSubmit` do dialog vai chamar o `createTask` mutation local, adaptado para aceitar os campos extras (description, priority, assigned_to, due_date)
- As tarefas criadas aparecerao no Mission Control com o prefixo de parceiro porque possuem `related_partner_id` preenchido
- Layout: header com "Tarefas" a esquerda e botao "Nova Tarefa" a direita (estilo compacto ghost)

### Arquivos modificados
- `src/components/admin/PartnerChecklist.tsx` -- integrar `NewTaskDialog`, remover input inline, adicionar botao no header

