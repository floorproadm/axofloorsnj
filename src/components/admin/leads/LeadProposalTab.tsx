import { ProposalGenerator } from '@/components/admin/ProposalGenerator';

interface Props {
  leadId: string;
  organizationId?: string;
  customerName?: string;
  budget?: number;
  onProposalSent?: () => void;
}

/**
 * Lead drawer "Proposta" tab — renders the exact same full ProposalGenerator
 * used inside the Project drawer, in lead-mode:
 *  - proposal row is keyed by lead_id (project_id stays NULL until lead conversion)
 *  - "Send to Client" also advances the lead to "Proposta Enviada" + syncs budget KPI
 */
export function LeadProposalTab({ leadId, onProposalSent }: Props) {
  return <ProposalGenerator leadId={leadId} onProposalSent={onProposalSent} />;
}
