import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AXO_ORG_ID } from '@/lib/constants';

export interface WeeklyReview {
  id: string;
  organization_id: string;
  week_start: string;
  week_end: string;
  total_revenue: number;
  total_profit: number;
  avg_margin: number;
  jobs_completed: number;
  leads_won: number;
  notes: string | null;
  action_items: string | null;
  status: string;
  closed_at: string | null;
  created_at: string;
}

export function useWeeklyReview(weekStart: string) {
  return useQuery({
    queryKey: ['weekly-review', weekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('week_start', weekStart)
        .eq('organization_id', AXO_ORG_ID)
        .maybeSingle();
      if (error) throw error;
      return data as WeeklyReview | null;
    },
  });
}

export function useWeeklyReviewHistory() {
  return useQuery({
    queryKey: ['weekly-reviews-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('organization_id', AXO_ORG_ID)
        .order('week_start', { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as WeeklyReview[];
    },
  });
}

export function useUpsertWeeklyReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      week_start: string;
      week_end: string;
      total_revenue?: number;
      total_profit?: number;
      avg_margin?: number;
      jobs_completed?: number;
      leads_won?: number;
      notes?: string;
      action_items?: string;
      status?: string;
    }) => {
      const { data: existing } = await supabase
        .from('weekly_reviews')
        .select('id')
        .eq('week_start', input.week_start)
        .eq('organization_id', AXO_ORG_ID)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('weekly_reviews')
          .update({
            ...input,
            closed_at: input.status === 'closed' ? new Date().toISOString() : null,
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('weekly_reviews')
          .insert({
            organization_id: AXO_ORG_ID,
            ...input,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-review', data.week_start] });
      queryClient.invalidateQueries({ queryKey: ['weekly-reviews-history'] });
    },
  });
}
