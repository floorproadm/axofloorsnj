import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

export interface DayNote {
  id: string;
  organization_id: string;
  note_date: string;
  content: string;
  color: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useDayNotes(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["day-notes", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_day_notes" as any)
        .select("*")
        .gte("note_date", startDate)
        .lte("note_date", endDate);
      if (error) throw error;
      return (data || []) as unknown as DayNote[];
    },
  });
}

export function useUpsertDayNote() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: { note_date: string; content: string; color?: string }) => {
      const { error } = await supabase
        .from("schedule_day_notes" as any)
        .upsert(
          {
            organization_id: AXO_ORG_ID,
            note_date: input.note_date,
            content: input.content,
            color: input.color || "amber",
          },
          { onConflict: "organization_id,note_date" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["day-notes"] });
      toast({ title: "Note saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteDayNote() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedule_day_notes" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["day-notes"] });
      toast({ title: "Note removed" });
    },
  });
}
