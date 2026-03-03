import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CheckCircle, Plus, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PartnerChecklistProps {
  partnerId: string;
}

interface ChecklistTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  completed_at: string | null;
  created_at: string;
}

export function PartnerChecklist({ partnerId }: PartnerChecklistProps) {
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState("");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["partner-checklist", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks" as any)
        .select("id, title, status, priority, completed_at, created_at")
        .eq("related_partner_id", partnerId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ChecklistTask[];
    },
  });

  const createTask = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase
        .from("tasks" as any)
        .insert({
          title,
          related_partner_id: partnerId,
          priority: "medium",
          status: "pending",
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-checklist", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewItem("");
    },
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from("tasks" as any)
        .update({
          status: done ? "done" : "pending",
          completed_at: done ? new Date().toISOString() : null,
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-checklist", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-checklist", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItem.trim();
    if (!trimmed) return;
    createTask.mutate(trimmed);
  };

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-primary" />
          Tarefas
        </h3>
        {totalCount > 0 && (
          <span className="text-xs text-muted-foreground font-medium">
            {doneCount}/{totalCount} concluídas
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {tasks.length > 0 && (
            <div className="space-y-1">
              {tasks.map((task) => {
                const isDone = task.status === "done";
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-2.5 group rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50",
                      isDone && "opacity-50"
                    )}
                  >
                    <Checkbox
                      checked={isDone}
                      onCheckedChange={(checked) =>
                        toggleTask.mutate({ id: task.id, done: !!checked })
                      }
                      className="flex-shrink-0"
                    />
                    <span
                      className={cn(
                        "text-sm flex-1 min-w-0 truncate",
                        isDone && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => deleteTask.mutate(task.id)}
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Adicionar tarefa..."
              className="h-8 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
              disabled={createTask.isPending}
            />
          </form>
        </>
      )}
    </div>
  );
}
