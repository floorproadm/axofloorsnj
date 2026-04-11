import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin, User } from "lucide-react";
import type { HubProject } from "@/hooks/useProjectsHub";

const COLUMNS = [
  { key: "pending", label: "Pending", color: "border-l-[hsl(var(--state-risk))]" },
  { key: "in_progress", label: "Active", color: "border-l-[hsl(var(--state-success))]" },
  { key: "completed", label: "Done", color: "border-l-[hsl(var(--state-neutral))]" },
] as const;

function matchColumn(status: string): string {
  if (status === "in_production" || status === "in_progress") return "in_progress";
  if (status === "completed" || status === "paid") return "completed";
  return "pending";
}

function fmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
}

interface Props {
  projects: HubProject[];
  onSelect: (p: HubProject) => void;
  onStatusChange?: (id: string, status: string) => void;
}

export function ProjectPipelineBoard({ projects, onSelect, onStatusChange }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);

  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: projects.filter((p) => matchColumn(p.project_status) === col.key),
    total: projects
      .filter((p) => matchColumn(p.project_status) === col.key)
      .reduce((s, p) => s + (p.job_costs?.estimated_revenue ?? 0), 0),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {grouped.map((col) => (
        <div
          key={col.key}
          className="flex flex-col gap-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragId && onStatusChange) {
              const statusMap: Record<string, string> = { pending: "pending", in_progress: "in_production", completed: "completed" };
              onStatusChange(dragId, statusMap[col.key] ?? col.key);
            }
            setDragId(null);
          }}
        >
          {/* Column header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.label}</span>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{col.items.length}</Badge>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{fmt(col.total)}</span>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-1.5 min-h-[120px]">
            {col.items.map((p) => (
              <Card
                key={p.id}
                draggable
                onDragStart={() => setDragId(p.id)}
                onClick={() => onSelect(p)}
                className={cn(
                  "border-l-[3px] p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                  col.color
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      {p.address || "No address"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <User className="h-3 w-3 shrink-0" />
                      {p.customer_name || <em>Pending info</em>}
                    </p>
                  </div>
                  {p.job_costs?.estimated_revenue ? (
                    <span className="text-xs font-mono font-semibold shrink-0">
                      {fmt(p.job_costs.estimated_revenue)}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                    {p.project_type}
                  </Badge>
                  {p.square_footage ? (
                    <span className="text-[10px] text-muted-foreground">{p.square_footage} sqft</span>
                  ) : null}
                  {p.job_costs?.margin_percent != null && (
                    <span
                      className={cn(
                        "text-[10px] font-mono font-semibold ml-auto",
                        p.job_costs.margin_percent >= 30
                          ? "text-[hsl(var(--state-success))]"
                          : p.job_costs.margin_percent >= 15
                            ? "text-[hsl(var(--state-risk))]"
                            : "text-[hsl(var(--state-blocked))]"
                      )}
                    >
                      {p.job_costs.margin_percent.toFixed(0)}%
                    </span>
                  )}
                </div>
              </Card>
            ))}
            {col.items.length === 0 && (
              <div className="flex items-center justify-center h-20 rounded-lg border border-dashed text-xs text-muted-foreground">
                No projects
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
