import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const PARTNER_VALID_TRANSITIONS: Record<string, string> = {
  prospect: "contacted",
  contacted: "meeting_scheduled",
  meeting_scheduled: "trial_first_job",
};

export const PARTNER_NRA: Record<string, { label: string; action: string }> = {
  prospect: { label: "Fazer primeiro contato", action: "contact" },
  contacted: { label: "Agendar reunião", action: "schedule_meeting" },
  meeting_scheduled: { label: "Registrar trial / 1º job", action: "register_trial" },
  trial_first_job: { label: "Avaliar e ativar parceiro", action: "activate" },
  active: { label: "Manter relacionamento ativo", action: "maintain" },
  inactive: { label: "Reativar parceiro", action: "reactivate" },
};

export function usePartnerPipeline() {
  const queryClient = useQueryClient();

  const advancePartner = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const nextStatus = PARTNER_VALID_TRANSITIONS[currentStatus];
      if (!nextStatus) throw new Error("Não é possível avançar deste estágio.");

      const { error } = await supabase
        .from("partners")
        .update({
          status: nextStatus,
          last_contacted_at: new Date().toISOString(),
        } as any)
        .eq("id", id);

      if (error) throw error;
      return nextStatus;
    },
    onSuccess: (nextStatus) => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast({ title: "Partner avançado!", description: `Novo status: ${nextStatus}` });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao avançar", description: err.message, variant: "destructive" });
    },
  });

  return { advancePartner, PARTNER_VALID_TRANSITIONS, PARTNER_NRA };
}
