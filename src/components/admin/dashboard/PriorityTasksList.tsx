import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, AlertTriangle, Clock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriorityTask {
  label: string;
  color: "blocked" | "risk" | "success";
  link: string;
  type: "follow_up" | "new_lead" | "stalled";
}

interface PriorityTasksListProps {
  tasks: PriorityTask[];
  isLoading?: boolean;
}

const dotColor = {
  blocked: "bg-[hsl(var(--state-blocked))]",
  risk: "bg-[hsl(var(--state-risk))]",
  success: "bg-[hsl(var(--state-success))]",
};

const typeIcon = {
  follow_up: MessageSquare,
  new_lead: Clock,
  stalled: AlertTriangle,
};

export function PriorityTasksList({ tasks, isLoading }: PriorityTasksListProps) {
  if (isLoading) {
    return (
      <div className="space-y-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted/50 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-6 rounded-xl border border-dashed border-border bg-card/50">
        <div className="w-10 h-10 rounded-full bg-[hsl(var(--state-success-bg))] flex items-center justify-center mx-auto mb-2">
          <span className="text-[hsl(var(--state-success))] text-lg">✓</span>
        </div>
        <p className="text-sm font-medium text-foreground">Pipeline sob controle</p>
        <p className="text-xs text-muted-foreground mt-0.5">Sem tarefas pendentes</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-card">
      {tasks.map((task, idx) => {
        const Icon = typeIcon[task.type];
        return (
          <Link
            key={idx}
            to={task.link}
            className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors group"
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                dotColor[task.color]
              )}
            />
            <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="flex-1 text-sm font-medium text-foreground truncate">
              {task.label}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}
