import { useLeadAutomations } from "@/hooks/useLeadAutomations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  CheckCircle2,
  Clock,
  XCircle,
  MinusCircle,
  Pause,
  CheckCheck,
  RotateCw,
  Inbox,
  ExternalLink,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface Props {
  leadId: string;
}

const channelIcon = (ch: string) => {
  if (ch === "email") return <Mail className="w-3.5 h-3.5" />;
  if (ch === "sms") return <MessageSquare className="w-3.5 h-3.5" />;
  if (ch === "whatsapp") return <Phone className="w-3.5 h-3.5" />;
  return <Mail className="w-3.5 h-3.5" />;
};

const statusVisual = (s: string) => {
  switch (s) {
    case "sent":
      return { Icon: CheckCircle2, cls: "text-emerald-500", label: "Enviado" };
    case "pending":
      return { Icon: Clock, cls: "text-blue-500", label: "Agendado" };
    case "failed":
      return { Icon: XCircle, cls: "text-red-500", label: "Falhou" };
    case "skipped":
      return { Icon: MinusCircle, cls: "text-muted-foreground", label: "Pulado" };
    default:
      return { Icon: Clock, cls: "text-muted-foreground", label: s };
  }
};

export function LeadAutomationsPanel({ leadId }: Props) {
  const {
    enrollments,
    activeEnrollment,
    nextDrip,
    lastSent,
    failedCount,
    isLoading,
    pauseAll,
    markResponded,
    retryDrip,
  } = useLeadAutomations(leadId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!enrollments.length) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Nenhuma automação inscrita para este lead</p>
        <p className="text-xs mt-1">
          Automações iniciam automaticamente quando o stage do lead bate com uma sequência ativa.
        </p>
      </div>
    );
  }

  const hasActive = !!activeEnrollment;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* Header status */}
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge
                variant={hasActive ? "default" : "secondary"}
                className={hasActive ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 border-emerald-500/30" : ""}
              >
                {hasActive ? "Automação ativa" : "Pausada"}
              </Badge>
              {activeEnrollment?.sequence && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {activeEnrollment.sequence.name}
                </span>
              )}
              {failedCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {failedCount} {failedCount === 1 ? "falha" : "falhas"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => markResponded.mutate()}
                disabled={markResponded.isPending || !hasActive}
                className="gap-1.5 h-7 text-xs"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Lead respondeu
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => pauseAll.mutate()}
                disabled={pauseAll.isPending || !hasActive}
                className="gap-1.5 h-7 text-xs"
              >
                <Pause className="w-3.5 h-3.5" />
                Pausar
              </Button>
              <Button asChild size="sm" variant="ghost" className="gap-1.5 h-7 text-xs">
                <Link to="/admin/automations">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Logs
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
            <div>
              <div className="text-muted-foreground">Próximo envio</div>
              <div className="font-medium tabular-nums">
                {nextDrip
                  ? `${formatDistanceToNow(new Date(nextDrip.scheduled_at), { locale: ptBR, addSuffix: true })}`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Último enviado</div>
              <div className="font-medium tabular-nums">
                {lastSent?.sent_at
                  ? `${formatDistanceToNow(new Date(lastSent.sent_at), { locale: ptBR, addSuffix: true })}`
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline per enrollment */}
        {enrollments.map((enr) => (
          <div key={enr.id} className="rounded-lg border bg-card">
            <div className="px-3 py-2 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {enr.sequence?.name || "Sequência"}
                </span>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  {enr.status === "active"
                    ? "Ativo"
                    : enr.status === "completed"
                    ? "Concluído"
                    : "Cancelado"}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {format(new Date(enr.enrolled_at), "dd/MM HH:mm")}
              </span>
            </div>

            <div className="divide-y">
              {enr.logs.length === 0 ? (
                <div className="p-3 text-xs text-muted-foreground">Sem drips agendados.</div>
              ) : (
                enr.logs.map((log) => {
                  const v = statusVisual(log.status);
                  const dt =
                    log.status === "sent" && log.sent_at
                      ? log.sent_at
                      : log.scheduled_at;
                  return (
                    <div key={log.id} className="px-3 py-2 flex items-start gap-3">
                      <div className={`mt-0.5 ${v.cls}`}>
                        <v.Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium">{v.label}</span>
                          {log.drip && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              {channelIcon(log.drip.channel)}
                              {log.drip.channel}
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {format(new Date(dt), "dd/MM HH:mm")}
                          </span>
                        </div>
                        {log.drip?.subject && (
                          <p className="text-xs mt-0.5 truncate">{log.drip.subject}</p>
                        )}
                        {log.error_message && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-[11px] text-red-500 mt-0.5 truncate cursor-help">
                                {log.error_message}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              {log.error_message}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      {log.status === "failed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 gap-1 text-[11px]"
                          onClick={() => retryDrip.mutate(log.id)}
                          disabled={retryDrip.isPending}
                        >
                          <RotateCw className="w-3 h-3" />
                          Reenviar
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
