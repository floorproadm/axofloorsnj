import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AXO_ORG_ID } from '@/lib/constants';

export interface MaterialCost {
  id: string;
  project_id: string;
  organization_id: string;
  description: string;
  supplier: string | null;
  amount: number;
  purchase_date: string;
  receipt_url: string | null;
  is_paid: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useMaterialCosts(projectId: string | undefined) {
  return useQuery({
    queryKey: ['material-costs', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('material_costs')
        .select('*')
        .eq('project_id', projectId)
        .order('purchase_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MaterialCost[];
    },
    enabled: !!projectId,
  });
}

export function useAddMaterialCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { project_id: string; description: string; supplier?: string; amount: number; purchase_date?: string }) => {
      const { data, error } = await supabase
        .from('material_costs')
        .insert({
          project_id: input.project_id,
          organization_id: AXO_ORG_ID,
          description: input.description,
          supplier: input.supplier || null,
          amount: input.amount,
          purchase_date: input.purchase_date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['material-costs', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['job-cost', data.project_id] });
    },
  });
}

export function useDeleteMaterialCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('material_costs').delete().eq('id', id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['material-costs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['job-cost', projectId] });
    },
  });
}
