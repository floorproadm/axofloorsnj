import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type InvoicePhase = 'deposit' | 'progress' | 'final';

export interface SuggestedInvoice {
  phase: InvoicePhase;
  amount: number;
  percentage: number;
  label: string;
  dueInDays: number;
  proposalTotal: number;
  projectAddress: string | null;
  projectType: string | null;
  customerId: string | null;
  propertyId: string | null;
}

const DEFAULT_SCHEDULE: Record<InvoicePhase, number> = {
  deposit: 30,
  progress: 40,
  final: 30,
};

const DUE_DAYS: Record<InvoicePhase, number> = {
  deposit: 7,
  progress: 14,
  final: 14,
};

const PHASE_LABEL: Record<InvoicePhase, string> = {
  deposit: 'Deposit Invoice',
  progress: 'Progress Invoice',
  final: 'Final Invoice',
};

function proposalTotal(p: any): number {
  if (!p) return 0;
  if (!p.use_tiers) return Number(p.flat_price || 0);
  const tier = p.selected_tier || 'good';
  return Number(p[`${tier}_price`] || p.good_price || 0);
}

export function useSuggestedInvoice(projectId: string | undefined) {
  return useQuery({
    queryKey: ['suggested-invoice', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<SuggestedInvoice | null> => {
      const [{ data: project }, { data: proposals }, { data: invoices }] = await Promise.all([
        supabase
          .from('projects')
          .select('id, address, project_type, customer_id, property_id')
          .eq('id', projectId!)
          .maybeSingle() as any,
        supabase
          .from('proposals')
          .select('id, status, use_tiers, selected_tier, good_price, better_price, best_price, flat_price, accepted_at')
          .eq('project_id', projectId!)
          .eq('status', 'accepted')
          .order('accepted_at', { ascending: false })
          .limit(1),
        supabase
          .from('invoices')
          .select('id, phase, status, amount, total_amount')
          .eq('project_id', projectId!),
      ]);

      const proposal = proposals?.[0];
      const total = proposalTotal(proposal);
      if (!proposal || total <= 0) return null;

      const has = (phase: InvoicePhase) =>
        (invoices || []).some((i: any) => i.phase === phase);
      const isPaid = (phase: InvoicePhase) =>
        (invoices || []).some((i: any) => i.phase === phase && i.status === 'paid');

      let nextPhase: InvoicePhase | null = null;
      if (!has('deposit')) nextPhase = 'deposit';
      else if (isPaid('deposit') && !has('progress')) nextPhase = 'progress';
      else if (isPaid('progress') && !has('final')) nextPhase = 'final';

      if (!nextPhase) return null;

      const percentage = DEFAULT_SCHEDULE[nextPhase];
      const amount = Math.round((total * percentage) / 100 * 100) / 100;

      return {
        phase: nextPhase,
        amount,
        percentage,
        label: PHASE_LABEL[nextPhase],
        dueInDays: DUE_DAYS[nextPhase],
        proposalTotal: total,
        projectAddress: project?.address || null,
        projectType: project?.project_type || null,
        customerId: project?.customer_id || null,
        propertyId: project?.property_id || null,
      };
    },
  });
}
