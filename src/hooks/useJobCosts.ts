import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanySettings } from './useCompanySettings';

export interface JobCost {
  id: string;
  project_id: string;
  labor_cost: number;
  material_cost: number;
  additional_costs: number;
  total_cost: number;
  estimated_revenue: number;
  margin_percent: number;
  profit_amount: number;
  created_at: string;
  updated_at: string;
}

export interface JobCostInput {
  project_id: string;
  labor_cost: number;
  material_cost: number;
  additional_costs: number;
  estimated_revenue: number;
}

export interface MarginValidation {
  isValid: boolean;
  status: 'OK' | 'WARNING' | 'ERROR';
  message: string;
  margin_percent: number;
  profit_amount: number;
}

export function useJobCost(projectId: string | undefined) {
  return useQuery({
    queryKey: ['job-cost', projectId],
    queryFn: async (): Promise<JobCost | null> => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('job_costs')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useUpsertJobCost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: JobCostInput) => {
      const { data: existing } = await supabase
        .from('job_costs')
        .select('id')
        .eq('project_id', input.project_id)
        .maybeSingle();
      
      if (existing) {
        const { data, error } = await supabase
          .from('job_costs')
          .update({
            labor_cost: input.labor_cost,
            material_cost: input.material_cost,
            additional_costs: input.additional_costs,
            estimated_revenue: input.estimated_revenue,
          })
          .eq('project_id', input.project_id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('job_costs')
          .insert({
            project_id: input.project_id,
            labor_cost: input.labor_cost,
            material_cost: input.material_cost,
            additional_costs: input.additional_costs,
            estimated_revenue: input.estimated_revenue,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job-cost', data.project_id] });
    },
  });
}

export function validateMargin(
  jobCost: JobCost | null,
  minMarginPercent: number
): MarginValidation {
  if (!jobCost) {
    return {
      isValid: false,
      status: 'ERROR',
      message: 'Nenhum dado de custo encontrado para este projeto',
      margin_percent: 0,
      profit_amount: 0,
    };
  }
  
  if (jobCost.estimated_revenue === 0) {
    return {
      isValid: false,
      status: 'ERROR',
      message: 'Receita estimada não definida',
      margin_percent: 0,
      profit_amount: jobCost.profit_amount,
    };
  }
  
  if (jobCost.margin_percent < minMarginPercent) {
    return {
      isValid: false,
      status: 'WARNING',
      message: `Margem abaixo do mínimo (${minMarginPercent}%)`,
      margin_percent: jobCost.margin_percent,
      profit_amount: jobCost.profit_amount,
    };
  }
  
  return {
    isValid: true,
    status: 'OK',
    message: 'Margem aceitável',
    margin_percent: jobCost.margin_percent,
    profit_amount: jobCost.profit_amount,
  };
}

export function useMarginValidation(projectId: string | undefined) {
  const { data: jobCost } = useJobCost(projectId);
  const { marginMinPercent } = useCompanySettings();
  
  return validateMargin(jobCost, marginMinPercent);
}

// Server-side calculation via RPC
export async function calculateJobMargin(projectId: string) {
  const { data, error } = await supabase
    .rpc('calculate_job_margin', { p_project_id: projectId });
  
  if (error) {
    throw new Error(error.message);
  }
  
  if (!data || data.length === 0) {
    throw new Error('Nenhum dado de margem encontrado para este projeto');
  }
  
  return data[0];
}
