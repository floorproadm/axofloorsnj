import { Badge } from '@/components/ui/badge';
import { normalizeStatus, type PipelineStage } from '@/hooks/useLeadPipeline';
import { useLeadFollowUp, type LeadWithFollowUp } from '@/hooks/useLeadFollowUp';
import { AlertTriangle, Ban, CheckCircle2, Clock } from 'lucide-react';
import { differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';

interface LeadSignalBadgeProps {
  lead: LeadWithFollowUp & {
    updated_at: string;
    converted_to_project_id?: string;
  };
  compact?: boolean;
}

type SignalType = 'blocked' | 'risk' | 'ok' | 'terminal';

interface Signal {
  type: SignalType;
  label: string;
  icon: React.ReactNode;
}

export function LeadSignalBadge({ lead, compact = false }: LeadSignalBadgeProps) {
  const { getFollowUpStatus } = useLeadFollowUp();
  const stage = normalizeStatus(lead.status);
  const followUpStatus = getFollowUpStatus(lead);
  
  const isStale = differenceInHours(new Date(), new Date(lead.updated_at)) > 48;
  const isTerminal = stage === 'completed' || stage === 'lost';
  
  // Determine signal
  const getSignal = (): Signal => {
    // Terminal states
    if (isTerminal) {
      return {
        type: 'terminal',
        label: stage === 'completed' ? 'Fechado' : 'Perdido',
        icon: stage === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : null
      };
    }
    
    // Blocked: proposal without follow-up
    if (stage === 'proposal' && !followUpStatus.hasActions) {
      return {
        type: 'blocked',
        label: compact ? 'Bloqueado' : 'Sem follow-up registrado',
        icon: <Ban className="w-3 h-3" />
      };
    }
    
    // Blocked: in_production without project
    if (stage === 'in_production' && !lead.converted_to_project_id) {
      return {
        type: 'blocked',
        label: compact ? 'Bloqueado' : 'Sem projeto vinculado',
        icon: <Ban className="w-3 h-3" />
      };
    }
    
    // Risk: overdue follow-up
    if (followUpStatus.isOverdue) {
      return {
        type: 'risk',
        label: compact ? 'Atrasado' : 'Follow-up atrasado',
        icon: <AlertTriangle className="w-3 h-3" />
      };
    }
    
    // Risk: stale lead
    if (isStale) {
      return {
        type: 'risk',
        label: compact ? '+48h' : 'Parado há +48h',
        icon: <Clock className="w-3 h-3" />
      };
    }
    
    // OK: ready to advance
    return {
      type: 'ok',
      label: compact ? 'OK' : 'Pronto para avançar',
      icon: <CheckCircle2 className="w-3 h-3" />
    };
  };

  const signal = getSignal();
  
  const signalStyles: Record<SignalType, string> = {
    blocked: 'bg-state-blocked/10 text-state-blocked border-state-blocked',
    risk: 'bg-state-risk/10 text-state-risk border-state-risk',
    ok: 'bg-state-success/10 text-state-success border-state-success',
    terminal: 'bg-muted text-muted-foreground border-muted-foreground/30'
  };

  if (compact && signal.type === 'ok') {
    return null; // Don't show OK badge in compact mode
  }

  return (
    <Badge 
      variant="outline"
      className={cn(
        "text-[10px] font-medium flex items-center gap-1 border",
        signalStyles[signal.type]
      )}
    >
      {signal.icon}
      {signal.label}
    </Badge>
  );
}
