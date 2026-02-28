import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectWithCosts {
  id: string;
  customer_name: string;
  project_type: string;
  project_status: string;
  estimated_cost: number | null;
  start_date: string | null;
  completion_date: string | null;
  job_costs: {
    id: string;
    estimated_revenue: number;
    total_cost: number | null;
    margin_percent: number | null;
    profit_amount: number | null;
    labor_cost: number;
    material_cost: number;
    additional_costs: number;
  } | null;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export function usePerformanceData() {
  const projectsQuery = useQuery({
    queryKey: ['performance-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, customer_name, project_type, project_status, estimated_cost, start_date, completion_date, job_costs(id, estimated_revenue, total_cost, margin_percent, profit_amount, labor_cost, material_cost, additional_costs)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map(p => ({
        ...p,
        job_costs: Array.isArray(p.job_costs) ? p.job_costs[0] ?? null : p.job_costs,
      })) as ProjectWithCosts[];
    },
    staleTime: 60_000,
  });

  const monthlyQuery = useQuery({
    queryKey: ['performance-monthly-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('completion_date, job_costs(estimated_revenue)')
        .eq('project_status', 'completed')
        .not('completion_date', 'is', null)
        .order('completion_date', { ascending: true });
      if (error) throw error;

      const byMonth: Record<string, number> = {};
      (data ?? []).forEach(p => {
        if (!p.completion_date) return;
        const month = p.completion_date.substring(0, 7); // YYYY-MM
        const rev = Array.isArray(p.job_costs) ? (p.job_costs[0]?.estimated_revenue ?? 0) : ((p.job_costs as any)?.estimated_revenue ?? 0);
        byMonth[month] = (byMonth[month] ?? 0) + Number(rev);
      });

      // Last 6 months
      const months: MonthlyRevenue[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'short' });
        months.push({ month: label, revenue: byMonth[key] ?? 0 });
      }
      return months;
    },
    staleTime: 60_000,
  });

  return {
    projects: projectsQuery.data ?? [],
    monthlyRevenue: monthlyQuery.data ?? [],
    isLoading: projectsQuery.isLoading || monthlyQuery.isLoading,
  };
}
