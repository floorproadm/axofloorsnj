import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface JobCostItem {
  id: string;
  job_cost_id: string;
  category: 'materials' | 'labor' | 'overhead' | 'other';
  description: string;
  amount: number;
  created_at: string;
}

export function useJobCostItems(jobCostId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['job-cost-items', jobCostId];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!jobCostId) return [];
      const { data, error } = await supabase
        .from('job_cost_items')
        .select('*')
        .eq('job_cost_id', jobCostId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as JobCostItem[];
    },
    enabled: !!jobCostId,
  });

  const addItem = useMutation({
    mutationFn: async (item: { category: string; description: string; amount: number }) => {
      if (!jobCostId) throw new Error('No job cost ID');
      const { error } = await supabase.from('job_cost_items').insert({
        job_cost_id: jobCostId,
        category: item.category,
        description: item.description,
        amount: item.amount,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: () => toast.error('Erro ao adicionar item'),
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('job_cost_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: () => toast.error('Erro ao remover item'),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JobCostItem> & { id: string }) => {
      const { error } = await supabase.from('job_cost_items').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: () => toast.error('Erro ao atualizar item'),
  });

  const byCategory = {
    materials: items.filter(i => i.category === 'materials'),
    labor: items.filter(i => i.category === 'labor'),
    overhead: items.filter(i => i.category === 'overhead'),
    other: items.filter(i => i.category === 'other'),
  };

  const categoryTotals = {
    materials: byCategory.materials.reduce((s, i) => s + Number(i.amount), 0),
    labor: byCategory.labor.reduce((s, i) => s + Number(i.amount), 0),
    overhead: byCategory.overhead.reduce((s, i) => s + Number(i.amount), 0),
    other: byCategory.other.reduce((s, i) => s + Number(i.amount), 0),
  };

  const grandTotal = Object.values(categoryTotals).reduce((s, v) => s + v, 0);

  return { items, byCategory, categoryTotals, grandTotal, isLoading, addItem, removeItem, updateItem };
}
