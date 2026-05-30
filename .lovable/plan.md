## Demo Portals Launcher (Settings)

Adicionar uma nova seção **"Demo Portals"** dentro de `/admin/settings` que liste os 3 portais existentes com botões "Open in new tab" — ideal para mostrar o sistema ao vivo a flooring owners interessados.

### Onde aparece
- Nova entrada na sidebar de Settings (`src/pages/admin/Settings.tsx`), ícone `Eye` ou `MonitorPlay`, label **"Demo Portals"**, descrição: *"Quick access to client-facing portals for live demos"*.
- Componente novo: `src/components/admin/settings/DemoPortalsSettings.tsx` (lazy-loaded igual aos outros).

### Conteúdo (3 cards verticais navy/gold)

**1. Client Portal** — `/portal/:token`
- Busca clientes da org com `portal_token NOT NULL` (Supabase query no mount).
- Dropdown "Select a demo client" lista até 20 clientes (mostra `full_name` + endereço do projeto mais recente).
- Botão **"Open Client Portal →"** abre `/portal/{token}` em nova aba.
- Link "Copy link" copia URL completa pra clipboard (útil pra enviar por mensagem durante a demo).
- Aviso pequeno: *"Client sees: proposals, invoices, timeline, project status."*

**2. Partner Portal** — `/partner/dashboard`
- Botão **"Open Partner Portal →"** abre em nova aba.
- Nota: *"Requires partner login. Use your seeded demo partner account."* (não tem token público, é auth-based).
- Mostra email do partner demo se existir um seed (`partner_users` linkado a um auth user com email contendo "demo") — apenas como referência visual, sem auto-login.

**3. Collaborator Portal** — `/collaborator`
- Botão **"Open Collaborator Portal →"** abre em nova aba.
- Nota: *"Requires collaborator login. Field team view: schedule, uploads, chat."*

### Detalhes técnicos
- Arquivo único novo + edição mínima de `Settings.tsx` (1 import, 1 entrada no array `sections`, 1 case no switch render).
- Query: `supabase.from('customers').select('id, full_name, portal_token, projects(address, city)').not('portal_token','is',null).limit(20)`.
- Sem mudanças de DB, sem RLS, sem edge functions.
- Design: cards com `border-l-4 border-l-primary`, ícones lucide (`Users`, `Handshake`, `HardHat`), botão primário gold pra "Open", ghost pra "Copy link".
- Tudo client-side, abre em nova aba (`target="_blank" rel="noopener"`) — preserva sua sessão admin.

### Fora de escopo
- Não cria contas demo automaticamente (Partner/Collaborator dependem de seeds existentes).
- Não faz auto-login (segurança). Admin precisa estar logado como aquele user pra entrar em Partner/Collaborator — Client Portal funciona via token público sem login.
