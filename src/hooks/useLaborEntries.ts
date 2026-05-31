import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AXO_ORG_ID } from '@/lib/constants';

export interface LaborEntry {
  id: string;
  project_id: string;
  organization_id: string;
  worker_name: string;
  role: string;
  pay_mode: "daily" | "sqft";
  daily_rate: number | null;
  days_worked: number | null;
  sqft_rate: number | null;
  sqft_worked: number | null;
  total_cost: number;
  work_date: string;
  is_paid: boolean;
  paid_at: string | null;
  payment_method: string | null;
  crew_member_id: string | null;
  notes: string | null;
  created_at: string;
  status?: string;
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
    mutationFn: async (input: {
      project_id: string;
      worker_name: string;
      role?: string;
      daily_rate: number;
      days_worked?: number;
      work_date?: string;
      is_paid?: boolean;
      notes?: string;
      crew_member_id?: string | null;
    }) => {
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
          is_paid: input.is_paid ?? false,
          notes: input.notes || null,
          crew_member_id: input.crew_member_id || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['labor-entries', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['job-cost', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['crew-earnings'] });
      queryClient.invalidateQueries({ queryKey: ['all-labor-entries'] });
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
      queryClient.invalidateQueries({ queryKey: ['crew-earnings'] });
      queryClient.invalidateQueries({ queryKey: ['all-labor-entries'] });
    },
  });
}

export function useMarkLaborPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, paid, method }: { ids: string[]; paid: boolean; method?: string }) => {
      const { error } = await supabase
        .from('labor_entries')
        .update({
          is_paid: paid,
          paid_at: paid ? new Date().toISOString() : null,
          payment_method: paid ? method || 'cash' : null,
        } as any)
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labor-entries'] });
      queryClient.invalidateQueries({ queryKey: ['all-labor-entries'] });
      queryClient.invalidateQueries({ queryKey: ['crew-earnings'] });
    },
  });
}

export function useAllLaborEntries(filters?: { crewMemberId?: string; paid?: boolean | null; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['all-labor-entries', filters],
    queryFn: async () => {
      let q = supabase
        .from('labor_entries')
        .select('*, projects(id, customer_name, address), profiles:crew_member_id(id, full_name, avatar_url)')
        .order('work_date', { ascending: false })
        .limit(500);
      if (filters?.crewMemberId) q = q.eq('crew_member_id', filters.crewMemberId);
      if (filters?.paid === true) q = q.eq('is_paid', true);
      if (filters?.paid === false) q = q.eq('is_paid', false);
      if (filters?.from) q = q.gte('work_date', filters.from);
      if (filters?.to) q = q.lte('work_date', filters.to);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}
