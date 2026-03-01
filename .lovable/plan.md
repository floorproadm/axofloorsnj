

# Job Checklist (Great Day Checklist)

Adicionar uma secao de checklist dentro do JobControlModal para que cada job tenha sua propria lista de tarefas operacionais (materiais, ferramentas, verificacoes pre-trabalho).

## Como funciona

- Uma nova secao "Checklist" aparece no JobControlModal, abaixo da secao "Quick Actions" e acima dos blocos expandiveis
- Lista todas as tasks vinculadas ao projeto via `related_project_id`
- Permite criar tasks rapidas inline digitando o titulo e pressionando Enter
- Marcar/desmarcar como concluido com um clique no checkbox
- Tasks concluidas ficam com texto riscado e opacidade reduzida

## Infraestrutura existente utilizada

- Tabela `tasks` no banco de dados (ja tem `related_project_id`)
- Hook `useTasks` existente em `src/hooks/useTasks.ts`
- Nao precisa de migration SQL -- a tabela ja suporta tudo

## Mudancas tecnicas

### 1. Novo componente: `src/components/admin/JobChecklist.tsx`

Componente isolado que encapsula toda a logica do checklist:
- Recebe `projectId` como prop
- Usa `useQuery` para buscar tasks onde `related_project_id = projectId`
- Usa `useMutation` para criar task inline (titulo + related_project_id)
- Usa `useMutation` para toggle status (pending <-> done)
- Input inline com placeholder "Adicionar item..." e submit com Enter
- Cada item renderiza: Checkbox + titulo (com strikethrough quando done)
- Mostra contador "X/Y concluidos"

### 2. Integracao no JobControlModal

No arquivo `src/pages/admin/JobsManager.tsx`:
- Importar `JobChecklist`
- Adicionar a secao entre "Quick Actions" e os blocos expandiveis (costs/proposal), em torno da linha 1162
- Visivel em ambos os modos (operational e executive)
- Card com estilo consistente: `rounded-xl border bg-card p-4`

### Arquivos

| Arquivo | Acao |
|---------|------|
| `src/components/admin/JobChecklist.tsx` | Criar (novo componente) |
| `src/pages/admin/JobsManager.tsx` | Editar (adicionar secao checklist no modal) |

