

# Reorganizar Sidebar para Alinhar com FloorPro v1

## Estrutura Alvo (baseada na imagem FloorPro v1)

```text
[Logo + Brand]
─────────────────
Home                    (sem grupo/label)
Jobs
Performance
─────────────────
TOOLS
  Lead Capture (Intake)
  Measurements
  Proposals
─────────────────
MANAGE
  Leads
  Catalog
  Company Feed
  Automations (placeholder)
─────────────────
          (mt-auto → rodape)
Help Center
Settings
─────────────────
[Ver Site]
[Logout]
```

## Mudancas

### 1. Reorganizar navegacao em `AdminSidebar.tsx`

- **Top items (sem label de grupo):** Home, Jobs, Performance — renderizados como `SidebarGroup` sem `SidebarGroupLabel`, acima dos demais
- **TOOLS:** Intake, Measurements, Proposals (sem mudanca)
- **MANAGE:** Leads, Feed, Catalog + adicionar Automations (placeholder apontando para `/admin/settings` por enquanto, ou nova rota futura)
- **Footer items (com `mt-auto`):** Help Center e Settings — movidos para o rodape, antes de "Ver Site" e Logout
- **Remover o grupo SUPPORT** — seus itens foram redistribuidos (Performance subiu, Settings e Help desceram)
- **Schedule** permanece em Overview ou e removido do topo (FloorPro v1 nao mostra Schedule no topo). Decisao: manter junto com Home/Jobs/Performance como item do topo.

### 2. Arquivo unico modificado

`src/components/admin/AdminSidebar.tsx` — reorganizar os arrays de items e o JSX de renderizacao.

### Detalhes tecnicos

- Top items: renderizar um `SidebarGroup` sem label (ou com label vazio) para Home, Jobs, Schedule, Performance
- Tools e Manage: manter como grupos com label
- Footer: renderizar Help e Settings num `SidebarGroup` com `mt-auto` antes do "Ver Site" e Logout
- Zero alteracao de rotas ou logica

