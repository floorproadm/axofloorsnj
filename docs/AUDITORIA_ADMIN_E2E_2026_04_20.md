# Auditoria E2E — AXO OS Admin

> **Data:** 2026-04-20
> **Escopo:** Fluxos operacionais ponta-a-ponta + UX/Copy & Consistência visual
> **Profundidade:** Linha por linha (5/5)
> **Stack auditado:** 26 rotas `/admin/*` + 5 jornadas críticas + camadas transversais

---

## Como usar este documento

1. Trabalhe **fluxo por fluxo** (Seção 2) — são as jornadas que pagam a operação.
2. Em paralelo, percorra a **auditoria por página** (Seção 3) marcando o status de cada item:
   - ✅ **OK** — está bom, não tocar
   - 🟡 **Ajustar** — refinar copy/UI/UX (sem refator)
   - 🔴 **Refazer** — quebrado, confuso ou fora do padrão
   - ⚪ **N/A** — não se aplica
3. Use a **Seção 4 (transversais)** para padrões globais (sidebar, header, empty states, toasts).
4. Consolide tudo na **Seção 5 (Plano de ação)** priorizando por impacto × esforço.

---

## 1. Mapa do sistema

### 1.1 Rotas admin (26 páginas)

| # | Rota | Componente | Categoria |
|---|------|------------|-----------|
| 1 | `/admin/auth` | AdminAuth | Auth |
| 2 | `/admin` · `/admin/dashboard` | Dashboard | Home / Mission Control |
| 3 | `/admin/schedule` | Schedule | Operação diária |
| 4 | `/admin/projects` | ProjectsHub | Operação |
| 5 | `/admin/projects/:projectId` | ProjectDetail | Operação |
| 6 | `/admin/jobs/:jobId` | JobDetail | Operação (legacy → projects) |
| 7 | `/admin/jobs/:projectId/documents` | ProjectDocuments | Operação |
| 8 | `/admin/payments` | Payments | Financeiro |
| 9 | `/admin/performance` | Performance | Financeiro / Governança |
| 10 | `/admin/weekly-review` | WeeklyReview | Governança |
| 11 | `/admin/labor-payroll` | LaborPayroll | Financeiro |
| 12 | `/admin/intake` | Intake | Vendas |
| 13 | `/admin/leads` | LeadsManager | Vendas |
| 14 | `/admin/leads/:leadId` | LeadDetail | Vendas |
| 15 | `/admin/measurements` | MeasurementsManager | Vendas |
| 16 | `/admin/proposals` | Proposals | Vendas |
| 17 | `/admin/partners` | Partners | Crescimento |
| 18 | `/admin/crews` | CrewsVans | Gestão |
| 19 | `/admin/catalog` | Catalog | Gestão |
| 20 | `/admin/gallery` | GalleryHub | Marketing |
| 21 | `/admin/feed/:postId` | FeedPostDetail | Marketing |
| 22 | `/admin/feed/:postId/edit` | FeedPostEdit | Marketing |
| 23 | `/admin/automations` | Automations | Crescimento |
| 24 | `/admin/help` | Help | Suporte |
| 25 | `/admin/settings` | Settings | Governança |
| 26 | `GalleryManager` (legacy) | GalleryManager | Marketing — verificar se está roteada |

### 1.2 Camadas transversais

- **AdminLayout** (header + sidebar + breadcrumb + notificações + logout)
- **AdminSidebar** (Top / Tools / Manage / Footer / Ver Site / Logout)
- **MobileBottomNav**
- **ProtectedRoute** + AuthContext (RBAC via `organization_members`)
- **NRA Engine** (Next Required Action) + **SLA Engine V1**
- **Audit Log**, **Notification Engine**, **Media Engine**

---

## 2. Auditoria de Fluxos Operacionais (E2E)

> Para cada fluxo: percorra os passos no preview, anote fricção, copy ambígua, cliques redundantes, dead-ends.

### 🎯 Fluxo 1 — Lead → Proposta → Job → Invoice → Payment (jornada-mãe)

