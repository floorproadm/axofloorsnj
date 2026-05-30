import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";

export interface ProjectNotes {
  id: string;
  project_id: string;
  organization_id: string;
  wood_type: string | null;
  stain: string | null;
  finish_type: string | null;
  coats: number | null;
  client_notes: string | null;
  tech_notes: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjectNotes(projectId?: string) {
  return useQuery({
    queryKey: ["project_notes", projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<ProjectNotes | null> => {
      const { data, error } = await supabase
        .from("project_notes" as any)
        .select("*")
        .eq("project_id", projectId!)
        .maybeSingle();
      if (error) throw error;
      return (data as any) || null;
    },
  });
}

export function useUpsertProjectNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, patch }: { projectId: string; patch: Partial<ProjectNotes> }) => {
      const { error } = await supabase
        .from("project_notes" as any)
        .upsert(
          { project_id: projectId, organization_id: AXO_ORG_ID, ...patch } as any,
          { onConflict: "project_id" }
        );
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["project_notes", v.projectId] }),
  });
}
