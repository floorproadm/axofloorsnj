

# Partner Hub — Nivel MaidPad + Notion MVP

Baseado nas duas referencias enviadas, o Partner Hub precisa de duas melhorias principais:

## 1. Nova Tab "Jobs" (estilo MaidPad)

A referencia do MaidPad mostra uma tab "Jobs" com lista de jobs associados ao cliente, separados em "Next Jobs" e "Last Jobs". No nosso caso, vamos adicionar uma tab **"Projetos"** no `PartnerDetailPanel` que mostra os projetos vinculados ao partner.

**Como funciona a vinculacao:**
- Partner -> leads (via `referred_by_partner_id`) -> projects (via `converted_to_project_id`)
- A query busca leads do partner que foram convertidos em projetos, e depois carrega os dados dos projetos

**Layout da tab:**
- Secao "Projetos Ativos" — projetos com status != completed/cancelled
- Secao "Projetos Concluidos" — projetos finalizados
- Cada item mostra: endereco, tipo de projeto, status badge, datas (inicio/conclusao), valor estimado
- Total de receita no rodape (soma de `estimated_cost`)
- Empty state se nenhum projeto vinculado

## 2. Historico de Financas (estilo Notion MVP)

A segunda imagem mostra o Notion com uma tabela "Historico de Financas" rica com colunas: Projects, Week, Start Date, End Date, Job Notes, Measurements, Project Media, Total Value.

Vamos integrar isso como um **resumo financeiro compacto** dentro da tab "Projetos":
- Tabela com colunas: Projeto (endereco), Data, Tipo, Notas, Valor
- Total no rodape da tabela
- Usa os dados dos projetos vinculados ao partner via leads convertidos

## 3. Mais Tabs como MaidPad

O MaidPad tem: Overview, Addresses, Jobs, Chat, Estimates, Contracts, Automations. Vamos adicionar tabs relevantes ao nosso contexto:

- **Geral** (ja existe) — overview do partner
- **Projetos** (nova) — jobs vinculados + historico financeiro
- **Indicacoes** (ja existe) — leads referidos
- **Notas** (ja existe) — notas do relacionamento

## 4. Relations Count no Header

Como o Notion mostra "Relations: 15 Service / Project", vamos adicionar no header do partner um badge com contagem de projetos vinculados.

---

## Detalhes Tecnicos

### Query para Projetos Vinculados ao Partner

```typescript
// 1. Buscar leads convertidos do partner
const { data: leads } = await supabase
  .from("leads")
  .select("converted_to_project_id")
  .eq("referred_by_partner_id", partner.id)
  .not("converted_to_project_id", "is", null);

// 2. Buscar projetos pelos IDs
const projectIds = leads.map(l => l.converted_to_project_id);
const { data: projects } = await supabase
  .from("projects")
  .select("id, customer_name, address, city, project_type, project_status, start_date, completion_date, estimated_cost, notes")
  .in("id", projectIds)
  .order("start_date", { ascending: false });
```

### Tabela de Historico (estilo Notion)

Usando os componentes Table do shadcn ja instalados:
- Colunas: Projeto (endereco + cidade), Tipo, Data Inicio, Data Conclusao, Notas (truncado), Valor
- Linha de total no rodape com soma de `estimated_cost`
- Responsivo: no mobile, esconde colunas menos importantes

### Arquivos a Modificar

1. **`src/components/admin/PartnerDetailPanel.tsx`**
   - Adicionar tab "Projetos" com query de projetos vinculados
   - Adicionar tabela de historico financeiro dentro da tab
   - Adicionar badge de projetos no header
   - Separar projetos em "Ativos" e "Concluidos"

### Arquivos SEM alteracao
- `src/hooks/admin/usePartnersData.ts`
- `src/components/admin/PartnerListItem.tsx`
- `src/pages/admin/Partners.tsx`
- Database schema (nenhuma migracao necessaria — dados ja existem via FK)

### Fluxo Visual da Tab "Projetos"

```text
+----------------------------------------+
| [Geral] [Projetos (3)] [Indicacoes] [Notas] |
+----------------------------------------+
|                                        |
|  Projetos Ativos                       |
|  +----------------------------------+  |
|  | 123 Main St, Newark  | S&F      |  |
|  | Jan 15 - Em andamento| $4,100   |  |
|  +----------------------------------+  |
|  | 456 Oak Ave, Milford | Staircase|  |
|  | Jan 20 - Em andamento| $2,100   |  |
|  +----------------------------------+  |
|                                        |
|  Projetos Concluidos                   |
|  +----------------------------------+  |
|  | 789 Elm St, Sparta   | S&F      |  |
|  | Dec 01 - Dec 15      | $1,900   |  |
|  +----------------------------------+  |
|                                        |
|  Total Receita: $8,100                 |
+----------------------------------------+
```