| # | Passo | Tela | O que validar | Status | Notas |
|---|-------|------|---------------|--------|-------|
| 1 | Lead chega (form público / manual) | `/admin/intake` ou `/admin/leads` | Captura completa? Alerta de novo lead aparece em <60s? Source preenchido? | ⬜ | |
| 2 | Triagem (Cold → Warm) | `/admin/leads` | Drag entre estágios funciona? NRA recalcula? | ⬜ | |
| 3 | Agendar Estimate | LeadControlModal | Address obrigatório? Aparece em `/admin/schedule`? | ⬜ | |
| 4 | Medição on-site | `/admin/measurements` ou Quick Quote | Áreas (sqft/linear/steps) salvam? Vincula ao lead? | ⬜ | |
| 5 | Gerar Quick Quote / Proposal | `QuickQuoteSheet` / `ProposalGenerator` | 3-tier ou Direct Price? Margin lock dispara? | ⬜ | |
| 6 | Enviar Proposta | `/admin/proposals` | PDF/link gerado? Status muda para `proposal_sent`? Drip dispara? | ⬜ | |
| 7 | Aprovação → Conversão para Job | `AwaitingConversionBanner` | Cria projeto? Migra customer? Atribui número? | ⬜ | |
| 8 | Execução | `/admin/projects/:id` | Checklist, Job Costs, Labor Entries, Material Requests, Proof (Before/After) | ⬜ | |
| 9 | Faturamento | `InvoicesPaymentsSection` (inline) | Cria invoice? Schedule de pagamento? Tax/Discount? | ⬜ | |
| 10 | Recebimento | `/admin/payments` | Vincula payment ao invoice? Atualiza status? Hub financeiro reflete? | ⬜ | |
| 11 | Fechamento | Job Detail | Proof Before/After? Margem real vs prevista? Aparece em `/admin/performance`? | ⬜ | |
| 12 | Pós-obra | Issues & Warranty / Review Request | Trigger de pedido de review? | ⬜ | |

**Pergunta-âncora:** *quantos cliques entre "lead criado" e "primeiro toque"?* (target: ≤2)

---

### 🎯 Fluxo 2 — Schedule & Field Operations

| # | Passo | Tela | Validar | Status |
|---|-------|------|---------|--------|
| 1 | Criar appointment | `/admin/schedule` (Day/Week/Month) | Address autocomplete? Multi-assignee? | ⬜ |
| 2 | Atribuir crew | Schedule + `/admin/crews` | Conflito de horário detectado? | ⬜ |
| 3 | Notificação ao colaborador | Notification Engine | Aparece no portal `/collaborator`? Push? | ⬜ |
| 4 | Material Request do campo | Collaborator → Admin | Aparece em alguma fila admin? Quem aprova? | ⬜ |
| 5 | Upload de fotos do campo | Media Engine | Vai pra `media_files` com folder correto? | ⬜ |
| 6 | Confirmação de execução | Job Detail | "Mark as Completed" sem gate de proof? Badge "Missing Proof"? | ⬜ |

---

### 🎯 Fluxo 3 — Financeiro (Payments + Invoicing + Payroll)

| # | Passo | Tela | Validar | Status |
|---|-------|------|---------|--------|
| 1 | Criar invoice (a partir do Job) | Job Detail → InvoicesPaymentsSection | Phases (deposit/midway/final)? Tax/Discount? | ⬜ |
| 2 | Enviar invoice por link público | `/invoice/:token` | Renderiza? Branding correto? | ⬜ |
| 3 | Registrar payment recebido | `/admin/payments` (NewPaymentDialog) | Vincula a invoice? Categoria? | ⬜ |
| 4 | Registrar payroll (mão de obra) | `/admin/labor-payroll` | Daily rate × days_worked? Marca como pago? | ⬜ |
| 5 | Registrar despesa (material/expense) | `/admin/payments` (Expense tab) | Categoria + project link? | ⬜ |
| 6 | P&L Preview | `PLPreviewDialog` | Bate com `/admin/performance`? | ⬜ |
| 7 | Weekly Review snapshot | `/admin/weekly-review` | Persiste em `weekly_reviews`? | ⬜ |

---

### 🎯 Fluxo 4 — Vendas (Pipeline) & Automação

| # | Passo | Tela | Validar | Status |
|---|-------|------|---------|--------|
| 1 | Pipeline visual de leads | `/admin/leads` (LinearPipeline) | 10 estágios? Health bar? Drag funciona? | ⬜ |
| 2 | NRA (Next Required Action) | LinearPipeline | Mostra próxima ação por lead? Não duplica? | ⬜ |
| 3 | Drips automáticos | `/admin/automations` | Sequence + delay + canal funcionam? | ⬜ |
| 4 | Follow-up alerts | Header bell + Dashboard | Lead sem contato 24h dispara? | ⬜ |
| 5 | Conversão Lead → Project | LeadDetail | Banner "Awaiting Conversion" claro? | ⬜ |
| 6 | Lost / Rejected | Pipeline | Razão obrigatória? Métrica de loss? | ⬜ |

---

