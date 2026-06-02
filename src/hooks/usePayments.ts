import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AXO_ORG_ID } from "@/lib/constants";

export type RecurrenceType = "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

export interface Payment {
  id: string;
  project_id: string | null;
  category: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  status: string;
  description: string | null;
  notes: string | null;
  collaborator_id: string | null;
  created_at: string;
  updated_at: string;
  recurrence: RecurrenceType | null;
  recurrence_parent_id: string | null;
  recurrence_next_date: string | null;
  recurrence_active: boolean;
  receipt_photo_url: string | null;
  projects?: { customer_name: string; project_type: string } | null;
}

export interface CreatePaymentInput {
  project_id?: string | null;
  category: string;
  amount: number;
  payment_date: string;
  payment_method?: string | null;
  status?: string;
  description?: string | null;
  notes?: string | null;
  recurrence?: RecurrenceType | null;
  recurrence_next_date?: string | null;
  receipt_photo_url?: string | null;
}


export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, projects(customer_name, project_type)")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data as unknown as Payment[];
    },
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreatePaymentInput) => {
      const { data, error } = await supabase
        .from("payments")
        .insert({
          project_id: input.project_id || null,
          category: input.category,
          amount: input.amount,
          payment_date: input.payment_date,
          payment_method: input.payment_method || null,
          status: input.status || "pending",
          description: input.description || null,
          notes: input.notes || null,
          organization_id: AXO_ORG_ID,
          recurrence: input.recurrence || null,
          recurrence_next_date: input.recurrence
            ? (input.recurrence_next_date || input.payment_date)
            : null,
          receipt_photo_url: input.receipt_photo_url || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast({ title: "Payment recorded", description: "New payment entry added." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },

  });
}

export interface UpdatePaymentInput {
  id: string;
  project_id?: string | null;
  category?: string;
  amount?: number;
  payment_date?: string;
  payment_method?: string | null;
  status?: string;
  description?: string | null;
  notes?: string | null;
  recurrence?: RecurrenceType | null;
  recurrence_active?: boolean;
  recurrence_next_date?: string | null;
}

export function useToggleRecurringSeries() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("payments")
        .update({ recurrence_active: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast({ title: vars.active ? "Series resumed" : "Series paused" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });
}


export function useUpdatePayment() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...fields }: UpdatePaymentInput) => {
      const { error } = await supabase.from("payments").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast({ title: "Payment updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdatePaymentStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("payments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast({ title: "Status updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast({ title: "Payment removed" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
