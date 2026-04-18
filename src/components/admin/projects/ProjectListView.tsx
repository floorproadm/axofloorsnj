import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { MapPin, MessageCircle, Camera, FileWarning } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { HubProject } from "@/hooks/useProjectsHub";
import { computeRisk, type ProjectSignals } from "@/hooks/useProjectSignals";

function fmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-[hsl(var(--state-risk-bg))] text-[hsl(var(--state-risk))] border-[hsl(var(--state-risk)/0.3)]" },
    in_production: { label: "Active", className: "bg-[hsl(var(--state-success-bg))] text-[hsl(var(--state-success))] border-[hsl(var(--state-success)/0.3)]" },
    in_progress: { label: "Active", className: "bg-[hsl(var(--state-success-bg))] text-[hsl(var(--state-success))] border-[hsl(var(--state-success)/0.3)]" },
    completed: { label: "Done", className: "bg-[hsl(var(--state-neutral-bg))] text-[hsl(var(--state-neutral))] border-[hsl(var(--state-neutral)/0.3)]" },
    paid: { label: "Paid", className: "bg-[hsl(var(--state-success-bg))] text-[hsl(var(--state-success))] border-[hsl(var(--state-success)/0.3)]" },
  };
  const s = map[status] ?? { label: status, className: "" };
  return <Badge variant="outline" className={cn("text-[10px] h-5", s.className)}>{s.label}</Badge>;
}

function riskDotClass(level: "healthy" | "watch" | "risk") {
  return level === "risk"
    ? "bg-[hsl(var(--state-blocked))]"
    : level === "watch"
      ? "bg-[hsl(var(--state-risk))]"
      : "bg-[hsl(var(--state-success))]";
}

interface Props {
  projects: HubProject[];
  signals?: ProjectSignals;
  onSelect: (p: HubProject) => void;
}

export function ProjectListView({ projects, signals, onSelect }: Props) {
  const isMobile = useIsMobile();

  const enriched = projects.map((p) => {
    const hasMissingProof = signals?.missingProof.has(p.id) ?? false;
    const hasOverdueInvoice = signals?.overdueInvoice.has(p.id) ?? false;
    const unreadCount = signals?.unreadChat.get(p.id) ?? 0;
    const risk = computeRisk({
      marginPercent: p.job_costs?.margin_percent,
      hasMissingProof,
      hasOverdueInvoice,
      status: p.project_status,
    });
    const showProofBadge =
      hasMissingProof &&
      (p.project_status === "completed" ||
        p.project_status === "awaiting_payment" ||
        p.project_status === "paid");
    return { p, risk, hasOverdueInvoice, showProofBadge, unreadCount };
  });

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2">
        {enriched.map(({ p, risk, hasOverdueInvoice, showProofBadge, unreadCount }) => (
          <Card key={p.id} className="p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onSelect(p)}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium truncate flex items-center gap-1.5 min-w-0">
                <span className={cn("h-2 w-2 rounded-full shrink-0", riskDotClass(risk.level))} />
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">{p.address || p.customer_name}</span>
              </p>
              {statusBadge(p.project_status)}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
              <span>{p.project_type}</span>
              {p.square_footage && <span>{p.square_footage} sqft</span>}
              {unreadCount > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[hsl(var(--state-success))]">
                  <MessageCircle className="h-3 w-3" />
                  {unreadCount}
                </span>
              )}
              {hasOverdueInvoice && <FileWarning className="h-3 w-3 text-[hsl(var(--state-risk))]" />}
              {showProofBadge && <Camera className="h-3 w-3 text-[hsl(var(--state-neutral))]" />}
              {p.job_costs?.estimated_revenue && (
                <span className="font-mono font-semibold ml-auto text-foreground">{fmt(p.job_costs.estimated_revenue)}</span>
              )}
            </div>
          </Card>
        ))}
        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No projects found</p>
        )}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-6"></TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Sqft</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Margin</TableHead>
          <TableHead>Signals</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {enriched.map(({ p, risk, hasOverdueInvoice, showProofBadge, unreadCount }) => (
          <TableRow
            key={p.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onSelect(p)}
            title={risk.reasons.join(" · ") || "Healthy"}
          >
            <TableCell>
              <span className={cn("inline-block h-2 w-2 rounded-full", riskDotClass(risk.level))} />
            </TableCell>
            <TableCell className="font-medium">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                {p.address || "—"}
              </span>
            </TableCell>
            <TableCell>{p.customer_name}</TableCell>
            <TableCell>
              <Badge variant="outline" className="text-[10px]">{p.project_type}</Badge>
            </TableCell>
            <TableCell className="text-right font-mono">{p.square_footage ?? "—"}</TableCell>
            <TableCell className="text-right font-mono">
              {p.job_costs?.estimated_revenue ? fmt(p.job_costs.estimated_revenue) : "—"}
            </TableCell>
            <TableCell className="text-right">
              {p.job_costs?.margin_percent != null ? (
                <span
                  className={cn(
                    "font-mono text-xs font-semibold",
                    p.job_costs.margin_percent >= 30
                      ? "text-[hsl(var(--state-success))]"
                      : p.job_costs.margin_percent >= 15
                        ? "text-[hsl(var(--state-risk))]"
                        : "text-[hsl(var(--state-blocked))]",
                  )}
                >
                  {p.job_costs.margin_percent.toFixed(0)}%
                </span>
              ) : "—"}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold text-[hsl(var(--state-success))]">
                    <MessageCircle className="h-3 w-3" />
                    {unreadCount}
                  </span>
                )}
                {hasOverdueInvoice && (
                  <FileWarning className="h-3 w-3 text-[hsl(var(--state-risk))]" />
                )}
                {showProofBadge && (
                  <Camera className="h-3 w-3 text-[hsl(var(--state-neutral))]" />
                )}
                {!unreadCount && !hasOverdueInvoice && !showProofBadge && (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </TableCell>
            <TableCell>{statusBadge(p.project_status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
