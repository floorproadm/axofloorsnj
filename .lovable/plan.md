

# Job Modal V2 — Dual-Mode Operacional/Executivo

## Objetivo
Redesenhar o `JobControlModal` em `src/pages/admin/JobsManager.tsx` com duas camadas de visao (Operacional e Executivo), checklist de progresso com barra, proxima acao recomendada dinamica, status dropdown com enforcement, e score de risco operacional.

## Estrutura Final do Modal

```text
┌──────────────────────────────────────────────┐
│ HEADER (gradiente por status)                │
│  Status Dropdown [Pending v]  |  Toggle [Op|Exec] │
│  Criado ha X dias  •  Customer Name          │
├──────────────────────────────────────────────┤
│ PROXIMA ACAO RECOMENDADA (sempre visivel)     │
│  "Adicionar fotos before/after"   [Fazer >]  │
├──────────────────────────────────────────────┤
│ PROGRESSO DO JOB (sempre visivel)            │
│  [##########░░░░] 60%                        │
│  ✔ Medicoes  ✔ Custos  ⚠ Margem  ✔ Time  ✖ Fotos │
├──────────────────────────────────────────────┤
│ RISCO OPERACIONAL (badge no header)          │
│  🟢 Saudavel / 🟡 Atencao / 🔴 Em risco     │
├──────────────────────────────────────────────┤
│                                              │
│  SE MODO OPERACIONAL:                        │
│    Cliente + Endereco (Maps link)            │
│    Time                                      │
│    Fotos (quick upload)                      │
│    Acoes rapidas simplificadas               │
│                                              │
│  SE MODO EXECUTIVO:                          │
│    Tudo do operacional +                     │
│    JobCostEditor aberto                      │
│    Margem detalhada + Revenue vs Cost        │
│    Timeline completa (Notes/Comments)        │
│    Historico de status                       │
│                                              │
├──────────────────────────────────────────────┤
│ FOOTER: Deletar Job  |  Info                 │
└──────────────────────────────────────────────┘
```

## Implementacao — 5 Blocos (Arquivo unico: `JobsManager.tsx`)

### Bloco 1: Status Dropdown com Enforcement

- Substituir o status estatico no header por um `<Select>` dropdown
- Opcoes: `pending`, `in_production`, `completed`
- Ao mudar: chamar `supabase.from('projects').update({ project_status })` 
- O trigger `enforce_job_proof_on_completion` ja bloqueia completion sem fotos no servidor
- Mostrar toast de erro se bloqueado, toast de sucesso se OK
- Chamar `onRefresh()` apos mudanca

### Bloco 2: Checklist + Barra de Progresso

- Novo componente inline `JobProgressChecklist` renderizado sempre visivel abaixo do header
- 5 itens verificados:
  1. **Medicoes** — `project.square_footage > 0`
  2. **Custos** — `jobCost && (labor_cost > 0 || material_cost > 0)`
  3. **Margem OK** — `marginOk` (ja calculado)
  4. **Time definido** — `project.team_lead` nao vazio
  5. **Fotos completas** — `proofComplete` (ja calculado)
- Barra de progresso: `(itens_ok / 5) * 100` usando componente `<Progress />`
- Cada item com icone Check (verde) ou X (vermelho) + label

### Bloco 3: Proxima Acao Recomendada (NRA)

- Bloco visual destacado (bg-amber-50 ou bg-primary/10) logo abaixo do header
- Logica de prioridade (avaliada em ordem, retorna a primeira que falhar):
  1. Se `!hasCosts` -> "Preencher custos do projeto"
  2. Se `!marginOk` -> "Margem abaixo de X% — ajuste custos"
  3. Se `!project.team_lead` -> "Definir team lead"
  4. Se `!proofComplete` -> "Adicionar fotos before/after"
  5. Se job parado > 4 dias (comparar `updated_at` com now) -> "Job parado ha X dias"
  6. Se tudo OK -> "Tudo em dia" (verde)
- Botao de acao que abre o bloco correspondente (custos, fotos, etc.)

### Bloco 4: Toggle Operacional/Executivo

- Estado `viewMode: 'operational' | 'executive'` (default: `'operational'`)
- Toggle no header ao lado do status: dois botoes com icones (Wrench para Op, BarChart3 para Exec)
- **Modo Operacional** mostra:
  - Cliente + endereco como link Google Maps (`https://maps.google.com/?q=`)
  - Time
  - Fotos (quick action)
  - Acoes rapidas (sem expandable blocks financeiros)
- **Modo Executivo** mostra TUDO:
  - JobCostEditor aberto por padrao
  - Financial summary cards (margem + revenue)
  - Quick actions completas
  - Expandable blocks
  - Notes/Comments section

### Bloco 5: Risco Operacional

- Score calculado client-side:
  - +1 se margem baixa (`!marginOk`)
  - +1 se sem time (`!project.team_lead`)
  - +1 se sem fotos (`!proofComplete`)
  - +1 se job parado > 3 dias
  - +1 se sem custos (`!hasCosts`)
- Visual: Badge no header
  - 0-1: Verde "Saudavel"
  - 2-3: Amarelo "Atencao"  
  - 4-5: Vermelho "Em risco"
- Visivel em ambos os modos (sempre no header)

## O que NAO muda

- `ProjectNotesSection` — intacto (so visivel no modo executivo)
- Delete flow — intacto
- Team editing — intacto
- Rotas e hooks existentes — sem alteracao
- Zero alteracao de banco de dados (triggers ja existem)
- `useProjectsWithRelations` — sem alteracao

## Importacoes adicionais necessarias

- `Progress` de `@/components/ui/progress`
- `Select, SelectTrigger, SelectContent, SelectItem, SelectValue` de `@/components/ui/select`
- Icones: `Wrench`, `BarChart3`, `Shield`, `Navigation` do lucide-react

