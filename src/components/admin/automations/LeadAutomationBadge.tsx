import { Mail, AlertTriangle, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { LeadAutomationStatus } from "@/hooks/useLeadAutomations";

interface Props {
  status: LeadAutomationStatus | undefined;
}

/**
 * Discrete automation indicator for lead cards.
 * Priority: failed > pending > recently sent > nothing
 */
export function LeadAutomationBadge({ status }: Props) {
  if (!status) return null;

  const { failed_count, pending_count, last_sent_at, next_scheduled_at, last_error } = status;

  let icon: JSX.Element | null = null;
  let tip = "";

  if (failed_count > 0) {
    icon = <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
    tip = `Falha no último envio${last_error ? `: ${last_error}` : ""}`;
  } else if (pending_count > 0 && next_scheduled_at) {
    icon = <Clock className="w-3.5 h-3.5 text-blue-500" />;
    tip = `Próximo: ${formatDistanceToNow(new Date(next_scheduled_at), {
      locale: ptBR,
      addSuffix: true,
    })}`;
  } else if (last_sent_at) {
    const hours = (Date.now() - new Date(last_sent_at).getTime()) / 36e5;
    if (hours <= 48) {
      icon = <Mail className="w-3.5 h-3.5 text-emerald-500" />;
      tip = `Enviado ${formatDistanceToNow(new Date(last_sent_at), {
        locale: ptBR,
        addSuffix: true,
      })}`;
    }
  }

  if (!icon) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center" aria-label={tip}>
            {icon}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
