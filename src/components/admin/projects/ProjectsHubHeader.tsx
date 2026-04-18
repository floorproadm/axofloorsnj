import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp, AlertTriangle, CalendarClock } from "lucide-react";
import type { HubProject } from "@/hooks/useProjectsHub";
import type { ProjectSignals } from "@/hooks/useProjectSignals";
import { computeRisk } from "@/hooks/useProjectSignals";

export type KpiFilter = "active" | "at_risk" | "this_week" | null;

interface Props {
  projects: HubProject[];
  signals?: ProjectSignals;
  activeFilter: KpiFilter;
  onFilterChange: (f: KpiFilter) => void;
}

function fmtMoney(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function isThisWeek(dateStr: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

export function ProjectsHubHeader({ projects, signals, activeFilter, onFilterChange }: Props) {
  const kpis = useMemo(() => {
    const active = projects.filter(
      (p) => p.project_status === "in_production" || p.project_status === "in_progress",
    );
    const activeRevenue = active.reduce((s, p) => s + (p.job_costs?.estimated_revenue ?? 0), 0);

    const marginValues = projects
      .map((p) => p.job_costs?.margin_percent)
      .filter((m): m is number => m != null);
    const avgMargin = marginValues.length
      ? marginValues.reduce((a, b) => a + b, 0) / marginValues.length
      : 0;

    let atRisk = 0;
    for (const p of projects) {
      if (p.project_status === "paid") continue;
      const risk = computeRisk({
        marginPercent: p.job_costs?.margin_percent,
        hasMissingProof: signals?.missingProof.has(p.id) ?? false,
        hasOverdueInvoice: signals?.overdueInvoice.has(p.id) ?? false,
        status: p.project_status,
      });
      if (risk.level === "risk") atRisk++;
    }

    const closingThisWeek = projects.filter(
      (p) =>
        (p.project_status === "in_production" || p.project_status === "in_progress") &&
        isThisWeek(p.start_date),
    ).length;

    return { activeRevenue, avgMargin, atRisk, closingThisWeek, activeCount: active.length };
  }, [projects, signals]);

  const cards: {
    key: KpiFilter;
    label: string;
    value: string;
    icon: typeof DollarSign;
    tone: string;
    clickable: boolean;
  }[] = [
    {
      key: "active",
      label: "Active Revenue",
      value: fmtMoney(kpis.activeRevenue),
      icon: DollarSign,
      tone: "text-foreground",
      clickable: kpis.activeCount > 0,
    },
    {
      key: null,
      label: "Avg Margin",
      value: `${kpis.avgMargin.toFixed(0)}%`,
      icon: TrendingUp,
      tone:
        kpis.avgMargin >= 30
          ? "text-[hsl(var(--state-success))]"
          : kpis.avgMargin >= 15
            ? "text-[hsl(var(--state-risk))]"
            : "text-[hsl(var(--state-blocked))]",
      clickable: false,
    },
    {
      key: "at_risk",
      label: "At Risk",
      value: kpis.atRisk.toString(),
      icon: AlertTriangle,
      tone:
        kpis.atRisk === 0
          ? "text-muted-foreground"
          : kpis.atRisk >= 3
            ? "text-[hsl(var(--state-blocked))]"
            : "text-[hsl(var(--state-risk))]",
      clickable: kpis.atRisk > 0,
    },
    {
      key: "this_week",
      label: "Active This Week",
      value: kpis.closingThisWeek.toString(),
      icon: CalendarClock,
      tone: "text-foreground",
      clickable: kpis.closingThisWeek > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {cards.map((c) => {
        const isActive = c.key !== null && activeFilter === c.key;
        const Element = c.clickable ? "button" : "div";
        return (
          <Element
            key={c.label}
            type={c.clickable ? "button" : undefined}
            onClick={c.clickable ? () => onFilterChange(isActive ? null : c.key) : undefined}
            className={cn(
              "rounded-lg border border-border/40 bg-muted/30 p-3 text-left transition-all relative",
              c.clickable && "hover:border-foreground/30 cursor-pointer",
              isActive && "border-primary bg-primary/5 ring-1 ring-primary/30",
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                {c.label}
              </p>
              <c.icon
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground/60",
                )}
              />
            </div>
            <p className={cn("text-2xl font-bold leading-tight mt-0.5", c.tone)}>
              {c.value}
            </p>
          </Element>
        );
      })}
    </div>
  );
}
