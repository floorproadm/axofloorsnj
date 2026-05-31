import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AXO_ORG_ID } from "@/lib/constants";

export type PayMode = "daily" | "sqft";

export interface TimesheetEntry {
  id: string;
  project_id: string;
  worker_name: string;
  role: string | null;
  pay_mode: PayMode;
  daily_rate: number | null;
  days_worked: number | null;
  sqft_rate: number | null;
  sqft_worked: number | null;
  total_cost: number;
  work_date: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  approved_at: string | null;
  submitted_by_user_id: string | null;
  crew_member_id: string | null;
  projects?: { customer_name: string; address: string | null } | null;
}

/** Collaborator: list own timesheet entries (last 60 days). */
export function useMyTimesheet() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-timesheet", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("labor_entries")
        .select("*, projects:project_id(customer_name, address)")
        .eq("submitted_by_user_id", user.id)
        .order("work_date", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as TimesheetEntry[];
    },
    enabled: !!user?.id,
  });
}

export type SubmitTimesheetInput =
  | {
      pay_mode: "daily";
      project_id: string;
      work_date: string;
      days_worked: number; // fractions allowed
      notes?: string;
    }
  | {
      pay_mode: "sqft";
      project_id: string;
      work_date: string;
      sqft_worked: number;
      notes?: string;
    };

/** Collaborator: submit a new timesheet entry (always status='pending'). */
export function useSubmitTimesheet() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitTimesheetInput) => {
      if (!user?.id) throw new Error("Não autenticado");

      // Fetch profile (worker_name, daily_rate, role)
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name, role, daily_rate")
        .eq("user_id", user.id)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!profile) throw new Error("Perfil não encontrado. Contate o admin.");

      const base = {
        project_id: input.project_id,
        organization_id: AXO_ORG_ID,
        worker_name: profile.full_name || "Sem nome",
        role: profile.role || "helper",
        work_date: input.work_date,
        notes: input.notes || null,
        crew_member_id: profile.id,
        submitted_by_user_id: user.id,
        status: "pending",
        is_paid: false,
        pay_mode: input.pay_mode,
      };

      let payload: any;
      if (input.pay_mode === "daily") {
        payload = {
          ...base,
          daily_rate: profile.daily_rate || 0,
          days_worked: input.days_worked,
        };
      } else {
        // sqft → snapshot rate from project
        const { data: proj, error: prErr } = await supabase
          .from("projects")
          .select("labor_sqft_rate")
          .eq("id", input.project_id)
          .maybeSingle();
        if (prErr) throw prErr;
        const rate = Number((proj as any)?.labor_sqft_rate ?? 0);
        if (!rate || rate <= 0) {
          throw new Error(
            "Este projeto não está configurado para pagamento por sqft. Peça ao admin para definir a rate."
          );
        }
        payload = {
          ...base,
          sqft_rate: rate,
          sqft_worked: input.sqft_worked,
          // satisfy CHECK by keeping daily fields null (default)
          daily_rate: 0,
          days_worked: 0,
        };
      }

      const { data, error } = await supabase
        .from("labor_entries")
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-timesheet"] });
      qc.invalidateQueries({ queryKey: ["pending-timesheet"] });
    },
  });
}

/** Collaborator: delete own pending entry. */
export function useDeleteMyTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("labor_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-timesheet"] }),
  });
}

/** Admin: list all pending timesheet entries awaiting approval. */
export function usePendingTimesheet() {
  return useQuery({
    queryKey: ["pending-timesheet"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labor_entries")
        .select("*, projects:project_id(customer_name, address)")
        .eq("status", "pending")
        .order("work_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TimesheetEntry[];
    },
  });
}

/** Admin: approve a pending entry. */
export function useApproveTimesheet() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("labor_entries")
        .update({
          status: "approved",
          approved_by: user?.id || null,
          approved_at: new Date().toISOString(),
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-timesheet"] });
      qc.invalidateQueries({ queryKey: ["my-timesheet"] });
      qc.invalidateQueries({ queryKey: ["labor-entries"] });
      qc.invalidateQueries({ queryKey: ["all-labor-entries"] });
      qc.invalidateQueries({ queryKey: ["job-cost"] });
    },
  });
}

/** Admin: reject a pending entry with reason. */
export function useRejectTimesheet() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("labor_entries")
        .update({
          status: "rejected",
          approved_by: user?.id || null,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-timesheet"] });
      qc.invalidateQueries({ queryKey: ["my-timesheet"] });
    },
  });
}
