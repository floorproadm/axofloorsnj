import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Pipeline stages in order
export const PIPELINE_STAGES = ['new', 'contacted', 'quoted', 'won', 'lost'] as const;
export type PipelineStage = typeof PIPELINE_STAGES[number];

// Stage labels for display
export const STAGE_LABELS: Record<PipelineStage, string> = {
  new: 'Novo',
  contacted: 'Contatado',
  quoted: 'Cotado',
  won: 'Ganho',
  lost: 'Perdido'
};

// Valid transitions map
export const VALID_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  new: ['contacted'],
  contacted: ['quoted'],
  quoted: ['won', 'lost'],
  won: [],
  lost: []
};

interface TransitionValidation {
  canTransition: boolean;
  errorMessage: string | null;
  currentStatus: string | null;
  requiredStatus: string | null;
}

interface UseLeadPipelineReturn {
  validateTransition: (leadId: string, newStatus: PipelineStage) => Promise<TransitionValidation>;
  updateLeadStatus: (leadId: string, newStatus: PipelineStage) => Promise<boolean>;
  isValidating: boolean;
  isUpdating: boolean;
  getNextAllowedStatuses: (currentStatus: string) => PipelineStage[];
}

export function useLeadPipeline(): UseLeadPipelineReturn {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const validateTransition = useCallback(async (
    leadId: string, 
    newStatus: PipelineStage
  ): Promise<TransitionValidation> => {
    setIsValidating(true);
    
    try {
      const { data, error } = await supabase
        .rpc('validate_lead_transition', {
          p_lead_id: leadId,
          p_new_status: newStatus
        });

      if (error) {
        console.error('Validation error:', error);
        return {
          canTransition: false,
          errorMessage: error.message,
          currentStatus: null,
          requiredStatus: null
        };
      }

      const result = data?.[0];
      
      return {
        canTransition: result?.can_transition ?? false,
        errorMessage: result?.error_message ?? null,
        currentStatus: result?.current_status ?? null,
        requiredStatus: result?.required_status ?? null
      };
    } catch (err) {
      console.error('Validation exception:', err);
      return {
        canTransition: false,
        errorMessage: 'Erro ao validar transição',
        currentStatus: null,
        requiredStatus: null
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const updateLeadStatus = useCallback(async (
    leadId: string, 
    newStatus: PipelineStage
  ): Promise<boolean> => {
    setIsUpdating(true);
    
    try {
      // First validate
      const validation = await validateTransition(leadId, newStatus);
      
      if (!validation.canTransition) {
        toast({
          title: "Transição Bloqueada",
          description: validation.errorMessage || "Transição não permitida",
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
  }, [validateTransition, toast]);

  const getNextAllowedStatuses = useCallback((currentStatus: string): PipelineStage[] => {
    const stage = currentStatus as PipelineStage;
    return VALID_TRANSITIONS[stage] || [];
  }, []);

  return {
    validateTransition,
    updateLeadStatus,
    isValidating,
    isUpdating,
    getNextAllowedStatuses
  };
}
