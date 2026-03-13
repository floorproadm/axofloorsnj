import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";

export interface AutomationSequence {
  id: string;
  pipeline_type: string;
  stage_key: string;
  name: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  drips?: AutomationDrip[];
}

export interface AutomationDrip {
  id: string;
  sequence_id: string;
  delay_days: number;
  delay_hours: number;
  channel: string;
  subject: string | null;
  message_template: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const SALES_STAGES = [
  { key: "cold_lead", label: "Cold Leads" },
  { key: "warm_lead", label: "Warm Leads" },
  { key: "estimate_requested", label: "Estimate Requested" },
  { key: "estimate_scheduled", label: "Estimate Scheduled" },
  { key: "in_draft", label: "In Draft" },
  { key: "proposal_sent", label: "Proposal Sent" },
  { key: "proposal_rejected", label: "Proposal Rejected" },
] as const;

const JOBS_STAGES = [
  { key: "pending", label: "Pre-Production" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
] as const;

export const PIPELINE_STAGES = {
  sales: SALES_STAGES,
  jobs: JOBS_STAGES,
} as const;

export function useAutomationFlows(pipelineType: "sales" | "jobs") {
  const queryClient = useQueryClient();
  const queryKey = ["automation_sequences", pipelineType];

  const { data: sequences = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_sequences")
        .select("*")
        .eq("pipeline_type", pipelineType)
        .order("display_order");
      if (error) throw error;
      return data as AutomationSequence[];
    },
  });

  const { data: drips = [] } = useQuery({
    queryKey: ["automation_drips", pipelineType],
    queryFn: async () => {
      const seqIds = sequences.map((s) => s.id);
      if (seqIds.length === 0) return [];
      const { data, error } = await supabase
        .from("automation_drips")
        .select("*")
        .in("sequence_id", seqIds)
        .order("display_order");
      if (error) throw error;
      return data as AutomationDrip[];
    },
    enabled: sequences.length > 0,
  });

  // Group sequences by stage with drip counts
  const stageData = PIPELINE_STAGES[pipelineType].map((stage) => {
    const stageSequences = sequences.filter((s) => s.stage_key === stage.key);
    const stageDrips = drips.filter((d) =>
      stageSequences.some((s) => s.id === d.sequence_id)
    );
    return {
      ...stage,
      sequences: stageSequences,
      sequenceCount: stageSequences.length,
      dripCount: stageDrips.length,
    };
  });

  const createSequence = useMutation({
    mutationFn: async (input: { stage_key: string; name: string }) => {
      const { data, error } = await supabase
        .from("automation_sequences")
        .insert({
          pipeline_type: pipelineType,
          stage_key: input.stage_key,
          name: input.name,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateSequence = useMutation({
    mutationFn: async (input: { id: string; name?: string; is_active?: boolean }) => {
      const { id, ...updates } = input;
      const { error } = await supabase
        .from("automation_sequences")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteSequence = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("automation_sequences")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["automation_drips", pipelineType] });
    },
  });

  const createDrip = useMutation({
    mutationFn: async (input: {
      sequence_id: string;
      delay_days?: number;
      delay_hours?: number;
      channel?: string;
      subject?: string;
      message_template: string;
    }) => {
      const { data, error } = await supabase
        .from("automation_drips")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_drips", pipelineType] });
    },
  });

  const updateDrip = useMutation({
    mutationFn: async (input: {
      id: string;
      delay_days?: number;
      delay_hours?: number;
      channel?: string;
      subject?: string;
      message_template?: string;
      is_active?: boolean;
    }) => {
      const { id, ...updates } = input;
      const { error } = await supabase
        .from("automation_drips")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_drips", pipelineType] });
    },
  });

  const deleteDrip = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("automation_drips")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_drips", pipelineType] });
    },
  });

  return {
    stageData,
    sequences,
    drips,
    isLoading,
    createSequence,
    updateSequence,
    deleteSequence,
    createDrip,
    updateDrip,
    deleteDrip,
  };
}
