

# PWA Standalone para /admin no iPhone

## Problema
Quando o app é adicionado à Home Screen do iPhone via Safari bookmark, ele abre dentro do Safari (com barra de URL, botão X, barra inferior). O objetivo é que `/admin` abra em modo **standalone fullscreen** — sem UI do Safari.

## Plano de Implementação

### 1. Criar manifest para /admin
Criar `public/admin-manifest.json` com `start_url: "/admin"`, `scope: "/admin"`, `display: "standalone"`, cores e ícones do AXO OS.

### 2. Criar ícones PWA
Criar ícones placeholder em `public/icons/icon-192.png` e `public/icons/icon-512.png`. Vou copiar o favicon existente como base — depois você pode substituir por ícones de alta resolução.

### 3. Criar Service Worker com scope /admin
Criar `public/admin-sw.js` — um service worker mínimo que intercepta requests dentro de `/admin` para garantir que o iOS reconheça o PWA. Inclui cache básico do app shell.

### 4. Componente AdminPWAHead
Criar um componente React que injeta no `<head>` as meta tags Apple-specific e o link do manifest **apenas quando a rota é /admin**:
- `apple-mobile-web-app-capable = yes`
- `apple-mobile-web-app-status-bar-style = black-translucent`
- `apple-mobile-web-app-title = AXO OS`
- `apple-touch-icon`
- `<link rel="manifest" href="/admin-manifest.json">`

Esse componente será registrado o service worker com scope `/admin`.

### 5. Integrar no AdminLayout
Montar o `AdminPWAHead` dentro do `AdminLayout` para que todas as páginas admin tenham as meta tags sem afetar o site público.

### Detalhes Técnicos
- **Nenhuma alteração** em rotas, layouts ou site público
- O service worker terá `navigateFallbackDenylist` para `/~oauth`
- O manifest usa `scope: "/admin"` para limitar o PWA ao admin
- Meta tags são adicionadas/removidas dinamicamente via `useEffect`

### Arquivos a criar/modificar
| Arquivo | Ação |
|---|---|
| `public/admin-manifest.json` | Criar |
| `public/admin-sw.js` | Criar |
| `public/icons/` | Criar (ícones placeholder) |
| `src/components/admin/AdminPWAHead.tsx` | Criar |
| `src/components/admin/AdminLayout.tsx` | Adicionar `<AdminPWAHead />` |

