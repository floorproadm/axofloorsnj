import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";

export interface BeforeAfterPair {
  id: string;
  project_id: string;
  organization_id: string;
  before_photo_id: string | null;
  after_photo_id: string | null;
  before_url: string;
  after_url: string;
  title: string;
  completed_date: string | null;
  share_token: string;
  created_at: string;
}

export function useBeforeAfterPairs(projectId?: string) {
  return useQuery({
    queryKey: ["before_after_pairs", projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<BeforeAfterPair[]> => {
      const { data, error } = await supabase
        .from("before_after_pairs" as any)
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any) || [];
    },
  });
}

export function useAllOrgBeforeAfter() {
  return useQuery({
    queryKey: ["before_after_pairs", "all-org"],
    queryFn: async (): Promise<BeforeAfterPair[]> => {
      const { data, error } = await supabase
        .from("before_after_pairs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as any) || [];
    },
  });
}

export function useCreateBeforeAfterPair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      before_photo_id?: string | null;
      after_photo_id?: string | null;
      before_url: string;
      after_url: string;
      title: string;
      completed_date?: string | null;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("before_after_pairs" as any)
        .insert({
          project_id: input.project_id,
          organization_id: AXO_ORG_ID,
          before_photo_id: input.before_photo_id ?? null,
          after_photo_id: input.after_photo_id ?? null,
          before_url: input.before_url,
          after_url: input.after_url,
          title: input.title,
          completed_date: input.completed_date ?? null,
          created_by: user?.user?.id ?? null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as any as BeforeAfterPair;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["before_after_pairs", vars.project_id] });
      qc.invalidateQueries({ queryKey: ["before_after_pairs", "all-org"] });
    },
  });
}

export function useDeleteBeforeAfterPair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pair: BeforeAfterPair) => {
      const { error } = await supabase
        .from("before_after_pairs" as any)
        .delete()
        .eq("id", pair.id);
      if (error) throw error;
    },
    onSuccess: (_, pair) => {
      qc.invalidateQueries({ queryKey: ["before_after_pairs", pair.project_id] });
      qc.invalidateQueries({ queryKey: ["before_after_pairs", "all-org"] });
    },
  });
}
