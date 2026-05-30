## Objetivo
Remover "Mission Control" do grupo Top Items do sidebar e fazer o acesso acontecer pelo popover do sininho (que já lista notificações), substituindo o link atual "Ver todos os leads →" por um link que abra `/admin/mission-control`.

## Mudanças

### 1. `src/components/admin/AdminSidebar.tsx`
- Remover a entrada `{ title: "Mission Control", url: "/admin/mission-control", icon: Target }` do array `topItems` (linha 69).
- Remover o import `Target` do lucide-react se ficar sem uso após a remoção.

### 2. `src/components/admin/AdminLayout.tsx`
- No footer do popover de notificações (linhas ~176-178), trocar:
  - `to="/admin/leads"` → `to="/admin/mission-control"`
  - texto: usar nova chave i18n `layout.abrirMissionControl` em vez de `layout.n`.

### 3. `src/contexts/LanguageContext.tsx`
- Adicionar chave nova:
  - `"layout.abrirMissionControl": { pt: "Abrir Mission Control →", en: "Open Mission Control →" }`
- Manter (ou remover) a chave antiga `layout.n` — remover já que não terá mais uso.

## Fora do escopo
- A rota `/admin/mission-control` continua existente e funcional.
- Os links individuais de notificação dentro do popover (que apontam para `/admin/leads?...`) permanecem como estão — só o CTA do rodapé muda.
