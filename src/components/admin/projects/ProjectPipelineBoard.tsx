import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { HubProject } from "@/hooks/useProjectsHub";

const COLUMNS = [
  { key: "planning", label: "Planning", color: "bg-amber-500", text: "text-amber-500" },
  { key: "in_progress", label: "In Progress", color: "bg-blue-500", text: "text-blue-500" },
  { key: "completed", label: "Completed", color: "bg-emerald-500", text: "text-emerald-500" },
  { key: "awaiting_payment", label: "Awaiting Payment", color: "bg-orange-400", text: "text-orange-400" },
  { key: "paid", label: "Paid", color: "bg-red-400", text: "text-red-400" },
] as const;

function matchColumn(status: string): string {
  if (status === "in_production" || status === "in_progress") return "in_progress";
  if (status === "completed") return "completed";
  if (status === "awaiting_payment") return "awaiting_payment";
  if (status === "paid") return "paid";
  return "planning"; // pending, planning, etc
}

function fmt(n: number) {
  if (n === 0) return "$0.00";
  return n >= 1000 ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${n.toFixed(2)}`;
}

interface Props {
  projects: HubProject[];
  onSelect: (p: HubProject) => void;
  onStatusChange?: (id: string, status: string) => void;
  onNewProject?: () => void;
}

export function ProjectPipelineBoard({ projects, onSelect, onStatusChange, onNewProject }: Props) {
  const grouped = useMemo(() => {
    const map: Record<string, { items: HubProject[]; total: number }> = {};
    for (const col of COLUMNS) {
      map[col.key] = { items: [], total: 0 };
    }
    for (const p of projects) {
      const key = matchColumn(p.project_status);
      if (map[key]) {
        map[key].items.push(p);
        map[key].total += p.job_costs?.estimated_revenue ?? 0;
      }
    }
    return map;
  }, [projects]);

  return (
    <div className="flex-1 overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {COLUMNS.map((col) => {
          const group = grouped[col.key];
          return (
            <div
              key={col.key}
              className="flex flex-col w-[260px] sm:w-[280px] shrink-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const dragId = sessionStorage.getItem("drag-project-id");
                if (dragId && onStatusChange) {
                  const statusMap: Record<string, string> = {
                    planning: "pending",
                    in_progress: "in_production",
                    completed: "completed",
                    awaiting_payment: "awaiting_payment",
                    paid: "paid",
                  };
                  onStatusChange(dragId, statusMap[col.key] ?? col.key);
                  sessionStorage.removeItem("drag-project-id");
                }
              }}
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-3">
                <Badge className={cn("text-[11px] font-semibold px-2 py-0.5 rounded", col.color, "text-white border-0")}>
                  {col.label}
                </Badge>
                <span className={cn("text-sm font-mono font-medium", col.text)}>
                  {fmt(group.total)}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {group.items.map((p) => (
                  <ProjectCard key={p.id} project={p} onClick={() => onSelect(p)} />
                ))}

                {/* New page button */}
                <button
                  onClick={onNewProject}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground py-2 px-1 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New page
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: HubProject; onClick: () => void }) {
  const dateStr = project.start_date || project.created_at;
  const formattedDate = dateStr
    ? format(new Date(dateStr), "dd/MM/yyyy h:mm a")
    : null;

  return (
    <button
      draggable
      onDragStart={() => sessionStorage.setItem("drag-project-id", project.id)}
      onDragEnd={() => sessionStorage.removeItem("drag-project-id")}
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg bg-card border border-border/60 hover:border-border hover:shadow-sm transition-all space-y-1.5"
    >
      {/* Address */}
      <p className="text-sm font-semibold text-foreground leading-snug">
        {project.address || "No address"}
      </p>

      {/* Customer */}
      <p className="text-xs text-muted-foreground">
        {project.customer_name}
      </p>

      {/* Date */}
      {formattedDate && (
        <p className="text-xs text-muted-foreground/70">
          {formattedDate}
        </p>
      )}

      {/* Service type */}
      {project.project_type && (
        <p className="text-xs text-muted-foreground">
          {project.project_type}
          {project.square_footage ? ` · ${project.square_footage} sqft` : ""}
        </p>
      )}
    </button>
  );
}
