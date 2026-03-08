

# Unify KPI Card Style: Overview → Match Weekly

The Overview tab uses `text-xl` for values with an icon on the right, while the Weekly tab uses `text-2xl` with a simpler layout (no icon). We'll align the Overview cards to match Weekly's structure.

## Change

**`src/pages/admin/Performance.tsx`** — Lines 141-152 (Overview KPI cards rendering)

Replace the current card layout that has:
- Icon on the top-right (`flex justify-between` + `<k.icon>`)
- `text-xl` value size

With the Weekly pattern:
- Label on top (no icon)
- `text-2xl font-bold` value
- Sub text below

Specifically:
```tsx
// FROM (Overview - current)
<div className="flex items-center justify-between mb-1.5">
  <span className="text-[10px] ...">{k.label}</span>
  <k.icon className={cn("w-4 h-4", k.color)} />
</div>
<p className={cn("text-xl font-bold", k.color)}>{k.value}</p>
<p className="text-[11px] ... mt-0.5">{k.sub}</p>

// TO (matching Weekly)
<p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">{k.label}</p>
<p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
<p className="text-[11px] text-muted-foreground">{k.sub}</p>
```

This removes the icon from each card and bumps the value to `text-2xl`, matching the Weekly tab exactly.

