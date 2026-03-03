import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight, AlertTriangle, Clock, MessageSquare, Camera,
  PhoneOff, Timer, Zap, CheckCircle2, Circle, PlayCircle, Trash2, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Task, useTasks } from "@/hooks/useTasks";
import { NewTaskDialog } from "./NewTaskDialog";
import { format, isPast, isToday } from "date-fns";

// ---------- System Alerts ----------

interface SystemAlert {
  label: string;
  color: "blocked" | "risk" | "success";
  link: string;
  type: string;
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

// ---------- Priority ----------

const priorityDot: Record<string, string> = {
  urgent: "bg-[hsl(var(--state-blocked))]",
  high: "bg-[hsl(var(--state-risk))]",
  medium: "bg-muted-foreground/40",
  low: "bg-muted-foreground/20",
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
  const isLoading = isLoadingAlerts || isLoadingTasks;

  const toggleStatus = (task: Task) => {
    const next = task.status === "pending" ? "in_progress" : task.status === "in_progress" ? "done" : "pending";
    updateTask.mutate({ id: task.id, status: next });
  };

  const hasAlerts = systemAlerts.length > 0;
  const hasTasks = pendingTasks.length > 0;
  const isEmpty = !hasAlerts && !hasTasks && !isLoading;

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted/50 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <Link to="/admin/leads" className="block text-center py-8 rounded-xl border border-dashed border-border bg-card/50 hover:bg-secondary/40 transition-colors cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-[hsl(var(--state-success-bg))] flex items-center justify-center mx-auto mb-2">
          <span className="text-[hsl(var(--state-success))] text-lg">✓</span>
        </div>
        <p className="text-sm font-medium text-foreground">{t("mission.tudoSobControle")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("mission.semPendencias")}</p>
      </Link>
    );
  }

  return (
    <div className="space-y-5">
      {/* Unified list: alerts first, then tasks */}
      <div className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-card">
        {/* System Alerts */}
        {systemAlerts.map((alert, idx) => {
          const Icon = typeIcon[alert.type];
          return (
            <Link
              key={`alert-${idx}`}
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

        {/* Separator label between alerts and tasks */}
        {hasAlerts && hasTasks && (
          <div className="px-4 py-1.5 bg-muted/30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t("mission.tarefas")}
            </span>
          </div>
        )}

        {/* Manual Tasks */}
        {pendingTasks.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={toggleStatus} onDelete={(id) => deleteTask.mutate(id)} />
        ))}
      </div>

      {/* Footer: completed toggle */}
      {doneTasks.length > 0 && (
      <div className="flex items-center justify-end">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCompleted ? t("mission.ocultarConcluidas") : `${t("mission.verConcluidas")} (${doneTasks.length})`}
          </button>
        )}
      </div>

      {/* Completed tasks */}
      {showCompleted && doneTasks.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-card opacity-50">
          {doneTasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={toggleStatus} onDelete={(id) => deleteTask.mutate(id)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Task Row ----------

function TaskRow({ task, onToggle, onDelete }: { task: Task; onToggle: (t: Task) => void; onDelete: (id: string) => void }) {
  const dot = priorityDot[task.priority] ?? priorityDot.medium;
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== "done";
  const isDone = task.status === "done";
  const isInProgress = task.status === "in_progress";

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors group">
      <button onClick={() => onToggle(task)} className="flex-shrink-0 focus:outline-none" title="Toggle status">
        {isDone ? (
          <CheckCircle2 className="w-4 h-4 text-[hsl(var(--state-success))]" />
        ) : isInProgress ? (
          <PlayCircle className="w-4 h-4 text-[hsl(var(--gold-warm))]" />
        ) : (
          <Circle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
        )}
      </button>
      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", dot)} />
      <div className="flex-1 min-w-0">
        <span className={cn("text-sm font-medium text-foreground truncate block", isDone && "line-through opacity-50")}>
          {task.title}
        </span>
        {(task.assignee_name || task.due_date || task.partner_name) && (
          <div className="flex items-center gap-2 mt-0.5">
            {task.partner_name && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                🤝 {task.partner_name}
              </span>
            )}
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
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
