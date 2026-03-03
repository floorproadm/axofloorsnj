import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Partner {
  id: string;
  company_name: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  partner_type: string;
  service_zone: string;
  status: string;
  last_contacted_at: string | null;
  next_action_date: string | null;
  next_action_note: string | null;
  total_referrals: number;
  total_converted: number;
  notes: string | null;
  birthday: string | null;
  created_at: string;
  updated_at: string;
}

export type PartnerInsert = Omit<Partner, "id" | "created_at" | "updated_at" | "total_referrals" | "total_converted">;

export const SERVICE_ZONES: Record<string, string> = {
  core: "Core (Central NJ)",
  north_ring: "North Ring",
  outer: "Outer NJ",
  ny: "New York",
};

export const PARTNER_TYPES: Record<string, string> = {
  builder: "Builder",
  realtor: "Realtor",
  gc: "General Contractor",
  designer: "Designer",
  flooring_contractor: "Flooring Contractor",
};

export const PARTNER_STATUSES: Record<string, string> = {
  prospect: "Prospect",
  contacted: "Contacted",
  meeting_scheduled: "Meeting Scheduled",
  trial_first_job: "Trial / First Job",
  active: "Active",
  inactive: "Inactive",
  churned: "Perdido",
};

export const PARTNER_PIPELINE_STAGES = [
  "prospect",
  "contacted",
  "meeting_scheduled",
  "trial_first_job",
  "active",
  "inactive",
] as const;

export const PARTNER_STAGE_CONFIG: Record<string, { color: string; dot: string; bg: string }> = {
  prospect: { color: "text-emerald-700", dot: "bg-emerald-500", bg: "bg-emerald-500/10" },
  contacted: { color: "text-blue-700", dot: "bg-blue-500", bg: "bg-blue-500/10" },
  meeting_scheduled: { color: "text-orange-700", dot: "bg-orange-500", bg: "bg-orange-500/10" },
  trial_first_job: { color: "text-yellow-700", dot: "bg-yellow-500", bg: "bg-yellow-500/10" },
  active: { color: "text-emerald-700", dot: "bg-emerald-500", bg: "bg-emerald-500/10" },
  inactive: { color: "text-red-700", dot: "bg-red-500", bg: "bg-red-500/10" },
};

export function usePartnersData() {
  const queryClient = useQueryClient();

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Partner[];
    },
  });

  const createPartner = useMutation({
    mutationFn: async (values: Partial<PartnerInsert>) => {
      const { error } = await supabase.from("partners").insert(values as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast({ title: "Partner criado!", description: "Novo parceiro adicionado." });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const updatePartner = useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Partial<Partner>) => {
      const { error } = await supabase.from("partners").update(values as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast({ title: "Partner atualizado!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const deletePartner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast({ title: "Partner removido." });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  return { partners, isLoading, createPartner, updatePartner, deletePartner };
}
