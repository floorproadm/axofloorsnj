import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Square, Clock, Check, Pencil, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Props = {
  appointmentId: string;
  startedAt: string | null;
  finishedAt: string | null;
  actualMinutes: number | null;
  estimatedHours: number;
};

function fmtDuration(mins: number | null) {
  if (mins == null) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}min`;
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ExecutionPanel({ appointmentId, startedAt, finishedAt, actualMinutes, estimatedHours }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [startInput, setStartInput] = useState(toLocalInput(startedAt));
  const [endInput, setEndInput] = useState(toLocalInput(finishedAt));

  const mut = useMutation({
    mutationFn: async (patch: { started_at?: string | null; finished_at?: string | null; status?: string }) => {
      const { error } = await supabase.from("appointments").update(patch as any).eq("id", appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Execução atualizada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const estMin = Math.round(estimatedHours * 60);
  const overrun = actualMinutes != null && actualMinutes > estMin;
  const running = !!startedAt && !finishedAt;
  const done = !!startedAt && !!finishedAt;

  const saveManual = () => {
    const patch: any = {
      started_at: startInput ? new Date(startInput).toISOString() : null,
      finished_at: endInput ? new Date(endInput).toISOString() : null,
    };
    mut.mutate(patch, { onSuccess: () => { setEditing(false); qc.invalidateQueries({ queryKey: ["appointments"] }); } });
  };

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Execução</span>
        {done && (
          <button
            onClick={() => { setStartInput(toLocalInput(startedAt)); setEndInput(toLocalInput(finishedAt)); setEditing(e => !e); }}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            {editing ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
            {editing ? "Cancelar" : "Ajustar"}
          </button>
        )}
      </div>

      {!editing && (
        <>
          {!startedAt && (
            <Button
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              onClick={() => mut.mutate({ started_at: new Date().toISOString(), status: "in_progress" })}
              disabled={mut.isPending}
            >
              <Play className="w-4 h-4" /> Iniciar agora
            </Button>
          )}

          {running && (
            <>
              <div className="text-xs text-muted-foreground">
                Iniciado em <span className="text-foreground font-medium">{format(parseISO(startedAt!), "dd/MM HH:mm")}</span>
              </div>
              <Button
                size="sm"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2"
                onClick={() => mut.mutate({ finished_at: new Date().toISOString(), status: "completed" })}
                disabled={mut.isPending}
              >
                <Square className="w-4 h-4" /> Finalizar agora
              </Button>
            </>
          )}

          {done && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Início</p>
                  <p className="font-medium text-foreground">{format(parseISO(startedAt!), "dd/MM HH:mm")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fim</p>
                  <p className="font-medium text-foreground">{format(parseISO(finishedAt!), "dd/MM HH:mm")}</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md bg-background border border-border/60 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Duração real</span>
                </div>
                <span className={cn("text-sm font-semibold tabular-nums", overrun ? "text-red-600" : "text-emerald-600")}>
                  {fmtDuration(actualMinutes)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                <span>Estimado: <span className="text-foreground tabular-nums">{estimatedHours}h ({estMin}min)</span></span>
                <span className={cn("font-medium", overrun ? "text-red-600" : "text-emerald-600")}>
                  {overrun ? "+" : ""}{actualMinutes! - estMin} min
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {editing && (
        <div className="space-y-2">
          <div>
            <Label className="text-[11px]">Início</Label>
            <Input type="datetime-local" value={startInput} onChange={e => setStartInput(e.target.value)} className="h-9 text-xs" />
          </div>
          <div>
            <Label className="text-[11px]">Fim</Label>
            <Input type="datetime-local" value={endInput} onChange={e => setEndInput(e.target.value)} className="h-9 text-xs" />
          </div>
          <Button size="sm" className="w-full gap-2" onClick={saveManual} disabled={mut.isPending}>
            <Check className="w-4 h-4" /> Salvar ajustes
          </Button>
        </div>
      )}
    </div>
  );
}

export function ExecutionBadge({ startedAt, finishedAt }: { startedAt: string | null; finishedAt: string | null }) {
  if (finishedAt) {
    return (
      <span title="Finalizado" className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600">
        <Check className="w-3 h-3" strokeWidth={3} />
      </span>
    );
  }
  if (startedAt) {
    return (
      <span title="Em andamento" className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500/15 text-blue-600">
        <Play className="w-2.5 h-2.5 fill-current" />
      </span>
    );
  }
  return null;
}
