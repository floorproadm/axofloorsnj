import { useState, useMemo } from "react";
import { useCollaboratorProjects } from "@/hooks/useCollaboratorProjects";
import {
  useMyTimesheet,
  useSubmitTimesheet,
  useDeleteMyTimesheet,
  type PayMode,
} from "@/hooks/useTimesheet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Loader2, Plus, CheckCircle2, Clock, XCircle, Trash2, Calendar, AlertTriangle, CalendarIcon,
} from "lucide-react";
import { format, parseISO, startOfMonth } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CollaboratorTimesheet() {
  const { user } = useAuth();
  const { data: projects = [] } = useCollaboratorProjects();
  const { data: entries = [], isLoading } = useMyTimesheet();
  const submit = useSubmitTimesheet();
  const del = useDeleteMyTimesheet();

  // Profile daily_rate for preview
  const { data: profile } = useQuery({
    queryKey: ["my-profile-rate", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("daily_rate")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const [showForm, setShowForm] = useState(false);
  const [payMode, setPayMode] = useState<PayMode>("daily");
  const [workDates, setWorkDates] = useState<Date[]>([new Date()]);
  const [form, setForm] = useState({
    project_id: "",
    days_worked: "1",
    sqft_worked: "",
    notes: "",
  });

  // Fetch labor_sqft_rate of the selected project (for sqft preview/validation)
  const { data: selectedProject } = useQuery({
    queryKey: ["project-sqft-rate", form.project_id],
    queryFn: async () => {
      if (!form.project_id) return null;
      const { data } = await supabase
        .from("projects")
        .select("labor_sqft_rate")
        .eq("id", form.project_id)
        .maybeSingle();
      return data as { labor_sqft_rate: number | null } | null;
    },
    enabled: !!form.project_id,
  });

  const sqftRate = Number(selectedProject?.labor_sqft_rate ?? 0);
  const dailyRate = Number(profile?.daily_rate ?? 0);

  const dayCount = Math.max(1, workDates.length);
  const previewTotal = useMemo(() => {
    if (payMode === "daily") return dailyRate * (Number(form.days_worked) || 0) * dayCount;
    return sqftRate * (Number(form.sqft_worked) || 0) * dayCount;
  }, [payMode, dailyRate, sqftRate, form.days_worked, form.sqft_worked, dayCount]);

  const resetForm = () => {
    setPayMode("daily");
    setWorkDates([new Date()]);
    setForm({
      project_id: "",
      days_worked: "1",
      sqft_worked: "",
      notes: "",
    });
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.project_id) return toast.error("Selecione um projeto");
    if (workDates.length === 0) return toast.error("Selecione pelo menos uma data");

    if (payMode === "daily") {
      const days = Number(form.days_worked);
      if (!days || days <= 0) return toast.error("Quantidade de dias inválida");
    } else {
      const sqft = Number(form.sqft_worked);
      if (!sqft || sqft <= 0) return toast.error("Quantidade de sqft inválida");
      if (!sqftRate || sqftRate <= 0) {
        return toast.error("Projeto sem rate por sqft definida pelo admin");
      }
    }

    try {
      const sorted = [...workDates].sort((a, b) => a.getTime() - b.getTime());
      for (const d of sorted) {
        const work_date = format(d, "yyyy-MM-dd");
        if (payMode === "daily") {
          await submit.mutateAsync({
            pay_mode: "daily",
            project_id: form.project_id,
            work_date,
            days_worked: Number(form.days_worked),
            notes: form.notes,
          });
        } else {
          await submit.mutateAsync({
            pay_mode: "sqft",
            project_id: form.project_id,
            work_date,
            sqft_worked: Number(form.sqft_worked),
            notes: form.notes,
          });
        }
      }
      toast.success(
        sorted.length > 1
          ? `${sorted.length} lançamentos enviados para aprovação`
          : "Lançamento enviado para aprovação"
      );
      resetForm();
    } catch (e: any) {
      toast.error(e?.message || "Falha ao enviar");
    }
  };

  const pending = entries.filter((e) => e.status === "pending");
  const approved = entries.filter((e) => e.status === "approved");

  const totalApprovedPay = approved.reduce((s, e) => s + Number(e.total_cost || 0), 0);
  const monthStart = startOfMonth(new Date());
  const monthApprovedPay = approved
    .filter((e) => parseISO(e.work_date) >= monthStart)
    .reduce((s, e) => s + Number(e.total_cost || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground">Minhas Diárias</h1>
          <p className="text-sm text-muted-foreground">Registre diárias ou sqft trabalhado</p>
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
            <p className="text-[10px] uppercase text-muted-foreground">Aprovado</p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              ${totalApprovedPay.toFixed(0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] uppercase text-muted-foreground">Este mês</p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              ${monthApprovedPay.toFixed(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* New entry modal */}
      <Dialog open={showForm} onOpenChange={(o) => (o ? setShowForm(true) : resetForm())}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Pay mode toggle */}
            <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
              {(["daily", "sqft"] as PayMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPayMode(mode)}
                  className={cn(
                    "text-xs font-medium py-1.5 rounded transition-colors",
                    payMode === mode
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode === "daily" ? "Diária" : "Por SqFt"}
                </button>
              ))}
            </div>

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

            <div>
              <Label className="text-xs">Datas trabalhadas</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-full justify-start text-left font-normal text-sm mt-1",
                      workDates.length === 0 && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {workDates.length === 0
                      ? "Selecione uma ou mais datas"
                      : workDates.length === 1
                      ? format(workDates[0], "PPP")
                      : `${workDates.length} dias selecionados`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComp
                    mode="multiple"
                    selected={workDates}
                    onSelect={(dates) => setWorkDates(dates ?? [])}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {workDates.length > 1 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Será criado 1 lançamento por dia.
                </p>
              )}
            </div>

            <div>
              {payMode === "daily" ? (
                <>
                  <Label className="text-xs">Dias trabalhados (por data)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={form.days_worked}
                    onChange={(e) => setForm((f) => ({ ...f, days_worked: e.target.value }))}
                    className="h-9 text-sm mt-1"
                    placeholder="Ex: 1 ou 0.5"
                  />
                </>
              ) : (
                <>
                  <Label className="text-xs">SqFt trabalhado (por data)</Label>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    value={form.sqft_worked}
                    onChange={(e) => setForm((f) => ({ ...f, sqft_worked: e.target.value }))}
                    className="h-9 text-sm mt-1"
                    placeholder="Ex: 250"
                  />
                </>
              )}
            </div>

            {/* Preview / sqft validation */}
            {payMode === "daily" ? (
              <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-xs">
                <span className="text-muted-foreground tabular-nums">
                  ${dailyRate.toFixed(0)}/dia × {Number(form.days_worked) || 0}d × {dayCount}{" "}
                  {dayCount > 1 ? "datas" : "data"}
                </span>
                <span className="font-bold tabular-nums text-foreground">
                  ${previewTotal.toFixed(2)}
                </span>
              </div>
            ) : form.project_id && !sqftRate ? (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Projeto sem rate por sqft. Peça ao admin para definir, ou troque para Diária.
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-xs">
                <span className="text-muted-foreground tabular-nums">
                  ${sqftRate.toFixed(2)}/sqft × {Number(form.sqft_worked) || 0} × {dayCount}{" "}
                  {dayCount > 1 ? "datas" : "data"}
                </span>
                <span className="font-bold tabular-nums text-foreground">
                  ${previewTotal.toFixed(2)}
                </span>
              </div>
            )}

            <div>
              <Label className="text-xs">Notas (opcional)</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Ex: sanding day 2, finalizei base coat"
                className="text-sm mt-1 min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={resetForm} className="flex-1">
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
          </DialogFooter>
        </DialogContent>
      </Dialog>


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
            const isSqft = e.pay_mode === "sqft";
            const qty = isSqft ? Number(e.sqft_worked || 0) : Number(e.days_worked || 0);
            const rate = isSqft ? Number(e.sqft_rate || 0) : Number(e.daily_rate || 0);
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
                        <Badge variant="outline" className="text-[9px]">
                          {isSqft ? "SqFt" : "Diária"}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span>{format(parseISO(e.work_date), "MMM d, yyyy")}</span>
                        <span className="tabular-nums">
                          {isSqft ? `${qty} sqft` : `${qty.toFixed(1)}d`} × ${rate.toFixed(2)}
                        </span>
                        <span className="tabular-nums font-semibold text-foreground">
                          ${Number(e.total_cost || 0).toFixed(2)}
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
      </div>
    </div>
  );
}
