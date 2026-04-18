import { cn } from "@/lib/utils";

interface KPICell {
  label: string;
  value: string;
  color?: string;
}

interface ProjectKPIBarProps {
  estimatedRevenue: number;
  totalCost: number;
  className?: string;
}

function fmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
}

export function ProjectKPIBar({ estimatedRevenue, totalCost, className }: ProjectKPIBarProps) {
  const profit = estimatedRevenue - totalCost;
  const margin = estimatedRevenue > 0 ? (profit / estimatedRevenue) * 100 : 0;
  const balance = estimatedRevenue - totalCost; // simplified

  const marginColor =
    margin >= 30
      ? "text-[hsl(var(--state-success))]"
      : margin >= 15
        ? "text-[hsl(var(--state-risk))]"
        : "text-[hsl(var(--state-blocked))]";

  const cells: KPICell[] = [
    { label: "Value", value: fmt(estimatedRevenue) },
    { label: "Costs", value: fmt(totalCost) },
    { label: "Profit", value: fmt(profit), color: profit >= 0 ? "text-[hsl(var(--state-success))]" : "text-[hsl(var(--state-blocked))]" },
    { label: "Margin", value: `${margin.toFixed(0)}%`, color: marginColor },
    { label: "Balance", value: fmt(balance) },
  ];

  return (
    <div className={cn("grid grid-cols-5 gap-2", className)}>
      {cells.map((c) => (
        <div
          key={c.label}
          className="rounded-lg border border-border/40 bg-muted/30 p-3 text-left"
        >
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
            {c.label}
          </p>
          <p className={cn("text-lg font-bold leading-tight mt-0.5 text-foreground", c.color)}>
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}
