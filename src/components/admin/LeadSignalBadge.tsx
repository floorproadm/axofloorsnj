import { Badge } from '@/components/ui/badge';
import { type LeadNRA } from '@/hooks/useLeadNRA';
import { AlertTriangle, Ban, CheckCircle2, Clock } from 'lucide-react';
import { differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';

interface LeadSignalBadgeProps {
  lead: {
    updated_at: string;
    status: string;
  };
  nra?: LeadNRA | null;
  compact?: boolean;
}

type SignalType = 'blocked' | 'risk' | 'ok' | 'terminal';

interface Signal {
  type: SignalType;
  label: string;
  icon: React.ReactNode;
}

export function LeadSignalBadge({ lead, nra, compact = false }: LeadSignalBadgeProps) {
  const isStale = differenceInHours(new Date(), new Date(lead.updated_at)) > 48;
  const isTerminal = lead.status === 'completed' || lead.status === 'lost';
  
  const getSignal = (): Signal => {
    if (isTerminal) {
      return {
        type: 'terminal',
        label: lead.status === 'completed' ? 'Fechado' : 'Perdido',
        icon: lead.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : null
      };
    }

    // Use NRA severity as single source of truth
    if (nra) {
      if (nra.severity === 'critical' || nra.severity === 'blocked') {
        return {
          type: 'blocked',
          label: compact ? 'Bloqueado' : nra.label,
          icon: <Ban className="w-3 h-3" />
        };
      }
    }
    
    // Risk: stale lead
    if (isStale) {
      return {
        type: 'risk',
        label: compact ? '+48h' : 'Parado há +48h',
        icon: <Clock className="w-3 h-3" />
      };
    }
    
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
    return null;
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
