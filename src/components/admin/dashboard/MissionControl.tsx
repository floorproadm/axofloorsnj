import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, AlertTriangle, Clock, MessageSquare, Camera, PhoneOff, Timer, Zap, CheckCircle2, Circle, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Task, useTasks } from "@/hooks/useTasks";
import { NewTaskDialog } from "./NewTaskDialog";
import { format, isPast, isToday } from "date-fns";

// ---------- System Alerts (same data as before) ----------

interface SystemAlert {
  label: string;
  color: "blocked" | "risk" | "success";
  link: string;
  type: "follow_up" | "new_lead" | "stalled" | "field_upload" | "sla_followup" | "sla_estimate" | "sla_auto_escalation";
}

const dotColor = {
  blocked: "bg-[hsl(var(--state-blocked))]",
  risk: "bg-[hsl(var(--state-risk))]",
  success: "bg-[hsl(var(--state-success))]",
};

const typeIcon: Record<string, React.ElementType> = {
  follow_up: MessageSquare,
  new_lead: Clock,
  stalled: AlertTriangle,
  field_upload: Camera,
  sla_followup: PhoneOff,
  sla_estimate: Timer,
  sla_auto_escalation: Zap,
};

// ---------- Priority config ----------

const priorityConfig: Record<string, { dot: string; label: string }> = {
  urgent: { dot: "bg-[hsl(var(--state-blocked))]", label: "Urgent" },
  high: { dot: "bg-[hsl(var(--state-risk))]", label: "High" },
  medium: { dot: "bg-muted-foreground/40", label: "Medium" },
  low: { dot: "bg-muted-foreground/20", label: "Low" },
};

const statusIcon: Record<string, React.ElementType> = {
  pending: Circle,
  in_progress: Loader2,
  done: CheckCircle2,
};

// ---------- Component ----------

interface MissionControlProps {
  systemAlerts: SystemAlert[];
  isLoadingAlerts?: boolean;
}

export function MissionControl({ systemAlerts, isLoadingAlerts }: MissionControlProps) {
  const { t } = useLanguage();
  const [showCompleted, setShowCompleted] = useState(false);
  const { tasks, isLoading: isLoadingTasks, createTask, updateTask, deleteTask } = useTasks(showCompleted);

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const toggleStatus = (task: Task) => {
    const nextStatus = task.status === "pending" ? "in_progress" : task.status === "in_progress" ? "done" : "pending";
    updateTask.mutate({ id: task.id, status: nextStatus });
  };

  return (
    <div className="space-y-4">
      {/* System Alerts */}
      {(isLoadingAlerts || systemAlerts.length > 0) && (
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            {t("mission.alertasSistema")}
          </h3>
          {isLoadingAlerts ? (
            <div className="space-y-1">
              {[1, 2].map((i) => (
                <div key={i} className="h-11 bg-muted/50 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-card">
              {systemAlerts.map((alert, idx) => {
                const Icon = typeIcon[alert.type];
                return (
                  <Link
                    key={idx}
                    to={alert.link}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors group"
                  >
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", dotColor[alert.color])} />
                    {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                    <span className="flex-1 text-sm font-medium text-foreground truncate">{alert.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Manual Tasks */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t("mission.tarefas")}
            {pendingTasks.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[hsl(var(--state-risk))] text-white text-[10px] font-bold align-middle">
                {pendingTasks.length}
              </span>
            )}
          </h3>
          <NewTaskDialog
            onSubmit={(data) => createTask.mutate(data)}
            isPending={createTask.isPending}
          />
        </div>

        {isLoadingTasks ? (
          <div className="space-y-1">
            {[1, 2].map((i) => (
              <div key={i} className="h-11 bg-muted/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : pendingTasks.length === 0 && !showCompleted ? (
          <div className="text-center py-6 rounded-xl border border-dashed border-border bg-card/50">
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--state-success-bg))] flex items-center justify-center mx-auto mb-2">
              <span className="text-[hsl(var(--state-success))] text-lg">✓</span>
            </div>
            <p className="text-sm font-medium text-foreground">{t("mission.semTarefas")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("mission.todasConcluidas")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-card">
            {pendingTasks.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={toggleStatus} onDelete={(id) => deleteTask.mutate(id)} />
            ))}
          </div>
        )}

        {/* Toggle completed */}
        {(doneTasks.length > 0 || showCompleted) && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCompleted
              ? t("mission.ocultarConcluidas")
              : `${t("mission.verConcluidas")} (${doneTasks.length})`}
          </button>
        )}
        {showCompleted && doneTasks.length > 0 && (
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-card mt-2 opacity-60">
            {doneTasks.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={toggleStatus} onDelete={(id) => deleteTask.mutate(id)} />
            ))}
          </div>
        )}
      </div>

      {/* Empty state: no alerts AND no tasks */}
      {systemAlerts.length === 0 && pendingTasks.length === 0 && !isLoadingAlerts && !isLoadingTasks && (
        <div className="text-center py-6 rounded-xl border border-dashed border-border bg-card/50">
          <div className="w-10 h-10 rounded-full bg-[hsl(var(--state-success-bg))] flex items-center justify-center mx-auto mb-2">
            <span className="text-[hsl(var(--state-success))] text-lg">✓</span>
          </div>
          <p className="text-sm font-medium text-foreground">{t("mission.tudoSobControle")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("mission.semPendencias")}</p>
        </div>
      )}
    </div>
  );
}

// ---------- Task Row ----------

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = priorityConfig[task.priority] ?? priorityConfig.medium;
  const StatusIcon = statusIcon[task.status] ?? Circle;
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== "done";

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors group">
      <button onClick={() => onToggle(task)} className="flex-shrink-0 focus:outline-none">
        <StatusIcon
          className={cn(
            "w-4 h-4 transition-colors",
            task.status === "done" ? "text-[hsl(var(--state-success))]" : 
            task.status === "in_progress" ? "text-[hsl(var(--state-risk))] animate-spin" : "text-muted-foreground"
          )}
        />
      </button>
      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", cfg.dot)} />
      <div className="flex-1 min-w-0">
        <span className={cn("text-sm font-medium text-foreground truncate block", task.status === "done" && "line-through opacity-60")}>
          {task.title}
        </span>
        {(task.assignee_name || task.due_date) && (
          <div className="flex items-center gap-2 mt-0.5">
            {task.assignee_name && (
              <span className="text-[10px] text-muted-foreground">{task.assignee_name}</span>
            )}
            {task.due_date && (
              <span className={cn("text-[10px]", isOverdue ? "text-[hsl(var(--state-blocked))] font-semibold" : "text-muted-foreground")}>
                {format(new Date(task.due_date), "dd/MM")}
              </span>
            )}
          </div>
        )}
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
