import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, CheckCircle2, AlertCircle, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PartnerInviteLogsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InviteLogRow {
  id: string;
  created_at: string;
  recipient_email: string;
  status: string;
  link_id: string | null;
  invite_kind: string | null;
  error_message: string | null;
  partner_id: string;
  partners?: { company_name: string | null; contact_name: string | null } | null;
}

export function PartnerInviteLogsSheet({ open, onOpenChange }: PartnerInviteLogsSheetProps) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["partner-invite-logs-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_invite_logs")
        .select("id, created_at, recipient_email, status, link_id, invite_kind, error_message, partner_id, partners(company_name, contact_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as InviteLogRow[];
    },
    enabled: open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Histórico de convites
          </SheetTitle>
          <SheetDescription>
            Últimos 100 convites enviados a parceiros, com data/hora, destinatário, status e ID do link.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border/50 rounded-lg">
              <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Nenhum convite enviado ainda</p>
              <p className="text-xs mt-1">
                Abra um parceiro e use "Acesso ao Portal do Parceiro" para enviar o primeiro convite.
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-6">
              {logs.map((log) => {
                const isSuccess = log.status === "sent" || log.status === "success";
                const partnerName =
                  log.partners?.company_name || log.partners?.contact_name || "Parceiro";
                return (
                  <div
                    key={log.id}
                    className="rounded-lg border border-border/50 bg-card p-3 text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{partnerName}</div>
                        <div className="text-muted-foreground truncate">{log.recipient_email}</div>
                      </div>
                      <Badge
                        variant={isSuccess ? "default" : "destructive"}
                        className="shrink-0 gap-1"
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {isSuccess ? "Enviado" : "Erro"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                      <span>
                        {formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                      <span className="text-border">•</span>
                      <span>{new Date(log.created_at).toLocaleString("pt-BR")}</span>
                      {log.invite_kind && (
                        <>
                          <span className="text-border">•</span>
                          <span className="uppercase tracking-wide">{log.invite_kind}</span>
                        </>
                      )}
                    </div>
                    {log.link_id && (
                      <div className="text-muted-foreground font-mono text-[10px] truncate">
                        link: {log.link_id}
                      </div>
                    )}
                    {log.error_message && (
                      <div className="text-destructive text-[11px]">{log.error_message}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