### 🎯 Fluxo 5 — Conteúdo & Marketing (Gallery / Feed / Stain)

| # | Passo | Tela | Validar | Status |
|---|-------|------|---------|--------|
| 1 | Upload no Field/Job | Job Proof / Media Quick Upload | Stain color metadata salva? (recém-implementado) | ⬜ |
| 2 | Curadoria | `/admin/gallery` (GalleryHub) | Marketing toggle? Quality check? | ⬜ |
| 3 | Publicar no Feed | `/admin/gallery` → FeedPanel | Vira `feed_posts`? Folder correto? | ⬜ |
| 4 | Compartilhar externamente | `/shared/:token` | Token público funciona? OG tags? | ⬜ |
| 5 | Sincronização com galeria pública `/gallery` | — | Reflete em <5min? | ⬜ |

---

## 3. Auditoria por Página (linha por linha)

> Para cada página, valide: **Header & Title** · **Hierarquia visual** · **Copy/Labels** · **Empty state** · **Loading** · **Error** · **Mobile (<768px)** · **Performance (>3s = 🔴)** · **Ações primárias claras** · **Padrões consistentes com outras páginas**

### 3.1 `/admin/auth` — Login Admin
- [ ] Logo + branding correto
- [ ] Copy "Acesso restrito" sem ambiguidade
- [ ] Erro de credencial inválida é claro (não vaza info)
- [ ] Link "Esqueci senha" funciona
- [ ] Redirect pós-login vai pra `/admin/dashboard`
- [ ] Mobile: form não corta no iPhone SE

### 3.2 `/admin/dashboard` — Mission Control
- [ ] MetricCards (4) carregam com dados reais
- [ ] Mission Control prioriza alertas críticos primeiro
- [ ] AgendaSection mostra appointments do dia
- [ ] PriorityTasksList: tarefas manuais + automáticas misturadas?
- [ ] NewTaskDialog acessível em ≤2 cliques
- [ ] Skeleton loading consistente
- [ ] Atalhos rápidos para Job/Lead/Invoice mais frequentes
- [ ] Copy: "Hoje" vs "Esta semana" vs "Mês" — qual é o default?

### 3.3 `/admin/schedule` — Agenda
- [ ] 3 modos (Day/Week/Month) funcionam e preservam contexto ao alternar
- [ ] Criar appointment exige endereço (constraint)
- [ ] Multi-assignee funciona via `appointment_assignees`
- [ ] Conflito de horário sinalizado
- [ ] Cores/badges por tipo de appointment consistentes
- [ ] Mobile: vista do dia é a default?

### 3.4 `/admin/projects` — Projects Hub
- [ ] KPI bar clicável filtra a lista (At Risk, Overdue, etc.)
- [ ] Smart filter chips funcionam
- [ ] Awaiting Conversion banner aparece quando aplicável
- [ ] Toggle Pipeline ↔ List preserva filtros
- [ ] Cards mostram address como identificador (memory)
- [ ] Margem real vs prevista visível?
- [ ] Empty state com CTA "Criar Job" claro

### 3.5 `/admin/projects/:projectId` — Project Detail
- [ ] Layout "Notion-like": header financeiro + tabs
- [ ] Next Action Banner com CTA
- [ ] Job Cost Editor (granular: labor/material/extras)
- [ ] Itemized Cost Editor funciona
- [ ] Margin Display atualiza em tempo real
- [ ] Checklist de execução
- [ ] Proof Uploader (Before/After) com badge se faltar
- [ ] Documents sidebar (memory)
- [ ] Inline Invoice Creation (memory)
- [ ] Project Chat funciona (realtime)
- [ ] Issues & Warranty section
- [ ] Histórico/Journal de comentários

### 3.6 `/admin/jobs/:jobId` — Job Detail (legacy alias?)
- [ ] Confirmar se redireciona ou duplica `/admin/projects/:id`
- [ ] Se duplica, **consolidar** (debt técnica)

### 3.7 `/admin/jobs/:projectId/documents` — Project Documents
- [ ] Upload múltiplo
- [ ] Categorização (contract, permit, photo, etc.)
- [ ] Preview inline
- [ ] Download e share link

### 3.8 `/admin/payments` — Hub Financeiro
- [ ] 3 tabs: Income / Payroll / Expense
- [ ] MonthSelector + PeriodSelector consistentes
- [ ] FinancialOverviewChart legível
- [ ] MonthlyOverview com totais corretos
- [ ] NewPaymentDialog: categoria + project link obrigatórios?
- [ ] PaymentDetailsSheet completo
- [ ] PLPreview acessível
- [ ] **Distinguir visualmente:** Outstanding Invoices vs Received Payments
- [ ] Exportar relatório (CSV/PDF)?

