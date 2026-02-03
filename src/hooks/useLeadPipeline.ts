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

// Stage labels for display
export const STAGE_LABELS: Record<PipelineStage, string> = {
  new_lead: 'New Lead',
  appt_scheduled: 'Appt. Scheduled',
  proposal: 'Proposal',
  in_production: 'In Production',
  completed: 'Completed',
  lost: 'Lost'
};

// Stage icons and colors config
export const STAGE_CONFIG: Record<PipelineStage, { 
  color: string; 
  bgColor: string; 
  borderColor: string;
  textColor: string;
}> = {
  new_lead: { 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50', 
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700'
  },
  appt_scheduled: { 
    color: 'text-cyan-600', 
    bgColor: 'bg-cyan-50', 
    borderColor: 'border-cyan-300',
    textColor: 'text-cyan-700'
  },
  proposal: { 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50', 
    borderColor: 'border-purple-300',
    textColor: 'text-purple-700'
  },
  in_production: { 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-50', 
    borderColor: 'border-amber-300',
    textColor: 'text-amber-700'
  },
  completed: { 
    color: 'text-green-600', 
    bgColor: 'bg-green-50', 
    borderColor: 'border-green-300',
    textColor: 'text-green-700'
  },
  lost: { 
    color: 'text-red-600', 
    bgColor: 'bg-red-50', 
    borderColor: 'border-red-300',
    textColor: 'text-red-700'
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
          title: "Transição Bloqueada",
          description: `De "${STAGE_LABELS[currentNormalized]}" só pode ir para: ${allowedNext.map(s => STAGE_LABELS[s]).join(', ') || 'nenhum (terminal)'}`,
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
        title: "Status Atualizado",
        description: `Lead movido para "${STAGE_LABELS[newStatus]}"`,
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
