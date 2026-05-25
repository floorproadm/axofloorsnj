import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight, AlertTriangle, Clock, MessageSquare, Camera,
  PhoneOff, Timer, Zap, CheckCircle2, Circle, PlayCircle, Trash2, X, BellOff,
  User, Calendar, Flag, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Task, useTasks } from "@/hooks/useTasks";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { format, isPast, isToday } from "date-fns";

import {
  mcAlertKey as alertKey,
  readMcDismissed as readDismissed,
  writeMcDismissed as writeDismissed,
  MC_DISMISSED_EVENT,
} from "@/lib/missionControlDismissed";

// ---------- System Alerts ----------

interface SystemAlert {
  label: string;
  color: "blocked" | "risk" | "success";
  link: string;
  type: string;
  entityId?: string | null;
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
  const [dismissed, setDismissed] = useState<string[]>(() => readDismissed());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    const onChange = () => setDismissed(readDismissed());
    window.addEventListener(MC_DISMISSED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(MC_DISMISSED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const visibleAlerts = systemAlerts.filter((a) => !dismissed.includes(alertKey(a)));
  const dismissAlert = (a: SystemAlert) => {
    const next = Array.from(new Set([...dismissed, alertKey(a)]));
    setDismissed(next);
    writeDismissed(next);
  };
  const clearAllAlerts = () => {
    const next = Array.from(new Set([...dismissed, ...systemAlerts.map(alertKey)]));
    setDismissed(next);
    writeDismissed(next);
  };

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const isLoading = isLoadingAlerts || isLoadingTasks;

  const toggleStatus = (task: Task) => {
    const next = task.status === "pending" ? "in_progress" : task.status === "in_progress" ? "done" : "pending";
    updateTask.mutate({ id: task.id, status: next });
  };

  const hasAlerts = visibleAlerts.length > 0;
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
      {/* Clear all alerts header */}
      {hasAlerts && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Alertas ({visibleAlerts.length})
          </span>
          <button
            onClick={clearAllAlerts}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            title="Limpar todas as notificações"
          >
            <BellOff className="w-3 h-3" />
            Limpar tudo
          </button>
        </div>
      )}

      {/* Unified list: alerts first, then tasks */}
      <div className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-card">
        {/* System Alerts */}
        {visibleAlerts.map((alert, idx) => {
          const Icon = typeIcon[alert.type];
          return (
            <div
              key={`alert-${idx}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors group"
            >
              <Link to={alert.link} className="flex items-center gap-3 flex-1 min-w-0">
                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", dotColor[alert.color])} />
                {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                <span className="flex-1 text-sm font-medium text-foreground truncate">{alert.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissAlert(alert); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                title="Dispensar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
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
          <TaskRow key={task.id} task={task} onToggle={toggleStatus} onDelete={(id) => deleteTask.mutate(id)} onOpen={setSelectedTask} />
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
        </div>
      )}

      {/* Completed tasks */}
      {showCompleted && doneTasks.length > 0 && (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-card opacity-50">
          {doneTasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={toggleStatus} onDelete={(id) => deleteTask.mutate(id)} onOpen={setSelectedTask} />
          ))}
        </div>
      )}

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(o) => !o && setSelectedTask(null)}
        onToggle={toggleStatus}
        onDelete={(id) => { deleteTask.mutate(id); setSelectedTask(null); }}
      />
    </div>
  );
}

// ---------- Task Row ----------

function TaskRow({ task, onToggle, onDelete, onOpen }: { task: Task; onToggle: (t: Task) => void; onDelete: (id: string) => void; onOpen: (t: Task) => void }) {
  const dot = priorityDot[task.priority] ?? priorityDot.medium;
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== "done";
  const isDone = task.status === "done";
  const isInProgress = task.status === "in_progress";

  return (
    <div
      onClick={() => onOpen(task)}
      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors group cursor-pointer"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(task); }}
        className="flex-shrink-0 focus:outline-none"
        title="Toggle status"
      >
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
        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ---------- Task Detail Sheet ----------

function TaskDetailSheet({
  task, open, onOpenChange, onToggle, onDelete,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onToggle: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  if (!task) return null;
  const isDone = task.status === "done";
  const isInProgress = task.status === "in_progress";
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && !isDone;

  const relatedLink = task.related_project_id
    ? `/admin/projects/${task.related_project_id}`
    : task.related_lead_id
    ? `/admin/leads/${task.related_lead_id}`
    : task.related_partner_id
    ? `/admin/partners/${task.related_partner_id}`
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", priorityDot[task.priority] ?? priorityDot.medium)} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {task.priority}
            </span>
            {isDone && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--state-success))]">
                · Concluída
              </span>
            )}
            {isInProgress && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--gold-warm))]">
                · Em progresso
              </span>
            )}
          </div>
          <SheetTitle className={cn("text-left", isDone && "line-through opacity-60")}>
            {task.title}
          </SheetTitle>
          {task.description && (
            <SheetDescription className="text-left whitespace-pre-wrap">
              {task.description}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-3 text-sm">
          {task.assignee_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="text-foreground">{task.assignee_name}</span>
            </div>
          )}
          {task.partner_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>🤝</span>
              <span className="text-foreground">{task.partner_name}</span>
            </div>
          )}
          {task.due_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className={cn(isOverdue ? "text-[hsl(var(--state-blocked))] font-semibold" : "text-foreground")}>
                {format(new Date(task.due_date), "dd MMM yyyy")}
                {isOverdue && " · Atrasada"}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flag className="w-4 h-4" />
            <span className="text-foreground capitalize">{task.status.replace("_", " ")}</span>
          </div>
          {!task.description && (
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <FileText className="w-4 h-4" />
              <span className="italic">Sem descrição</span>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <Button onClick={() => onToggle(task)} variant="default" className="w-full">
            {isDone ? "Reabrir" : isInProgress ? "Marcar como concluída" : "Iniciar tarefa"}
          </Button>
          {relatedLink && (
            <Button asChild variant="outline" className="w-full">
              <Link to={relatedLink} onClick={() => onOpenChange(false)}>
                Abrir item relacionado
              </Link>
            </Button>
          )}
          <Button
            onClick={() => onDelete(task.id)}
            variant="ghost"
            className="w-full text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir tarefa
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