### 3.9 `/admin/performance` — Performance
- [ ] Revenue Trend Chart
- [ ] Project Performance List ordenada por margem
- [ ] Weekly Review Tab
- [ ] Export Sheet funciona
- [ ] JobCostDetailsSheet bate com dados do Project Detail

### 3.10 `/admin/weekly-review` — Weekly Review
- [ ] Snapshot persistido em `weekly_reviews`
- [ ] Comparação semana vs semana
- [ ] Métricas: Revenue, Profit, Margin, Jobs Completed
- [ ] Botão "Save Snapshot" claro

### 3.11 `/admin/labor-payroll` — Folha
- [ ] Lista de labor entries por colaborador
- [ ] Toggle "is_paid"
- [ ] Total devido por colaborador no topo
- [ ] Filtrar por período

### 3.12 `/admin/intake` — Captação
- [ ] Mission Control de leads novos
- [ ] Métricas de funil em grid 4 colunas
- [ ] Quick action: "Add Lead" sempre visível
- [ ] Source breakdown (Quiz, Form, Manual, Partner)

### 3.13 `/admin/leads` — Pipeline de Vendas
- [ ] LinearPipeline com 10 estágios
- [ ] Health bar do funil
- [ ] Conversion rates por estágio
- [ ] Filtro por status via querystring funciona
- [ ] Drag-drop entre estágios
- [ ] Lead Card mostra: nome, address, source, NRA, days in stage
- [ ] Lost reason obrigatório

### 3.14 `/admin/leads/:leadId` — Lead Detail
- [ ] LeadControlModal vs página separada — qual é o padrão?
- [ ] Notas com anexos (memory)
- [ ] Histórico de toques
- [ ] Quick Quote acessível
- [ ] Convert to Project CTA claro

### 3.15 `/admin/measurements` — Medições
- [ ] Escada como quantidade (steps), não sqft (memory)
- [ ] Áreas múltiplas por medição
- [ ] Vincula a lead/project
- [ ] Total sqft + linear ft no resumo

### 3.16 `/admin/proposals` — Propostas
- [ ] Vista padrão: Lista (memory)
- [ ] Pipeline Board opcional
- [ ] Margin Enforcement bloqueia envio abaixo do mínimo (memory)
- [ ] 3-tier (Good/Better/Best) funciona
- [ ] PDF gera com branding
- [ ] Link público + tracking de view

### 3.17 `/admin/partners` — Parceiros
- [ ] Kanban 6 estágios (Prospect → Inactive)
- [ ] PartnerControlModal completo
- [ ] PartnerChecklist funciona
- [ ] Métricas: leads referidos, conversões, comissão
- [ ] PartnerPipelineBoard responsivo

### 3.18 `/admin/crews` — Crews & Fleet
- [ ] Lista de equipes
- [ ] Atribuição a appointments
- [ ] Gestão de veículos
- [ ] Folha integrada ou link pra `/admin/labor-payroll`

### 3.19 `/admin/catalog` — Catálogo
- [ ] Separação Services vs Materials (memory)
- [ ] Precificação por unidade (sqft/unit/step/linear)
- [ ] Edição inline?
- [ ] Vincula a Quick Quote / Proposal

### 3.20 `/admin/gallery` — Gallery Hub
- [ ] FolderHubGrid navegável
- [ ] MediaQuickUpload com filtros
- [ ] GalleryFeedPanel + GalleryPublicPanel
- [ ] Stain color metadata visível nas thumbnails
- [ ] Quality check toggle

### 3.21 `/admin/feed/:postId` — Feed Post Detail
- [ ] Renderiza imagens/vídeos
- [ ] Comments
- [ ] Edit CTA visível pra autor

### 3.22 `/admin/feed/:postId/edit` — Feed Post Edit
- [ ] Form completo
- [ ] Salvar volta pra detail
- [ ] Delete confirmação dupla

### 3.23 `/admin/automations` — Automations
- [ ] Sequences listadas por pipeline (Sales/Partner)
- [ ] DripEditor: delay + canal + template
- [ ] Toggle ativo/inativo
- [ ] Preview de mensagem

### 3.24 `/admin/help` — Help
- [ ] Conteúdo atualizado?
- [ ] Search funciona
- [ ] Links pra docs externos

### 3.25 `/admin/settings` — Settings
- [ ] Sidebar vertical (Governance Hub - memory)
- [ ] BrandingSettings (logo, cores)
- [ ] GeneralSettings
- [ ] TeamSettings + InviteTeamMemberDialog
- [ ] Labor pricing model
- [ ] Margin minimum
- [ ] Referral commission %

