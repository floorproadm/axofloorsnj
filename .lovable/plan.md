

# Simplificação Radical — "Notion-like" Experience

## O Problema
O app está cheio de gates, validações obrigatórias, progress bars, e 7 abas separadas. Para um crew de hardwood flooring, isso é overengineering. No Notion, você abre, escreve, e pronto. Precisamos dessa mesma fluidez.

## Mudanças Propostas

### 1. Job Detail — Tudo em uma página, sem abas
Eliminar as 7 abas. Tudo aparece em scroll vertical numa única página, como um "doc" do Notion:

```text
┌─────────────────────────────────┐
│ ← Back     [Status: Active ▼]  │
│ 11 Katharine Pl  📍 Maps        │
│─────────────────────────────────│
│ CLIENT                          │
│ Name: John Doe  📞 Call  💬 SMS │
│ Phone: (201) 555-1234           │
│ Email: john@email.com           │
│─────────────────────────────────│
│ JOB INFO                        │
│ Service: Sand & Refinish        │
│ Sqft: 1,200    Start: 04/15     │
│ Team Lead: Carlos               │
│─────────────────────────────────│
│ COSTS (inline, collapsible)     │
│ Labor: $2,400  Material: $800   │
│ Revenue: $5,500  Margin: 42% ✓ │
│─────────────────────────────────│
│ NOTES (textarea, always visible)│
│ Garage code: 1234, dog in yard  │
│─────────────────────────────────│
│ PHOTOS  [+ Add]                 │
│ 🖼️ 🖼️ 🖼️ (grid thumbnails)     │
│─────────────────────────────────│
│ COMMENTS                        │
│ Admin: "Started sanding today"  │
│ [Type a comment...] [Send]      │
└─────────────────────────────────┘
```

### 2. Remover bloqueios e progress bar
- Eliminar a progress bar com checklist obrigatória
- Remover a aba "Checklist" separada
- Status muda livremente (Pending → Active → Done) sem gates
- Margin warning vira apenas um indicador visual (amarelo/vermelho), não bloqueia nada

### 3. Seções colapsáveis em vez de abas
Cada seção (Client, Job Info, Costs, Notes, Photos, Documents) fica em cards colapsáveis na mesma página. Tudo visível por padrão, pode fechar o que não interessa.

### 4. Proposal e Documents — acesso por botões
- "Proposal" e "Documents" viram botões de ação no topo, não abas. Abrem em sheet/modal quando necessário, mas não ocupam espaço permanente.

### 5. NewJobDialog — mínimo absoluto
Criar job com apenas: **Address + Service type**. Tudo o resto é opcional e pode ser editado depois no detalhe.

## Arquivos a Editar

1. **`src/pages/admin/JobDetail.tsx`** — Reescrever: single-scroll, sem tabs, seções colapsáveis, sem progress bar obrigatória
2. **`src/components/admin/NewJobDialog.tsx`** — Simplificar: só address + service, resto opcional

## O Que NÃO Muda
- A edição inline (click-to-edit) permanece — é boa
- AddressAutocomplete permanece
- Os componentes internos (JobCostEditor, ProposalGenerator, JobProofUploader) continuam existindo, só mudam de contexto (inline/modal em vez de tabs)
- Dados no banco não mudam

