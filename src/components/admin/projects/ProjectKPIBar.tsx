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
  const balance = estimatedRevenue - totalCost;

  const marginColor =
    margin >= 30
      ? "text-[hsl(var(--state-success))]"
      : margin >= 15
        ? "text-[hsl(var(--state-risk))]"
        : "text-[hsl(var(--state-blocked))]";

  const profitColor =
    profit > 0
      ? "text-[hsl(var(--state-success))]"
      : profit < 0
        ? "text-[hsl(var(--state-blocked))]"
        : "text-foreground";

  const cells: KPICell[] = [
    { label: "Value", value: fmt(estimatedRevenue) },
    { label: "Costs", value: fmt(totalCost) },
    { label: "Profit", value: fmt(profit), color: profitColor },
    { label: "Margin", value: `${margin.toFixed(0)}%`, color: marginColor },
    { label: "Balance", value: fmt(balance) },
  ];

  return (
    <>
      {/* Mobile: dense horizontal scroller with dividers */}
      <div
        className={cn(
          "sm:hidden -mx-4 px-4 py-2.5 border-y border-border/60 bg-muted/30",
          className
        )}
      >
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          {cells.map((c, i) => (
            <div key={c.label} className="flex items-center gap-3 flex-none">
              {i > 0 && <div className="h-7 w-px bg-border/70" />}
              <div className="min-w-[64px]">
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider leading-none mb-1">
                  {c.label}
                </p>
                <p
                  className={cn(
                    "text-sm font-bold tabular-nums leading-none text-foreground",
                    c.color
                  )}
                >
                  {c.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: original card grid */}
      <div className={cn("hidden sm:grid grid-cols-5 gap-2", className)}>
        {cells.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-border/40 bg-muted/30 p-3 text-left"
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
              {c.label}
            </p>
            <p
              className={cn(
                "text-lg font-bold leading-tight mt-0.5 text-foreground tabular-nums",
                c.color
              )}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
