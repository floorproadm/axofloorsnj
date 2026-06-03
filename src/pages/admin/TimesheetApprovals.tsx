import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  usePendingTimesheet,
  useApproveTimesheet,
  useRejectTimesheet,
  type TimesheetEntry,
} from "@/hooks/useTimesheet";
import { Loader2, CheckCircle2, XCircle, Clock, Inbox } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function DaySheetApprovalsContent({ showHeader = true }: { showHeader?: boolean }) {
  const { data: entries = [], isLoading } = usePendingTimesheet();
  const approve = useApproveTimesheet();
  const reject = useRejectTimesheet();

  const [rejectTarget, setRejectTarget] = useState<TimesheetEntry | null>(null);
  const [reason, setReason] = useState("");

  const handleApprove = (e: TimesheetEntry) => {
    approve.mutate(e.id, {
      onSuccess: () => toast.success(`Aprovado: ${e.worker_name}`),
      onError: (err: any) => toast.error(err.message || "Falha ao aprovar"),
    });
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    if (!reason.trim()) return toast.error("Informe o motivo");
    reject.mutate(
      { id: rejectTarget.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Lançamento rejeitado");
          setRejectTarget(null);
          setReason("");
        },
        onError: (err: any) => toast.error(err.message || "Falha ao rejeitar"),
      }
    );
  };

  const totalCost = entries.reduce((s, e) => s + Number(e.total_cost || 0), 0);
  const dailyCount = entries.filter((e) => e.pay_mode === "daily").length;
  const sqftCount = entries.filter((e) => e.pay_mode === "sqft").length;

  return (
    <>
      <div className="space-y-6">
        {showHeader && (
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
              <Inbox className="h-6 w-6" />
              DaySheet Approvals
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Lançamentos dos colaboradores aguardando aprovação. Apenas aprovados entram no
              custo do projeto.
            </p>
          </div>
        )}


        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{entries.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground">Mix</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {dailyCount}d · {sqftCount}s
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase text-muted-foreground">Custo se aprovar</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                ${totalCost.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Nenhuma aprovação pendente.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => {
              const isSqft = e.pay_mode === "sqft";
              const qty = isSqft ? Number(e.sqft_worked || 0) : Number(e.days_worked || 0);
              const rate = isSqft ? Number(e.sqft_rate || 0) : Number(e.daily_rate || 0);
              return (
              <Card key={e.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Clock className="h-4 w-4 text-[hsl(var(--state-risk))]" />
                      <span className="font-semibold text-foreground">{e.worker_name}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {e.role || "helper"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {isSqft ? "SqFt" : "Diária"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        → {e.projects?.customer_name || "Projeto"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground tabular-nums">
                      <span>📅 {format(parseISO(e.work_date), "MMM d, yyyy")}</span>
                      <span>
                        {isSqft
                          ? `📐 ${qty} sqft × $${rate.toFixed(2)}`
                          : `⏱ ${qty.toFixed(1)}d × $${rate.toFixed(2)}`}
                      </span>
                      <span className="font-semibold text-foreground">
                        = ${Number(e.total_cost || 0).toFixed(2)}
                      </span>
                    </div>
                    {e.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{e.notes}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setRejectTarget(e);
                        setReason("");
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                    <Button size="sm" onClick={() => handleApprove(e)}>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {rejectTarget?.worker_name} — {rejectTarget?.projects?.customer_name} —{" "}
              {rejectTarget && format(parseISO(rejectTarget.work_date), "MMM d")}
            </p>
            <Textarea
              placeholder="Motivo (ex: data incorreta, projeto errado, horas não condizem)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reject.isPending || !reason.trim()}
            >
              {reject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
