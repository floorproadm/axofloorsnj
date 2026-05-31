import { useState } from "react";
import { useCollaboratorProjects } from "@/hooks/useCollaboratorProjects";
import {
  useMyTimesheet,
  useSubmitTimesheet,
  useDeleteMyTimesheet,
} from "@/hooks/useTimesheet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Plus, CheckCircle2, Clock, XCircle, Trash2, Calendar,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CollaboratorTimesheet() {
  const { data: projects = [] } = useCollaboratorProjects();
  const { data: entries = [], isLoading } = useMyTimesheet();
  const submit = useSubmitTimesheet();
  const del = useDeleteMyTimesheet();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    project_id: "",
    work_date: format(new Date(), "yyyy-MM-dd"),
    days_worked: "1",
    notes: "",
  });

  const handleSubmit = () => {
    if (!form.project_id) return toast.error("Selecione um projeto");
    const days = Number(form.days_worked);
    if (!days || days <= 0) return toast.error("Quantidade de dias inválida");
    submit.mutate(
      {
        project_id: form.project_id,
        work_date: form.work_date,
        days_worked: days,
        notes: form.notes,
      },
      {
        onSuccess: () => {
          toast.success("Lançamento enviado para aprovação");
          setForm({
            project_id: "",
            work_date: format(new Date(), "yyyy-MM-dd"),
            days_worked: "1",
            notes: "",
          });
          setShowForm(false);
        },
        onError: (e: any) => toast.error(e.message || "Falha ao enviar"),
      }
    );
  };

  const pending = entries.filter((e) => e.status === "pending");
  const approved = entries.filter((e) => e.status === "approved");
  const rejected = entries.filter((e) => e.status === "rejected");

  const totalApprovedDays = approved.reduce((s, e) => s + Number(e.days_worked || 0), 0);
  const totalApprovedPay = approved.reduce(
    (s, e) => s + Number(e.daily_rate || 0) * Number(e.days_worked || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground">Minhas Horas</h1>
          <p className="text-sm text-muted-foreground">Registre os dias trabalhados por projeto</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((s) => !s)} className="gap-1">
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Pendentes</p>
            <p className="text-lg font-bold text-foreground tabular-nums">{pending.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Dias Aprov.</p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {totalApprovedDays.toFixed(1)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Total Aprov.</p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              ${totalApprovedPay.toFixed(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* New entry form */}
      {showForm && (
        <Card className="border-primary/40">
          <CardContent className="p-4 space-y-3">
            <div>
              <Label className="text-xs">Projeto</Label>
              <Select
                value={form.project_id}
                onValueChange={(v) => setForm((f) => ({ ...f, project_id: v }))}
              >
                <SelectTrigger className="h-9 text-sm mt-1">
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground">
                      Nenhum projeto atribuído a você
                    </div>
                  ) : (
                    projects.map((p) => (
                      <SelectItem key={p.project_id} value={p.project_id}>
                        {p.customer_name}
                        {p.address ? ` — ${p.address}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Data</Label>
                <Input
                  type="date"
                  value={form.work_date}
                  onChange={(e) => setForm((f) => ({ ...f, work_date: e.target.value }))}
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Dias trabalhados</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={form.days_worked}
                  onChange={(e) => setForm((f) => ({ ...f, days_worked: e.target.value }))}
                  className="h-9 text-sm mt-1"
                  placeholder="Ex: 1 ou 0.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Notas (opcional)</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Ex: sanding day 2, finalizei base coat"
                className="text-sm mt-1 min-h-[60px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submit.isPending}
                className="flex-1"
              >
                {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History list */}
      <div className="space-y-2">
        <h2 className="text-xs uppercase font-semibold text-muted-foreground tracking-wide">
          Histórico
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Nenhum lançamento ainda. Toque em <strong>Novo</strong> para começar.
            </CardContent>
          </Card>
        ) : (
          entries.map((e) => {
            const StatusIcon =
              e.status === "approved" ? CheckCircle2 : e.status === "rejected" ? XCircle : Clock;
            const statusColor =
              e.status === "approved"
                ? "text-[hsl(var(--state-success))]"
                : e.status === "rejected"
                ? "text-destructive"
                : "text-[hsl(var(--state-risk))]";
            return (
              <Card key={e.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", statusColor)} />
                        <span className="text-sm font-medium text-foreground truncate">
                          {e.projects?.customer_name || "Projeto"}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span>{format(parseISO(e.work_date), "MMM d, yyyy")}</span>
                        <span className="tabular-nums">{Number(e.days_worked).toFixed(1)}d</span>
                        <span className="tabular-nums">
                          ${(Number(e.daily_rate) * Number(e.days_worked)).toFixed(0)}
                        </span>
                      </div>
                      {e.notes && (
                        <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2">
                          {e.notes}
                        </p>
                      )}
                      {e.status === "rejected" && e.rejection_reason && (
                        <p className="text-[11px] text-destructive mt-1">
                          Motivo: {e.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn("text-[9px] capitalize", statusColor)}
                      >
                        {e.status}
                      </Badge>
                      {e.status === "pending" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => del.mutate(e.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
        {rejected.length === 0 && approved.length === 0 && pending.length === 0 ? null : null}
      </div>
    </div>
  );
}
