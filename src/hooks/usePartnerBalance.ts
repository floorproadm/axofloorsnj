import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PartnerBalanceTotals {
  lifetime_revenue: number;
  lifetime_received: number;
  open_balance: number;
  open_projects: number;
  completed_projects: number;
  total_projects: number;
  avg_project_value: number;
}

export interface PartnerBalanceAging {
  current: number;
  days_30: number;
  days_60: number;
  days_90_plus: number;
}

export interface PartnerBalanceData {
  partner: any;
  totals: PartnerBalanceTotals;
  aging: PartnerBalanceAging;
  recent_projects: any[];
  open_invoices: any[];
}

export function usePartnerBalance(partnerId: string | null) {
  return useQuery({
    queryKey: ["partner-balance", partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_partner_balance" as any, {
        p_partner_id: partnerId,
      });
      if (error) throw error;
      return data as unknown as PartnerBalanceData;
    },
  });
}
