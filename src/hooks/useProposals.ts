import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Proposal = Tables<'proposals'>;
export type ProposalInsert = TablesInsert<'proposals'>;
export type ProposalUpdate = TablesUpdate<'proposals'>;

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';

const PROPOSALS_KEY = 'proposals';

/**
 * Generate a unique proposal number: PROP-YYYYMMDD-XXXX
 */
function generateProposalNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PROP-${dateStr}-${rand}`;
}

export function useProposals() {
  const queryClient = useQueryClient();

  /** Fetch proposal by project ID */
  const useProposalByProject = (projectId: string | undefined) =>
    useQuery({
      queryKey: [PROPOSALS_KEY, 'project', projectId],
      queryFn: async () => {
        if (!projectId) return null;
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        return data;
      },
      enabled: !!projectId,
    });

  /** Fetch proposal by ID */
  const useProposalById = (id: string | undefined) =>
    useQuery({
      queryKey: [PROPOSALS_KEY, id],
      queryFn: async () => {
        if (!id) return null;
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return data;
      },
      enabled: !!id,
    });

  /** Create proposal */
  const createProposal = useMutation({
    mutationFn: async (input: Omit<ProposalInsert, 'proposal_number'> & { proposal_number?: string }) => {
      if (!input.project_id || !input.customer_id) {
        throw new Error('project_id and customer_id are required');
      }
      const insertData: ProposalInsert = {
        ...input,
        proposal_number: input.proposal_number || generateProposalNumber(),
      };
      const { data, error } = await supabase
        .from('proposals')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_KEY, 'project', data.project_id] });
    },
  });

  /** Update proposal */
  const updateProposal = useMutation({
    mutationFn: async ({ id, ...updates }: ProposalUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_KEY, data.id] });
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_KEY, 'project', data.project_id] });
    },
  });

  /** Update proposal status */
  const updateProposalStatus = useMutation({
    mutationFn: async ({ id, status, selected_tier }: { id: string; status: ProposalStatus; selected_tier?: string }) => {
      const updates: ProposalUpdate = { status };

      // Set sent_at when transitioning to sent
      if (status === 'sent') {
        updates.sent_at = new Date().toISOString();
      }

      // Set accepted fields — trigger auto-fills accepted_at if null
      if (status === 'accepted') {
        if (!selected_tier) throw new Error('selected_tier is required for acceptance');
        updates.selected_tier = selected_tier;
        updates.accepted_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_KEY, data.id] });
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_KEY, 'project', data.project_id] });
    },
  });

  /** Delete proposal */
  const deleteProposal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_KEY] });
    },
  });

  return {
    useProposalByProject,
    useProposalById,
    createProposal,
    updateProposal,
    updateProposalStatus,
    deleteProposal,
  };
}
