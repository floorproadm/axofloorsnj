import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  related_project_id: string | null;
  related_lead_id: string | null;
  related_partner_id: string | null;
  due_date: string | null;
  created_by: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  assignee_name?: string | null;
  partner_name?: string | null;
}

interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: string;
  assigned_to?: string | null;
  related_project_id?: string | null;
  related_lead_id?: string | null;
  related_partner_id?: string | null;
  due_date?: string | null;
}

interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  assigned_to?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
}

export function useTasks(showCompleted = false) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tasks", showCompleted],
    queryFn: async () => {
      let q = supabase
        .from("tasks" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (!showCompleted) {
        q = q.neq("status", "done");
      }

      const { data, error } = await q;
      if (error) throw error;

      // Fetch assignee names
      const tasks = (data ?? []) as unknown as Task[];
      const assigneeIds = [...new Set(tasks.map((t) => t.assigned_to).filter(Boolean))] as string[];
      const partnerIds = [...new Set(tasks.map((t) => t.related_partner_id).filter(Boolean))] as string[];

      if (assigneeIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", assigneeIds);

        const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));
        tasks.forEach((t) => {
          if (t.assigned_to) t.assignee_name = nameMap.get(t.assigned_to) ?? null;
        });
      }

      if (partnerIds.length > 0) {
        const { data: partners } = await supabase
          .from("partners")
          .select("id, company_name")
          .in("id", partnerIds);

        const partnerMap = new Map((partners ?? []).map((p) => [p.id, p.company_name]));
        tasks.forEach((t) => {
          if (t.related_partner_id) t.partner_name = partnerMap.get(t.related_partner_id) ?? null;
        });
      }

      return tasks;
    },
    staleTime: 30_000,
  });

  const createTask = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data, error } = await supabase
        .from("tasks" as any)
        .insert({
          title: input.title,
          description: input.description ?? null,
          priority: input.priority ?? "medium",
          assigned_to: input.assigned_to ?? null,
          related_project_id: input.related_project_id ?? null,
          related_lead_id: input.related_lead_id ?? null,
          related_partner_id: input.related_partner_id ?? null,
          due_date: input.due_date ?? null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const updateTask = useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const { id, ...updates } = input;
      // Auto-set completed_at
      if (updates.status === "done" && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
      }
      if (updates.status && updates.status !== "done") {
        updates.completed_at = null;
      }
      const { error } = await supabase
        .from("tasks" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    createTask,
    updateTask,
    deleteTask,
  };
}
