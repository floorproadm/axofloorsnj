import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { removeRealtimeChannel, subscribeSafely } from "@/lib/safeRealtime";

export interface LeadAutomationDripLog {
  id: string;
  enrollment_id: string;
  drip_id: string;
  scheduled_at: string;
  sent_at: string | null;
  status: "pending" | "sent" | "failed" | "skipped";
  error_message: string | null;
  drip: {
    id: string;
    channel: string;
    subject: string | null;
    message_template: string;
    delay_days: number;
    delay_hours: number;
    display_order: number;
  } | null;
}

export interface LeadAutomationEnrollment {
  id: string;
  lead_id: string;
  sequence_id: string;
  status: "active" | "completed" | "cancelled";
  enrolled_at: string;
  sequence: {
    id: string;
    name: string;
    stage_key: string;
    pipeline_type: string;
  } | null;
  logs: LeadAutomationDripLog[];
}

export function useLeadAutomations(leadId: string | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["lead-automations", leadId];

  const query = useQuery({
    queryKey,
    enabled: !!leadId,
    queryFn: async (): Promise<LeadAutomationEnrollment[]> => {
      if (!leadId) return [];

      const { data: enrollments, error: enrErr } = await supabase
        .from("automation_enrollments")
        .select("id, lead_id, sequence_id, status, enrolled_at")
        .eq("lead_id", leadId)
        .order("enrolled_at", { ascending: false });
      if (enrErr) throw enrErr;
      if (!enrollments?.length) return [];

      const seqIds = [...new Set(enrollments.map((e) => e.sequence_id))];
      const enrIds = enrollments.map((e) => e.id);

      const [{ data: seqs }, { data: logs }] = await Promise.all([
        supabase
          .from("automation_sequences")
          .select("id, name, stage_key, pipeline_type")
          .in("id", seqIds),
        supabase
          .from("automation_drip_logs")
          .select(
            "id, enrollment_id, drip_id, scheduled_at, sent_at, status, error_message"
          )
          .in("enrollment_id", enrIds)
          .order("scheduled_at", { ascending: true }),
      ]);

      const dripIds = [...new Set((logs || []).map((l) => l.drip_id))];
      const { data: drips } = dripIds.length
        ? await supabase
            .from("automation_drips")
            .select("id, channel, subject, message_template, delay_days, delay_hours, display_order")
            .in("id", dripIds)
        : { data: [] as any[] };

      const dripMap = new Map((drips || []).map((d: any) => [d.id, d]));
      const seqMap = new Map((seqs || []).map((s: any) => [s.id, s]));

      return enrollments.map((e) => ({
        ...e,
        status: e.status as LeadAutomationEnrollment["status"],
        sequence: seqMap.get(e.sequence_id) || null,
        logs: (logs || [])
          .filter((l) => l.enrollment_id === e.id)
          .map((l) => ({
            ...l,
            status: l.status as LeadAutomationDripLog["status"],
            drip: dripMap.get(l.drip_id) || null,
          })),
      }));
    },
  });

  // Realtime: refetch when drip logs for this lead change
  useEffect(() => {
    if (!leadId) return;
    const channel = supabase
      .channel(`lead-automations-${leadId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "automation_drip_logs" },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "automation_enrollments", filter: `lead_id=eq.${leadId}` },
        () => queryClient.invalidateQueries({ queryKey })
      );
    const subscription = subscribeSafely(channel, `lead-automations-${leadId}`);
    return () => {
      removeRealtimeChannel(subscription ?? channel);
    };
  }, [leadId, queryClient]);

  const pauseAll = useMutation({
    mutationFn: async () => {
      if (!leadId) return;
      const { data: active } = await supabase
        .from("automation_enrollments")
        .select("id")
        .eq("lead_id", leadId)
        .eq("status", "active");
      const ids = (active || []).map((e) => e.id);
      if (ids.length === 0) return;

      await supabase
        .from("automation_enrollments")
        .update({ status: "cancelled" })
        .in("id", ids);

      await supabase
        .from("automation_drip_logs")
        .update({ status: "skipped" })
        .in("enrollment_id", ids)
        .eq("status", "pending");
    },
    onSuccess: () => {
      toast.success("Automações pausadas");
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["leads-automation-status"] });
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao pausar"),
  });

  const markResponded = useMutation({
    mutationFn: async () => {
      if (!leadId) return;
      // Pause all
      const { data: active } = await supabase
        .from("automation_enrollments")
        .select("id")
        .eq("lead_id", leadId)
        .eq("status", "active");
      const ids = (active || []).map((e) => e.id);
      if (ids.length > 0) {
        await supabase
          .from("automation_enrollments")
          .update({ status: "cancelled" })
          .in("id", ids);
        await supabase
          .from("automation_drip_logs")
          .update({ status: "skipped" })
          .in("enrollment_id", ids)
          .eq("status", "pending");
      }
      // Append note to lead notes field
      const { data: lead } = await supabase
        .from("leads")
        .select("notes")
        .eq("id", leadId)
        .single();
      const ts = new Date().toLocaleString("pt-BR");
      const stamp = `[${ts}] Cliente respondeu — automação pausada.`;
      const newNotes = lead?.notes ? `${lead.notes}\n${stamp}` : stamp;
      await supabase.from("leads").update({ notes: newNotes }).eq("id", leadId);
    },
    onSuccess: () => {
      toast.success("Marcado como respondido — automação pausada");
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["leads-automation-status"] });
      queryClient.invalidateQueries({ queryKey: ["lead-detail", leadId] });
    },
    onError: (e: any) => toast.error(e?.message || "Falha"),
  });

  const retryDrip = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from("automation_drip_logs")
        .update({
          status: "pending",
          scheduled_at: new Date().toISOString(),
          error_message: null,
          sent_at: null,
        })
        .eq("id", logId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reenvio agendado para agora");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao reenviar"),
  });

  // Derived helpers
  const enrollments = query.data || [];
  const allLogs = enrollments.flatMap((e) => e.logs);
  const activeEnrollment = enrollments.find((e) => e.status === "active");
  const nextDrip = allLogs
    .filter((l) => l.status === "pending")
    .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at))[0];
  const lastSent = allLogs
    .filter((l) => l.status === "sent" && l.sent_at)
    .sort((a, b) => +new Date(b.sent_at!) - +new Date(a.sent_at!))[0];
  const failedCount = allLogs.filter((l) => l.status === "failed").length;

  return {
    enrollments,
    activeEnrollment,
    nextDrip,
    lastSent,
    failedCount,
    isLoading: query.isLoading,
    pauseAll,
    markResponded,
    retryDrip,
  };
}

/**
 * Batched automation status for many leads (used in Intake cards).
 * Uses RPC get_leads_automation_status.
 */
export interface LeadAutomationStatus {
  last_sent_at: string | null;
  next_scheduled_at: string | null;
  failed_count: number;
  pending_count: number;
  last_error: string | null;
}

export function useLeadsAutomationStatus(leadIds: string[]) {
  return useQuery({
    queryKey: ["leads-automation-status", leadIds.sort().join(",")],
    enabled: leadIds.length > 0,
    queryFn: async (): Promise<Record<string, LeadAutomationStatus>> => {
      const { data, error } = await supabase.rpc(
        "get_leads_automation_status" as any,
        { p_lead_ids: leadIds }
      );
      if (error) throw error;
      return (data as any) || {};
    },
    staleTime: 30_000,
  });
}
