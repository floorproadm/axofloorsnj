import { useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import { Send, Star, Mail, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ReviewRequest = {
  id: string;
  project_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  project_address: string | null;
  channel: string;
  status: "pending" | "sent" | "responded" | "failed";
  sent_at: string | null;
  responded_at: string | null;
  rating: number | null;
  created_at: string;
};

const statusBadge = (s: string) => {
  switch (s) {
    case "sent": return "text-blue-600 border-blue-500/30 bg-blue-500/10";
    case "responded": return "text-emerald-600 border-emerald-500/30 bg-emerald-500/10";
    case "failed": return "text-red-600 border-red-500/30 bg-red-500/10";
    default: return "text-amber-600 border-amber-500/30 bg-amber-500/10";
  }
};

export default function Reputation() {
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["review-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_requests")
        .select("id, project_id, customer_name, customer_email, customer_phone, project_address, channel, status, sent_at, responded_at, rating, created_at")
        .eq("organization_id", AXO_ORG_ID)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReviewRequest[];
    },
  });

  // Completed projects with no review_request yet → eligible for manual send
  const { data: eligibleProjects = [] } = useQuery({
    queryKey: ["reputation-eligible-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, customer_name, customer_email, customer_phone, address, city, completion_date")
        .eq("organization_id", AXO_ORG_ID)
        .eq("project_status", "completed")
        .order("completion_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      const sentIds = new Set(requests.map(r => r.project_id).filter(Boolean));
      return (data ?? []).filter((p: any) => !sentIds.has(p.id));
    },
    enabled: !isLoading,
  });

  const sendMutation = useMutation({
    mutationFn: async (payload: { review_request_id?: string; project_id?: string }) => {
      const { data, error } = await supabase.functions.invoke("reputation-request", {
        body: { ...payload, organization_id: AXO_ORG_ID },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Pedido de review enviado");
      qc.invalidateQueries({ queryKey: ["review-requests"] });
      qc.invalidateQueries({ queryKey: ["reputation-eligible-projects"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao enviar"),
  });

  const counters = useMemo(() => {
    const sent = requests.filter(r => r.status === "sent" || r.status === "responded").length;
    const responded = requests.filter(r => r.status === "responded").length;
    const pending = requests.filter(r => r.status === "pending").length;
    return { sent, responded, pending };
  }, [requests]);

  return (
    <AdminLayout title="Reputation">
      <div className="space-y-5">
        {/* Counters */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Enviados</p>
            <p className="text-2xl font-bold text-blue-500">{counters.sent}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Respondidos</p>
            <p className="text-2xl font-bold text-emerald-500">{counters.responded}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Pendentes</p>
            <p className="text-2xl font-bold text-amber-500">{counters.pending}</p>
          </CardContent></Card>
        </div>

        {/* Headline counter */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm font-semibold">{counters.sent} pedidos enviados · {counters.responded} reviews recebidos</p>
            <p className="text-xs text-muted-foreground mt-1">Engine automática dispara um pedido sempre que um job é marcado como completed.</p>
          </CardContent>
        </Card>

        {/* Eligible projects (manual send) */}
        {eligibleProjects.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Jobs concluídos sem pedido de review ({eligibleProjects.length})
              </p>
              <div className="space-y-1.5">
                {eligibleProjects.slice(0, 10).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/50 bg-muted/20">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.customer_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[p.address, p.city].filter(Boolean).join(", ") || "—"}
                        {p.completion_date ? ` · ${format(new Date(p.completion_date), "MMM d, yyyy")}` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={sendMutation.isPending}
                      onClick={() => sendMutation.mutate({ project_id: p.id })}
                    >
                      {sendMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                      Enviar manualmente
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Requests list */}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Pedidos enviados ({requests.length})
            </p>
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-8 text-center">Carregando…</div>
            ) : requests.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">Nenhum pedido ainda. Marque um job como completed para disparar automaticamente.</div>
            ) : (
              <div className="space-y-1.5">
                {requests.map(r => (
                  <div key={r.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {r.channel === "email" ? <Mail className="w-4 h-4 text-muted-foreground" /> : <MessageSquare className="w-4 h-4 text-muted-foreground" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.customer_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.project_address || r.customer_email || r.customer_phone || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {r.rating != null && (
                        <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                          <Star className="w-3.5 h-3.5 fill-current" />{r.rating.toFixed(1)}
                        </span>
                      )}
                      <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", statusBadge(r.status))}>
                        {r.status}
                      </Badge>
                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground">
                          {r.sent_at ? format(new Date(r.sent_at), "MMM d") : format(new Date(r.created_at), "MMM d")}
                        </p>
                      </div>
                      {r.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={sendMutation.isPending}
                          onClick={() => sendMutation.mutate({ review_request_id: r.id })}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
