import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AXO_ORG_ID } from '@/lib/constants';

export interface LaborEntry {
  id: string;
  project_id: string;
  organization_id: string;
  worker_name: string;
  role: string;
  daily_rate: number;
  days_worked: number;
  total_cost: number;
  work_date: string;
  is_paid: boolean;
  notes: string | null;
  created_at: string;
}

export function useLaborEntries(projectId: string | undefined) {
  return useQuery({
    queryKey: ['labor-entries', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('labor_entries')
        .select('*')
        .eq('project_id', projectId)
        .order('work_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as LaborEntry[];
    },
    enabled: !!projectId,
  });
}

export function useAddLaborEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { project_id: string; worker_name: string; role?: string; daily_rate: number; days_worked?: number; work_date?: string }) => {
      const { data, error } = await supabase
        .from('labor_entries')
        .insert({
          project_id: input.project_id,
          organization_id: AXO_ORG_ID,
          worker_name: input.worker_name,
          role: input.role || 'helper',
          daily_rate: input.daily_rate,
          days_worked: input.days_worked || 1,
          work_date: input.work_date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['labor-entries', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['job-cost', data.project_id] });
    },
  });
}

export function useDeleteLaborEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('labor_entries').delete().eq('id', id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['labor-entries', projectId] });
      queryClient.invalidateQueries({ queryKey: ['job-cost', projectId] });
    },
  });
}
