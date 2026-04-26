import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Camera, FileWarning, MessageCircle, User, Calendar, StickyNote, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { HubProject } from "@/hooks/useProjectsHub";
import { computeRisk, type ProjectSignals } from "@/hooks/useProjectSignals";

function computeNextAction(project: HubProject, signals?: ProjectSignals): string | null {
  if (project.next_action) return project.next_action;
  const hasMissingProof = signals?.missingProof.has(project.id) ?? false;
  const hasOverdueInvoice = signals?.overdueInvoice.has(project.id) ?? false;
  switch (project.project_status) {
    case "pending":
    case "planning":
      return project.start_date ? "Confirm crew & materials" : "Schedule start date";
    case "in_progress":
    case "in_production":
      return "Continue execution";
    case "completed":
      return hasMissingProof ? "Upload before/after photos" : "Send final invoice";
    case "awaiting_payment":
      return hasOverdueInvoice ? "Follow up on overdue invoice" : "Collect payment";
    case "paid":
      return "Request review";
    default:
      return null;
  }
}

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
  return "planning";
}

function fmt(n: number) {
  if (n === 0) return "$0.00";
  return n >= 1000 ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${n.toFixed(2)}`;
}

interface Props {
  projects: HubProject[];
  signals?: ProjectSignals;
  onSelect: (p: HubProject) => void;
  onStatusChange?: (id: string, status: string) => void;
  onNewProject?: () => void;
}

export function ProjectPipelineBoard({ projects, signals, onSelect, onStatusChange, onNewProject }: Props) {
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
              className="flex flex-col w-[280px] sm:w-[300px] shrink-0"
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
                <span className={cn("text-sm font-bold", col.text)}>
                  {fmt(group.total)}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {group.items.map((p) => (
                  <ProjectCard key={p.id} project={p} signals={signals} onClick={() => onSelect(p)} />
                ))}

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

function ProjectCard({
  project,
  signals,
  onClick,
}: {
  project: HubProject;
  signals?: ProjectSignals;
  onClick: () => void;
}) {
  const qc = useQueryClient();
  const dateStr = project.start_date || project.created_at;
  const formattedDate = dateStr ? format(new Date(dateStr), "MMM d, yyyy") : null;

  const hasMissingProof = signals?.missingProof.has(project.id) ?? false;
  const hasOverdueInvoice = signals?.overdueInvoice.has(project.id) ?? false;
  const unreadCount = signals?.unreadChat.get(project.id) ?? 0;

  const risk = computeRisk({
    marginPercent: project.job_costs?.margin_percent,
    hasMissingProof,
    hasOverdueInvoice,
    status: project.project_status,
  });

  const dotColor =
    risk.level === "risk"
      ? "bg-[hsl(var(--state-blocked))]"
      : risk.level === "watch"
        ? "bg-[hsl(var(--state-risk))]"
        : "bg-[hsl(var(--state-success))]";

  const showProofBadge =
    hasMissingProof &&
    (project.project_status === "completed" ||
      project.project_status === "awaiting_payment" ||
      project.project_status === "paid");

  const margin = project.job_costs?.margin_percent;
  const revenue = project.job_costs?.estimated_revenue ?? 0;
  const nextAction = computeNextAction(project, signals);
  const notesPreview = project.notes?.trim().split("\n")[0] ?? null;
  const members = project.members ?? [];
  const isManualNextAction = !!project.next_action;

  async function handleCompleteAction(e: React.MouseEvent) {
    e.stopPropagation();
    const { error } = await supabase
      .from("projects")
      .update({ next_action: null, next_action_date: null })
      .eq("id", project.id);
    if (error) {
      toast.error("Could not clear action", { description: error.message });
      return;
    }
    toast.success("Action marked done");
    qc.invalidateQueries({ queryKey: ["hub-projects"] });
  }

  function initials(name: string | null) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (
    <div
      draggable
      onDragStart={() => sessionStorage.setItem("drag-project-id", project.id)}
      onDragEnd={() => sessionStorage.removeItem("drag-project-id")}
      onClick={onClick}
      title={risk.reasons.join(" · ") || "Healthy"}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className="w-full text-left p-3 rounded-lg bg-card border border-border/60 hover:border-border hover:shadow-md hover:-translate-y-px transition-all space-y-2 cursor-pointer"
    >
      {/* Header: risk dot + address + revenue */}
      <div className="flex items-start gap-2">
        <span className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", dotColor)} />
        <p className="text-sm font-semibold text-foreground leading-snug flex-1 min-w-0">
          {project.address || "No address"}
        </p>
        {revenue > 0 && (
          <span className="text-xs font-mono font-bold text-[hsl(var(--gold))] shrink-0 tabular-nums">
            ${(revenue / 1000).toFixed(1)}k
          </span>
        )}
      </div>

      {/* Customer + crew avatars + unread chat */}
      <div className="flex items-center gap-2 pl-4">
        <p className="text-xs text-muted-foreground flex-1 truncate">{project.customer_name}</p>
        {members.length > 0 && (
          <div className="flex -space-x-1.5 shrink-0" title={members.map((m) => m.full_name).filter(Boolean).join(", ")}>
            {members.slice(0, 3).map((m) => (
              <Avatar key={m.user_id} className="h-5 w-5 border border-card">
                {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                <AvatarFallback className="text-[9px] font-semibold bg-muted">
                  {initials(m.full_name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {members.length > 3 && (
              <span className="h-5 w-5 rounded-full bg-muted border border-card text-[9px] font-semibold flex items-center justify-center text-muted-foreground">
                +{members.length - 3}
              </span>
            )}
          </div>
        )}
        {unreadCount > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] font-mono font-semibold text-[hsl(var(--state-success))] shrink-0">
            <MessageCircle className="h-3 w-3" />
            {unreadCount}
          </span>
        )}
      </div>

      {/* Meta lines: Partner, Date, Notes */}
      <div className="space-y-1 pl-4">
        {project.partner_name && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{project.partner_name}</span>
          </div>
        )}
        {formattedDate && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{formattedDate}</span>
            {project.project_type && (
              <span className="text-muted-foreground/60">
                · {project.project_type}
                {project.square_footage ? ` · ${project.square_footage}sf` : ""}
              </span>
            )}
          </div>
        )}
        {notesPreview && (
          <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground/80 italic">
            <StickyNote className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{notesPreview}</span>
          </div>
        )}
      </div>

      {/* Next Action banner — clickable check to mark done (only when manual) */}
      {nextAction && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-[hsl(var(--gold))]/10 border border-[hsl(var(--gold))]/20">
          <ArrowRight className="h-3 w-3 text-[hsl(var(--gold))] shrink-0" />
          <span className="text-[11px] font-medium text-foreground/90 truncate flex-1">{nextAction}</span>
          {isManualNextAction && (
            <button
              onClick={handleCompleteAction}
              title="Mark action as done"
              className="h-5 w-5 rounded flex items-center justify-center hover:bg-[hsl(var(--gold))]/20 shrink-0"
            >
              <Check className="h-3 w-3 text-[hsl(var(--gold))]" />
            </button>
          )}
        </div>
      )}

      {/* Footer alert chips */}
      {(showProofBadge || hasOverdueInvoice || (margin != null && margin < 15)) && (
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          {margin != null && margin < 15 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[hsl(var(--state-blocked-bg))] text-[hsl(var(--state-blocked))]">
              {margin.toFixed(0)}% margin
            </span>
          )}
          {hasOverdueInvoice && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[hsl(var(--state-risk-bg))] text-[hsl(var(--state-risk))]">
              <FileWarning className="h-2.5 w-2.5" />
              Overdue
            </span>
          )}
          {showProofBadge && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[hsl(var(--state-neutral-bg))] text-[hsl(var(--state-neutral))]">
              <Camera className="h-2.5 w-2.5" />
              Need photos
            </span>
          )}
        </div>
      )}
    </div>
  );
}
