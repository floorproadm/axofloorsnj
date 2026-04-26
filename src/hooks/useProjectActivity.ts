import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityItem {
  id: string;
  kind: "comment" | "task" | "media" | "invoice";
  title: string;
  subtitle: string | null;
  created_at: string;
  done?: boolean;
}

export function useProjectActivity(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-activity", projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!projectId) return [];
      const [comments, tasks, media, invoices] = await Promise.all([
        supabase
          .from("project_comments")
          .select("id, content, author_name, created_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("tasks")
          .select("id, title, status, due_date, created_at, completed_at")
          .eq("related_project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("media_files")
          .select("id, file_name, created_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("invoices")
          .select("id, invoice_number, status, created_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      const items: ActivityItem[] = [];

      (comments.data ?? []).forEach((c: any) =>
        items.push({
          id: `c-${c.id}`,
          kind: "comment",
          title: c.content.slice(0, 80),
          subtitle: c.author_name,
          created_at: c.created_at,
        }),
      );
      (tasks.data ?? []).forEach((t: any) =>
        items.push({
          id: `t-${t.id}`,
          kind: "task",
          title: t.title,
          subtitle: t.due_date ? `Due ${t.due_date}` : t.status,
          created_at: t.created_at,
          done: t.status === "completed" || !!t.completed_at,
        }),
      );
      (media.data ?? []).forEach((m: any) =>
        items.push({
          id: `m-${m.id}`,
          kind: "media",
          title: m.file_name,
          subtitle: "Uploaded",
          created_at: m.created_at,
        }),
      );
      (invoices.data ?? []).forEach((i: any) =>
        items.push({
          id: `i-${i.id}`,
          kind: "invoice",
          title: `Invoice ${i.invoice_number}`,
          subtitle: i.status,
          created_at: i.created_at,
        }),
      );

      return items.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    },
    staleTime: 30_000,
  });
}

export function useProjectOpenTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-open-tasks", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, completed_at")
        .eq("related_project_id", projectId)
        .neq("status", "completed")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}
