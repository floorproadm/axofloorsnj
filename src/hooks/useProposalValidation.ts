import { supabase } from '@/integrations/supabase/client';

export interface ProposalValidationResult {
  canSend: boolean;
  errorMessage: string | null;
  currentMargin: number;
  minMargin: number;
}

/**
 * Server-side validation for proposal sending
 * Checks margin against company minimum - NO EXCEPTIONS
 * Logs blocked attempts to audit_log automatically
 */
export async function validateProposalMargin(projectId: string): Promise<ProposalValidationResult> {
  const { data, error } = await supabase
    .rpc('validate_proposal_margin', { p_project_id: projectId });
  
  if (error) {
    console.error('Proposal validation error:', error);
    return {
      canSend: false,
      errorMessage: 'BLOCKED: Validation failed - ' + error.message,
      currentMargin: 0,
      minMargin: 30,
    };
  }
  
  if (!data || data.length === 0) {
    return {
      canSend: false,
      errorMessage: 'BLOCKED: No validation data returned',
      currentMargin: 0,
      minMargin: 30,
    };
  }
  
  const result = data[0];
  
  return {
    canSend: result.can_send,
    errorMessage: result.error_message,
    currentMargin: result.current_margin,
    minMargin: result.min_margin,
  };
}

/**
 * Wrapper for proposal send action
 * ALWAYS call this before sending any proposal
 * Returns false if blocked - action must NOT proceed
 */
export async function canSendProposal(projectId: string): Promise<{ allowed: boolean; reason: string | null }> {
  const validation = await validateProposalMargin(projectId);
  
  return {
    allowed: validation.canSend,
    reason: validation.errorMessage,
  };
}