### 3.26 GalleryManager (legacy)
- [ ] Está roteada? Se não, remover do bundle

---

## 4. Auditoria Transversal (componentes globais)

### 4.1 AdminLayout (header)
- [ ] Title + breadcrumb consistentes em todas as páginas
- [ ] Notificações: contador correto, link funciona, sem flicker
- [ ] Week info no centro: útil ou distração?
- [ ] Logout: confirmação? Toast pós-logout
- [ ] Mobile: header não quebra <414px

### 4.2 AdminSidebar
- [ ] Grupos: Top / Tools / Manage / Footer fazem sentido?
- [ ] Ícones consistentes (lucide-react)
- [ ] Estado ativo legível (não só borda)
- [ ] Collapsed mode funciona
- [ ] "Ver Site" abre em nova aba
- [ ] Logo carrega de `company_settings`
- [ ] **Refator pendente:** arquivo tem 251 linhas — extrair sub-componentes

### 4.3 MobileBottomNav
- [ ] Aparece apenas no breakpoint correto
- [ ] Não cobre conteúdo (padding-bottom no main)
- [ ] Atalhos cobrem 80% das ações diárias

### 4.4 Padrões transversais a validar
- [ ] **Toasts:** mesma posição, duração, severidade visual
- [ ] **Empty states:** ilustração + título + descrição + CTA primário
- [ ] **Loading:** Skeleton vs Spinner — escolher um padrão
- [ ] **Error states:** mensagem humana, sem stack trace
- [ ] **Dialogs:** título sempre presente, botão primário à direita
- [ ] **Tabelas (DataTable):** sort, filter, paginação consistentes
- [ ] **AddressAutocomplete:** usado em todos os formulários com endereço (memory)
- [ ] **Copy bilíngue:** PT/EN ainda misturados? Decidir idioma do admin (mem dizem americano = EN)
- [ ] **Cores semânticas:** state-blocked, state-risk, gold-warm — uso consistente
- [ ] **Animations:** `animate-fade-in` aplicado de forma uniforme

### 4.5 Idioma & Copy
- [ ] **Decisão pendente:** sidebar tem labels misturados ("Pagamentos", "Captação", "Medições", "Catálogo", "Ajuda" em PT vs "Home/Schedule/Projects/Performance/Partners/Crews & Fleet/Gallery/Automations/Settings" em EN)
- [ ] User base é americana (memory `target-audience-language`) → padronizar em EN
- [ ] Toasts em PT (`auth.logoutRealizado`, `layout.notificacoes`) → migrar
- [ ] Breadcrumbs e títulos: alguns em PT ("Leads & Vendas") → "Leads & Sales"

---

## 5. Plano de Ação (preencher após auditoria)

| Prioridade | Item | Página/Fluxo | Impacto | Esforço | Status |
|------------|------|--------------|---------|---------|--------|
| P0 | | | | | |
| P0 | | | | | |
| P1 | | | | | |
| P1 | | | | | |
| P2 | | | | | |

**Critério P0:** quebra fluxo de receita (Lead→Payment) ou expõe dado sensível.
**Critério P1:** fricção operacional diária (>3 cliques redundantes, copy ambígua em ação crítica).
**Critério P2:** polish, consistência, débito técnico.

---

## 6. Checklist de débitos técnicos já mapeados

- [ ] **AdminSidebar.tsx (251 linhas)** — refatorar em `SidebarBrand`, `SidebarNavGroup`, `SidebarFooter`
- [ ] **`/admin/jobs/:jobId` vs `/admin/projects/:projectId`** — consolidar rotas
- [ ] **GalleryManager.tsx** — confirmar uso ou remover
- [ ] **Mistura PT/EN** na sidebar e toasts — padronizar EN
- [ ] **Ver Site** abre `/` — confirmar se deveria ser `/` ou subdomínio published
- [ ] **company_settings logo** — caching de signed URL (1h) sem refresh automático

---

## 7. Próximos passos sugeridos

1. **Sessão de 2h** percorrendo Fluxo 1 (jornada-mãe) marcando cada passo.
2. **Sessão de 2h** por categoria (Vendas / Operação / Financeiro / Marketing / Governança).
3. Consolidar achados na Seção 5 e abrir tasks atômicas no tracker.
4. Atacar P0s em sprints de 1 semana, P1s em paralelo conforme capacidade.

---

*Documento vivo — atualize conforme avança a auditoria. Versionado em `docs/`.*
