

## Aumentar o Logo do Sidebar

Mudanca simples: aumentar o logo de `w-10 h-10` (40px) para `w-14 h-14` (56px) no sidebar.

### Arquivo: `src/components/admin/AdminSidebar.tsx`
- Linha 101: Trocar `w-10 h-10` por `w-14 h-14` na tag `<img>` do logo
- Linha 103: Trocar `w-10 h-10` por `w-14 h-14` no fallback (div com letra "A") para manter consistencia

