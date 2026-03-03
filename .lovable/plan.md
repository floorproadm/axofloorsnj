
# Partner Detail: Visão Simplificada no Pipeline + Melhorias em Notas

## O que muda

### 1. Ocultar KPIs para parceiros em pipeline
Parceiros nos estágios `prospect`, `contacted`, `meeting_scheduled` nao precisam ver os cards de Indicacoes/Convertidos/Conversao -- esses numeros so fazem sentido a partir de `trial_first_job`. A stats row (3 cards coloridos) sera ocultada para esses estagios.

### 2. Melhorar o NotesEditor
Atualmente o botao "Salvar Notas" so aparece quando ha mudancas -- invisivel ate digitar algo. Melhorias:
- Adicionar um header discreto "Notas" com um icone de save que aparece apenas quando ha mudancas (botao pequeno inline no header, estilo icon button)
- Feedback visual sutil: botao fica verde quando salvo com sucesso (transitorio)

### 3. Checklist inline (ja existe, mas melhorar)
A secao de Tarefas ja existe no tab Notas, mas usa o `NewTaskDialog` (modal completo). Vou substituir por um **input inline** (estilo JobChecklist) -- campo de texto + Enter para criar tarefa rapida, sem abrir dialog. Mais fluido e operacional.

---

## Detalhes tecnicos

### Arquivo: `src/components/admin/PartnerDetailPanel.tsx`

**Stats Row (linhas 331-354)**
- Envolver em condicional: so renderizar se `partner.status` for `trial_first_job`, `active`, `inactive`, ou `churned`
- Parceiros em `prospect`, `contacted`, `meeting_scheduled` nao verao essa secao

**NotesEditor (linhas 898-930)**
- Adicionar header com label "Notas" + botao icon Save discreto (aparece so com mudancas)
- Usar `Save` icon do lucide (ou `Check`) pequeno, ao lado do titulo
- Manter textarea como esta

**Tasks Section (linhas 537-571)**
- Substituir `NewTaskDialog` por input inline: campo de texto com placeholder "Adicionar tarefa..." + submit ao pressionar Enter
- Manter a lista de tarefas e toggle de status como esta
- Remover import do `NewTaskDialog` se nao usado em outro lugar do componente

### Resultado visual
```text
[Ligar] [Mensagem] [Email]    <-- sempre visivel

Tabs: [Geral] [Notas]         <-- pipeline view (sem Projetos/Indicacoes)

--- Notas tab ---
Notas                    [icone save discreto]
[textarea livre]

Tarefas                  2 pendentes
[input inline: "Adicionar tarefa..."]
[ ] Ligar para confirmar reuniao
[x] Enviar portfolio
```
