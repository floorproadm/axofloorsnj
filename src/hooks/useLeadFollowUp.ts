import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FollowUpAction {
  date: string;
  action: string;
  notes?: string;
}

interface UseLeadFollowUpReturn {
  addFollowUpAction: (leadId: string, action: FollowUpAction) => Promise<boolean>;
  updateNextActionDate: (leadId: string, date: Date) => Promise<boolean>;
  getFollowUpStatus: (lead: LeadWithFollowUp) => FollowUpStatus;
  isUpdating: boolean;
}

export interface LeadWithFollowUp {
  id: string;
  status: string;
  follow_up_required?: boolean;
  next_action_date?: string;
  follow_up_actions?: FollowUpAction[];
}

export interface FollowUpStatus {
  required: boolean;
  hasActions: boolean;
  actionCount: number;
  nextActionDate: Date | null;
  isOverdue: boolean;
  canClose: boolean;
}

export function useLeadFollowUp(): UseLeadFollowUpReturn {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const addFollowUpAction = useCallback(async (
    leadId: string, 
    action: FollowUpAction
  ): Promise<boolean> => {
    setIsUpdating(true);
    
    try {
      // First get current actions
      const { data: lead, error: fetchError } = await supabase
        .from('leads')
        .select('follow_up_actions')
        .eq('id', leadId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Parse existing actions - handle the Json type from Supabase
      const existingActions: FollowUpAction[] = Array.isArray(lead?.follow_up_actions) 
        ? (lead.follow_up_actions as unknown as FollowUpAction[])
        : [];
      
      // Add new action
      const updatedActions = [...existingActions, action];

      // Update lead - cast to any to bypass strict Json typing
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          follow_up_actions: JSON.parse(JSON.stringify(updatedActions)),
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Ação Registrada",
        description: `Follow-up "${action.action}" adicionado com sucesso`,
      });

      return true;
    } catch (err) {
      console.error('Error adding follow-up action:', err);
      toast({
        title: "Erro",
        description: "Falha ao registrar ação de follow-up",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [toast]);

  const updateNextActionDate = useCallback(async (
    leadId: string, 
    date: Date
  ): Promise<boolean> => {
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          next_action_date: date.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) {
        throw error;
      }

      toast({
        title: "Data Atualizada",
        description: `Próxima ação agendada para ${date.toLocaleDateString('pt-BR')}`,
      });

      return true;
    } catch (err) {
      console.error('Error updating next action date:', err);
      toast({
        title: "Erro",
        description: "Falha ao atualizar data",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [toast]);

  const getFollowUpStatus = useCallback((lead: LeadWithFollowUp): FollowUpStatus => {
    const actions = Array.isArray(lead.follow_up_actions) ? lead.follow_up_actions : [];
    const nextDate = lead.next_action_date ? new Date(lead.next_action_date) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isOverdue = nextDate ? nextDate < today : false;
    const hasActions = actions.length > 0;

    return {
      required: lead.follow_up_required ?? false,
      hasActions,
      actionCount: actions.length,
      nextActionDate: nextDate,
      isOverdue,
      canClose: hasActions // Can only close (won/lost) if at least one action exists
    };
  }, []);

  return {
    addFollowUpAction,
    updateNextActionDate,
    getFollowUpStatus,
    isUpdating
  };
}
