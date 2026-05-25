import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CrewMember {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  avatar_url: string | null;
  daily_rate: number | null;
  employment_type: string | null;
  region: string | null;
  is_active_crew: boolean | null;
  bio: string | null;
}

export interface CrewEarnings {
  crew_member_id: string;
  full_name: string;
  role: string | null;
  default_rate: number;
  jobs_count: number;
  total_earned: number;
  unpaid_amount: number;
  paid_amount: number;
  avg_rate: number;
  last_worked_at: string | null;
}

export function useCrewMembers(activeOnly = true) {
  return useQuery({
    queryKey: ['crew-members', activeOnly],
    queryFn: async () => {
      let q = supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, avatar_url, daily_rate, employment_type, region, is_active_crew, bio')
        .order('full_name');
      if (activeOnly) q = q.or('is_active_crew.is.null,is_active_crew.eq.true');
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CrewMember[];
    },
  });
}

export function useCrewEarnings() {
  return useQuery({
    queryKey: ['crew-earnings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('view_crew_earnings' as any)
        .select('*')
        .order('total_earned', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CrewEarnings[];
    },
  });
}

export function useQuickAddCrewMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { full_name: string; daily_rate: number; role?: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          full_name: input.full_name,
          daily_rate: input.daily_rate,
          role: input.role || 'helper',
          is_active_crew: true,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CrewMember;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crew-members'] }),
  });
}
