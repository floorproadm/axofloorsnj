import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EstimateListItem {
  id: string;
  proposal_number: string;
  project_id: string;
  customer_id: string;
  status: string;
  good_price: number;
  better_price: number;
  best_price: number;
  margin_good: number;
  margin_better: number;
  margin_best: number;
  selected_tier: string | null;
  valid_until: string;
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  projects: {
    customer_name: string;
    project_type: string;
    address: string | null;
  } | null;
  customers: {
    full_name: string;
  } | null;
}

export function useEstimatesList() {
  return useQuery({
    queryKey: ['estimates-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*, projects(customer_name, project_type, address), customers(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as EstimateListItem[];
    },
  });
}
