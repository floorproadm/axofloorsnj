import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// 10-stage pipeline
export const PIPELINE_STAGES = [
  'cold_lead',
  'warm_lead', 
  'estimate_requested',
  'estimate_scheduled',
  'in_draft',
  'proposal_sent',
  'proposal_rejected',
  'in_production', 
  'completed', 
  'lost'
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

// Stage labels for display
export const STAGE_LABELS: Record<PipelineStage, string> = {
  cold_lead: 'Lead Frio',
  warm_lead: 'Lead Quente',
  estimate_requested: 'Orçamento Solicitado',
  estimate_scheduled: 'Visita Agendada',
  in_draft: 'Em Elaboração',
  proposal_sent: 'Proposta Enviada',
  proposal_rejected: 'Proposta Rejeitada',
  in_production: 'Em Produção',
  completed: 'Concluído',
  lost: 'Perdido'
};

// Stage visual config
export const STAGE_CONFIG: Record<PipelineStage, { 
  color: string; 
  bgColor: string; 
  borderColor: string;
  textColor: string;
  stateType: 'active' | 'warning' | 'success' | 'terminal';
}> = {
  cold_lead: { 
    color: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-sky-400',
    textColor: 'text-sky-700', stateType: 'active'
  },
  warm_lead: { 
    color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-400',
    textColor: 'text-orange-700', stateType: 'active'
  },
  estimate_requested: { 
    color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-400',
    textColor: 'text-indigo-700', stateType: 'active'
  },
  estimate_scheduled: { 
    color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-400',
    textColor: 'text-cyan-700', stateType: 'active'
  },
  in_draft: { 
    color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-400',
    textColor: 'text-amber-700', stateType: 'warning'
  },
  proposal_sent: { 
    color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-400',
    textColor: 'text-violet-700', stateType: 'active'
  },
  proposal_rejected: { 
    color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-400',
    textColor: 'text-rose-700', stateType: 'terminal'
  },
  in_production: { 
    color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-400',
    textColor: 'text-emerald-700', stateType: 'active'
  },
  completed: { 
    color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-400',
    textColor: 'text-green-700', stateType: 'success'
  },
  lost: { 
    color: 'text-slate-500', bgColor: 'bg-slate-100', borderColor: 'border-slate-300',
    textColor: 'text-slate-600', stateType: 'terminal'
  }
};

// Valid transitions
export const VALID_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  cold_lead: ['warm_lead'],
  warm_lead: ['estimate_requested'],
  estimate_requested: ['estimate_scheduled'],
  estimate_scheduled: ['in_draft'],
  in_draft: ['proposal_sent'],
  proposal_sent: ['in_production', 'proposal_rejected'],
  proposal_rejected: ['in_draft'],
  in_production: ['completed', 'lost'],
  completed: [],
  lost: []
};

// Backwards compatibility map
const STATUS_MAP: Record<string, PipelineStage> = {
  // Legacy statuses
  'new': 'cold_lead',
  'new_lead': 'cold_lead',
  'contacted': 'warm_lead',
  'appt_scheduled': 'estimate_scheduled',
  'quoted': 'proposal_sent',
  'proposal': 'proposal_sent',
  'won': 'completed',
  // New statuses map to themselves
  'cold_lead': 'cold_lead',
  'warm_lead': 'warm_lead',
  'estimate_requested': 'estimate_requested',
  'estimate_scheduled': 'estimate_scheduled',
  'in_draft': 'in_draft',
  'proposal_sent': 'proposal_sent',
  'proposal_rejected': 'proposal_rejected',
  'in_production': 'in_production',
  'completed': 'completed',
  'lost': 'lost'
};

export function normalizeStatus(status: string): PipelineStage {
  return STATUS_MAP[status] || 'cold_lead';
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
      const { data, error } = await supabase.rpc('transition_lead_status', {
        p_lead_id: leadId,
        p_new_status: newStatus
      });

      if (error) {
        const msg = error.message?.replace(/^.*?ERROR:\s*/, '') || error.message;
        toast({
          title: "⚠️ Transição Bloqueada",
          description: msg,
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
      console.error('Transition RPC exception:', err);
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
