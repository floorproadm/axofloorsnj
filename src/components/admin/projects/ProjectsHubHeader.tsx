import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp, AlertTriangle, CalendarClock } from "lucide-react";
import type { HubProject } from "@/hooks/useProjectsHub";
import type { ProjectSignals } from "@/hooks/useProjectSignals";
import { computeRisk } from "@/hooks/useProjectSignals";

interface Props {
  projects: HubProject[];
  signals?: ProjectSignals;
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

export function ProjectsHubHeader({ projects, signals }: Props) {
  const kpis = useMemo(() => {
    const active = projects.filter(
      (p) => p.project_status === "in_production" || p.project_status === "in_progress"
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
        isThisWeek(p.start_date)
    ).length;

    return { activeRevenue, avgMargin, atRisk, closingThisWeek };
  }, [projects, signals]);

  const cards = [
    {
      label: "Active Revenue",
      value: fmtMoney(kpis.activeRevenue),
      icon: DollarSign,
      tone: "text-foreground",
    },
    {
      label: "Avg Margin",
      value: `${kpis.avgMargin.toFixed(0)}%`,
      icon: TrendingUp,
      tone:
        kpis.avgMargin >= 30
          ? "text-[hsl(var(--state-success))]"
          : kpis.avgMargin >= 15
            ? "text-[hsl(var(--state-risk))]"
            : "text-[hsl(var(--state-blocked))]",
    },
    {
      label: "At Risk",
      value: kpis.atRisk.toString(),
      icon: AlertTriangle,
      tone:
        kpis.atRisk === 0
          ? "text-muted-foreground"
          : kpis.atRisk >= 3
            ? "text-[hsl(var(--state-blocked))]"
            : "text-[hsl(var(--state-risk))]",
    },
    {
      label: "Active This Week",
      value: kpis.closingThisWeek.toString(),
      icon: CalendarClock,
      tone: "text-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-lg border bg-card p-3 flex items-center gap-3"
        >
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            <c.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
              {c.label}
            </p>
            <p className={cn("text-base font-mono font-semibold leading-tight", c.tone)}>
              {c.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
