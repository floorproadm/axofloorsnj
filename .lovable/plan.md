

## Problem: PWA Scope Breaks Authentication Flow

The PWA manifest defines `scope: "/admin"` and `start_url: "/admin"`. When iOS opens the PWA:

1. **Not logged in** → `ProtectedRoute` redirects to `/auth` → **outside `/admin` scope** → iOS opens Safari browser instead of staying in the standalone PWA
2. **Logged in but not admin** → redirects to `/` → same problem, exits PWA

The `/auth` route lives outside the PWA scope, breaking the standalone experience entirely.

## Solution: Scoped Auth Routes per Portal

Create dedicated auth routes inside each portal's scope so PWA navigation never leaves the scope boundary.

```text
/admin/auth      → Admin login (stays inside PWA scope)
/collaborator/auth → Collaborator login (future PWA)
/auth            → Keep as legacy redirect → detects context and forwards
```

### Changes

**1. Create `/admin/auth` route**
- New file: `src/pages/admin/AdminAuth.tsx`
- Same login UI as current `Auth.tsx` but with admin-specific redirects
- On success → `/admin`
- "Voltar" link goes to `/admin` not `/`
- Include `AdminPWAHead` for PWA meta tags
- No "register" — admin is invite-only (matches existing behavior)

**2. Update `ProtectedRoute` redirect targets**
- When `requireAdmin === true` and user is not logged in → redirect to `/admin/auth` (not `/auth`)
- When `requireAdmin === false` and user is not logged in → redirect to `/collaborator/auth` (future, for now `/auth`)
- When logged in but wrong role → redirect to appropriate auth page with error message

**3. Update `App.tsx` routing**
- Add `<Route path="/admin/auth" element={<AdminAuth />} />`
- Keep `/auth` as a smart redirect: if already on PWA context, forward to `/admin/auth`

**4. Update PWA service worker**
- Update `admin-sw.js` to also cache `/admin/auth` in the shell
- Update manifest scope stays `/admin` (already correct)

**5. Update `Auth.tsx` (legacy `/auth`)**
- Add detection: if `navigator.standalone` (iOS PWA) or `display-mode: standalone`, redirect to `/admin/auth` immediately
- Otherwise keep current behavior as fallback

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/admin/AdminAuth.tsx` | **Create** — scoped admin login page |
| `src/components/shared/ProtectedRoute.tsx` | **Modify** — accept `authRedirect` prop, default `/admin/auth` for admin routes |
| `src/App.tsx` | **Modify** — add `/admin/auth` route |
| `public/admin-sw.js` | **Modify** — add `/admin/auth` to cache shell |
| `src/pages/Auth.tsx` | **Modify** — add PWA standalone detection redirect |

### Future-Ready Structure

This sets up the pattern for when client/supply portals get their own PWAs:
- `/admin/auth` → Admin PWA
- `/collaborator/auth` → Collaborator PWA (when ready)
- `/portal/auth` → Client portal (future)
- `/supply/auth` → Supply portal (future)

Each portal's `ProtectedRoute` will redirect to its own scoped auth route, keeping all navigation within the PWA scope boundary.

