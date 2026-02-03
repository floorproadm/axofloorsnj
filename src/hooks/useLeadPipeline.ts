import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// 6-stage linear pipeline
export const PIPELINE_STAGES = [
  'new_lead', 
  'appt_scheduled', 
  'proposal', 
  'in_production', 
  'completed', 
  'lost'
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

// Stage labels for display - Linguagem de operador de flooring
export const STAGE_LABELS: Record<PipelineStage, string> = {
  new_lead: 'Novo Contato',
  appt_scheduled: 'Visita Agendada',
  proposal: 'Orçamento Enviado',
  in_production: 'Em Execução',
  completed: 'Job Fechado',
  lost: 'Perdido'
};

// Stage icons and colors config - Sistema de sinais visuais
export const STAGE_CONFIG: Record<PipelineStage, { 
  color: string; 
  bgColor: string; 
  borderColor: string;
  textColor: string;
  stateType: 'active' | 'warning' | 'success' | 'terminal';
}> = {
  new_lead: { 
    color: 'text-sky-600', 
    bgColor: 'bg-sky-50', 
    borderColor: 'border-sky-400',
    textColor: 'text-sky-700',
    stateType: 'active'
  },
  appt_scheduled: { 
    color: 'text-indigo-600', 
    bgColor: 'bg-indigo-50', 
    borderColor: 'border-indigo-400',
    textColor: 'text-indigo-700',
    stateType: 'active'
  },
  proposal: { 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-50', 
    borderColor: 'border-amber-400',
    textColor: 'text-amber-700',
    stateType: 'warning'
  },
  in_production: { 
    color: 'text-violet-600', 
    bgColor: 'bg-violet-50', 
    borderColor: 'border-violet-400',
    textColor: 'text-violet-700',
    stateType: 'active'
  },
  completed: { 
    color: 'text-emerald-600', 
    bgColor: 'bg-emerald-50', 
    borderColor: 'border-emerald-400',
    textColor: 'text-emerald-700',
    stateType: 'success'
  },
  lost: { 
    color: 'text-slate-500', 
    bgColor: 'bg-slate-100', 
    borderColor: 'border-slate-300',
    textColor: 'text-slate-600',
    stateType: 'terminal'
  }
};

// Valid transitions map for 6-stage pipeline
export const VALID_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  new_lead: ['appt_scheduled'],
  appt_scheduled: ['proposal'],
  proposal: ['in_production', 'lost'],
  in_production: ['completed', 'lost'],
  completed: [],
  lost: []
};

// Map old statuses to new ones for backwards compatibility
const STATUS_MAP: Record<string, PipelineStage> = {
  'new': 'new_lead',
  'contacted': 'appt_scheduled',
  'quoted': 'proposal',
  'won': 'completed',
  'lost': 'lost',
  // New statuses map to themselves
  'new_lead': 'new_lead',
  'appt_scheduled': 'appt_scheduled',
  'proposal': 'proposal',
  'in_production': 'in_production',
  'completed': 'completed'
};

export function normalizeStatus(status: string): PipelineStage {
  return STATUS_MAP[status] || 'new_lead';
}

interface UseLeadPipelineReturn {
  updateLeadStatus: (leadId: string, newStatus: PipelineStage) => Promise<boolean>;
  isUpdating: boolean;
  getNextAllowedStatuses: (currentStatus: string) => PipelineStage[];
  getStageIndex: (status: string) => number;
}

export function useLeadPipeline(): UseLeadPipelineReturn {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const getStageIndex = useCallback((status: string): number => {
    const normalized = normalizeStatus(status);
    return PIPELINE_STAGES.indexOf(normalized);
  }, []);

  const getNextAllowedStatuses = useCallback((currentStatus: string): PipelineStage[] => {
    const normalized = normalizeStatus(currentStatus);
    return VALID_TRANSITIONS[normalized] || [];
  }, []);

  const updateLeadStatus = useCallback(async (
    leadId: string, 
    newStatus: PipelineStage
  ): Promise<boolean> => {
    setIsUpdating(true);
    
    try {
      // Get current status
      const { data: lead, error: fetchError } = await supabase
        .from('leads')
        .select('status')
        .eq('id', leadId)
        .single();

      if (fetchError || !lead) {
        toast({
          title: "Erro",
          description: "Lead não encontrado",
          variant: "destructive"
        });
        return false;
      }

      const currentNormalized = normalizeStatus(lead.status);
      const allowedNext = VALID_TRANSITIONS[currentNormalized] || [];

      // Validate transition
      if (!allowedNext.includes(newStatus)) {
      toast({
        title: "⚠️ Transição Bloqueada",
        description: `Não é possível pular etapas. De "${STAGE_LABELS[currentNormalized]}" só pode ir para: ${allowedNext.map(s => STAGE_LABELS[s]).join(', ') || 'nenhum (estado final)'}`,
        variant: "destructive"
      });
        return false;
      }

      // Perform update
      const { error } = await supabase
        .from('leads')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) {
        toast({
          title: "Erro ao atualizar",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "✓ Lead Avançado",
        description: `Movido para "${STAGE_LABELS[newStatus]}"`,
      });
      
      return true;
    } catch (err) {
      console.error('Update exception:', err);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do lead",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [toast]);

  return {
    updateLeadStatus,
    isUpdating,
    getNextAllowedStatuses,
    getStageIndex
  };
}
