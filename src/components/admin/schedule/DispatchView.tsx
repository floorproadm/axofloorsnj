import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay,
} from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft, ChevronRight, MapPin, Briefcase, Radio, Users,
  CheckCircle2, ChevronDown, ChevronUp, Calendar as CalendarIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { JobDetailDrawer } from "./MapView";

const START_HOUR = 6;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
const LEFT_COL = 200;
const HOUR_WIDTH = 70;
const TIMELINE_WIDTH = (END_HOUR - START_HOUR) * HOUR_WIDTH;
const SHIFT_HOURS = 9;

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Owner",
  tecnico: "Técnico",
  technician: "Técnico",
  instalador: "Instalador",
  installer: "Instalador",
  collaborator: "Técnico",
};

type Tech = {
  id: string;
  full_name: string | null;
  email?: string | null;
  role: string | null;
  color: string | null;
  is_active_crew: boolean | null;
};

type Appt = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  duration_hours: number | null;
  customer_name: string;
  location: string | null;
  notes: string | null;
  project_id: string | null;
  assigned_to: string[] | null;
  appointment_type: string;
  project_status?: string;
  project_type?: string | null;
  estimated_revenue?: number | null;
};

function statusColor(s?: string, type?: string) {
  const x = s || type || "";
  if (x.includes("planning") || x.includes("pending") || x === "measurement") return { bar: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200", icon: "🟠" };
  if (x.includes("in_progress") || x === "production") return { bar: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", icon: "🔵" };
  if (x.includes("completed")) return { bar: "bg-green-500", bg: "bg-green-50", text: "text-green-800", border: "border-green-200", icon: "✅" };
  return { bar: "bg-slate-500", bg: "bg-slate-50", text: "text-slate-800", border: "border-slate-200", icon: "⚪" };
}

function parseHourFloat(time: string): number {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

function shortAddr(loc: string | null) { return loc ? loc.split(",")[0].trim() : "Sem endereço"; }

interface Props { date: Date; onChangeDate?: (d: Date) => void }
type QueueFilter = "today" | "week" | "month" | "all";

export function DispatchView({ date, onChangeDate }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [queueOpen, setQueueOpen] = useState(true);
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("today");
  const [draggedApptId, setDraggedApptId] = useState<string | null>(null);
  const [dragOverTechId, setDragOverTechId] = useState<string | null>(null);
  const [internalDate, setInternalDate] = useState(date);
  const activeDate = onChangeDate ? date : internalDate;
  const setDate = (d: Date) => { if (onChangeDate) onChangeDate(d); else setInternalDate(d); };
  const dateStr = format(activeDate, "yyyy-MM-dd");

  // Technicians (profiles)
  const { data: techs = [] } = useQuery({
    queryKey: ["dispatch-techs"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("profiles")
        .select("id, full_name, email, role, color, is_active_crew")
        .eq("is_active_crew", true)
        .order("full_name", { ascending: true });
      return (data || []) as Tech[];
    },
  });

  // Day appointments (Gantt)
  const { data: dayAppts = [] } = useQuery({
    queryKey: ["dispatch-day", dateStr],
    queryFn: async () => {
      const [apptRes, projRes] = await Promise.all([
        supabase.from("appointments").select("*")
          .eq("organization_id", AXO_ORG_ID)
          .eq("appointment_date", dateStr),
        supabase.from("projects")
          .select("id, customer_name, address, project_type, project_status, start_date, team_lead, team_members")
          .eq("organization_id", AXO_ORG_ID).eq("start_date", dateStr),
      ]);
      const real: Appt[] = ((apptRes.data || []) as any[]).map((a) => ({
        id: a.id, appointment_date: a.appointment_date, appointment_time: a.appointment_time || "08:00:00",
        duration_hours: a.duration_hours, customer_name: a.customer_name, location: a.location,
        notes: a.notes, project_id: a.project_id, assigned_to: a.assigned_to || [],
        appointment_type: a.appointment_type,
      }));
      const fromProj: Appt[] = ((projRes.data || []) as any[]).map((p) => ({
        id: `proj-${p.id}`, appointment_date: p.start_date, appointment_time: "08:00:00",
        duration_hours: SHIFT_HOURS, customer_name: p.customer_name || "Projeto",
        location: p.address, notes: p.project_type, project_id: p.id,
        assigned_to: [p.team_lead, ...(p.team_members || [])].filter(Boolean),
        appointment_type: "production", project_status: p.project_status, project_type: p.project_type,
      }));
      return [...real, ...fromProj];
    },
  });

  // Queue range
  const queueRange = useMemo(() => {
    if (queueFilter === "today") return { start: dateStr, end: dateStr };
    if (queueFilter === "week") {
      return { start: format(startOfWeek(activeDate), "yyyy-MM-dd"), end: format(endOfWeek(activeDate), "yyyy-MM-dd") };
    }
    if (queueFilter === "month") {
      return { start: format(startOfMonth(activeDate), "yyyy-MM-dd"), end: format(endOfMonth(activeDate), "yyyy-MM-dd") };
    }
    return { start: "1970-01-01", end: "2999-12-31" };
  }, [queueFilter, dateStr, activeDate]);

  const { data: queueData = [] } = useQuery({
    queryKey: ["dispatch-queue", queueRange.start, queueRange.end],
    queryFn: async () => {
      const { data } = await supabase.from("appointments")
        .select("id, appointment_date, appointment_time, duration_hours, customer_name, location, notes, project_id, assigned_to, appointment_type")
        .eq("organization_id", AXO_ORG_ID)
        .gte("appointment_date", queueRange.start)
        .lte("appointment_date", queueRange.end);
      return ((data || []) as any[]) as Appt[];
    },
  });

  const queue = useMemo(
    () => queueData.filter((a) => !a.assigned_to || a.assigned_to.length === 0),
    [queueData],
  );

  const byTech = useMemo(() => {
    const map = new Map<string, Appt[]>();
    techs.forEach((t) => map.set(t.id, []));
    dayAppts.forEach((a) => (a.assigned_to || []).forEach((id) => {
      if (map.has(id)) map.get(id)!.push(a);
    }));
    return map;
  }, [techs, dayAppts]);

  const assignMutation = useMutation({
    mutationFn: async ({ appointmentId, techId }: { appointmentId: string; techId: string }) => {
      if (appointmentId.startsWith("proj-")) {
        throw new Error("Job vem do projeto. Crie um agendamento real para atribuir.");
      }
      const { data: existing } = await supabase.from("appointments")
        .select("assigned_to").eq("id", appointmentId).maybeSingle();
      const current: string[] = (existing as any)?.assigned_to || [];
      if (current.includes(techId)) return;
      const { error } = await (supabase as any).from("appointments")
        .update({ assigned_to: [...current, techId] }).eq("id", appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dispatch-day"] });
      qc.invalidateQueries({ queryKey: ["dispatch-queue"] });
      toast({ title: "Técnico atribuído" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="px-4 py-3 space-y-4">
      {/* === HEADER === */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 dark:text-green-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Operações ao Vivo
          </span>
          <div className="flex items-center gap-1 border rounded-md">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDate(subDays(activeDate, 1))}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <div className="text-xs font-medium px-2 min-w-[110px] text-center tabular-nums">
              {format(activeDate, "EEE, MMM dd")}
            </div>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDate(addDays(activeDate, 1))}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          {!isSameDay(activeDate, new Date()) && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDate(new Date())}>Hoje</Button>
          )}
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {dayAppts.length} jobs · {techs.length} técnicos
        </div>
      </div>

      {/* === GANTT === */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: LEFT_COL + TIMELINE_WIDTH }}>
            {/* Hour ruler */}
            <div className="flex sticky top-0 z-10 bg-muted/50 border-b border-border">
              <div style={{ width: LEFT_COL }} className="shrink-0 px-3 py-2 border-r border-border flex items-center gap-1.5 text-[10px] uppercase font-semibold text-muted-foreground">
                <Users className="w-3 h-3" />
                {techs.length} técnicos
              </div>
              <div className="relative" style={{ width: TIMELINE_WIDTH }}>
                {HOURS.slice(0, -1).map((h, i) => (
                  <div key={h} className="absolute top-0 bottom-0 border-l border-border text-[10px] text-muted-foreground px-1 py-1.5"
                    style={{ left: i * HOUR_WIDTH, width: HOUR_WIDTH }}>
                    {h % 12 === 0 ? 12 : h % 12}{h < 12 ? "a" : "p"}
                  </div>
                ))}
                <div className="h-7" />
              </div>
            </div>

            {techs.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Nenhum técnico ativo. Ative técnicos em /admin/team.
              </div>
            ) : techs.map((t) => {
              const jobs = byTech.get(t.id) || [];
              const scheduled = jobs.reduce((s, j) => s + (j.duration_hours || 2), 0);
              const capacity = Math.min(100, (scheduled / SHIFT_HOURS) * 100);
              const capColor = capacity >= 95 ? "bg-red-500" : capacity >= 70 ? "bg-amber-500" : "bg-green-500";
              const online = jobs.length > 0; // proxy for online
              const initials = (t.full_name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
              const isDragOver = dragOverTechId === t.id;
              return (
                <div key={t.id}
                  className={`flex border-b border-border last:border-0 min-h-[80px] ${isDragOver ? "bg-primary/5" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverTechId(t.id); }}
                  onDragLeave={() => setDragOverTechId(null)}
                  onDrop={(e) => {
                    e.preventDefault(); setDragOverTechId(null);
                    if (draggedApptId) assignMutation.mutate({ appointmentId: draggedApptId, techId: t.id });
                    setDraggedApptId(null);
                  }}
                >
                  {/* Left tech card */}
                  <div style={{ width: LEFT_COL }} className="shrink-0 border-r border-border px-3 py-2 flex flex-col gap-1.5 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8" style={{ backgroundColor: t.color || undefined }}>
                        <AvatarImage src={undefined} />
                        <AvatarFallback className="text-[10px] text-white" style={{ backgroundColor: t.color || "hsl(var(--primary))" }}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{t.full_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{ROLE_LABEL[t.role || ""] || t.role || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge variant="outline" className={`text-[9px] h-4 px-1 gap-0.5 ${online ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-green-500" : "bg-slate-400"}`} />
                        {online ? "Online" : "Offline"}
                      </Badge>
                      <Badge variant="outline" className={`text-[9px] h-4 px-1 gap-0.5 ${online ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                        <Radio className="w-2 h-2" />GPS {online ? "Ativo" : "Off"}
                      </Badge>
                    </div>
                    <div className="space-y-0.5">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${capColor} transition-all`} style={{ width: `${capacity}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {scheduled.toFixed(1)}h agendado · {SHIFT_HOURS}h de turno
                      </p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="relative" style={{ width: TIMELINE_WIDTH }}>
                    {HOURS.slice(0, -1).map((_, i) => (
                      <div key={i} className="absolute top-0 bottom-0 border-l border-border/40"
                        style={{ left: i * HOUR_WIDTH }} />
                    ))}
                    {jobs.map((j) => {
                      const startH = parseHourFloat(j.appointment_time);
                      const dur = j.duration_hours || 2;
                      const offset = Math.max(0, startH - START_HOUR);
                      const left = offset * HOUR_WIDTH;
                      const width = Math.max(60, dur * HOUR_WIDTH);
                      const c = statusColor(j.project_status, j.appointment_type);
                      return (
                        <button key={j.id}
                          onClick={() => j.project_id && setSelectedProjectId(j.project_id)}
                          className={`absolute top-2 bottom-2 rounded-md border ${c.border} ${c.bg} px-2 py-1 text-left overflow-hidden hover:shadow-md transition-shadow`}
                          style={{ left, width }}
                          title={`${j.customer_name} · ${j.location || ""}`}>
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />
                          <div className="pl-1.5 text-[11px] leading-tight">
                            <p className={`font-semibold truncate flex items-center gap-1 ${c.text}`}>
                              <span className="text-[10px]">{c.icon}</span>
                              {j.customer_name}
                            </p>
                            <p className="text-muted-foreground truncate">
                              {j.appointment_time.slice(0, 5)} · {dur}h
                            </p>
                          </div>
                        </button>
                      );
                    })}
                    {jobs.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground/50 pointer-events-none">
                        {isDragOver ? "Solte aqui para atribuir" : "Sem jobs"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* === JOB QUEUE === */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
          <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wide">Job Queue</h3>
          <Badge variant="secondary" className="text-[10px] h-4">{queue.length}</Badge>
          <div className="flex items-center gap-0.5 ml-2 rounded-md bg-muted p-0.5">
            {([
              ["today", "Hoje"], ["week", "Semana"], ["month", "Mês"], ["all", "Todos"],
            ] as [QueueFilter, string][]).map(([k, label]) => (
              <button key={k} onClick={() => setQueueFilter(k)}
                className={`text-[10px] px-2 py-0.5 rounded-sm transition ${
                  queueFilter === k ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
                }`}>{label}</button>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="ml-auto h-7 gap-1 text-xs" onClick={() => setQueueOpen((v) => !v)}>
            {queueOpen ? <><ChevronDown className="w-3 h-3" />Ocultar Queue</> : <><ChevronUp className="w-3 h-3" />Mostrar Queue</>}
          </Button>
        </div>
        {queueOpen && (
          <div className="p-3">
            {queue.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Tudo atribuído. Operação no controle.
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {queue.map((j) => {
                  const c = statusColor(undefined, j.appointment_type);
                  return (
                    <Card key={j.id}
                      draggable
                      onDragStart={(e) => { setDraggedApptId(j.id); e.dataTransfer.effectAllowed = "move"; }}
                      onDragEnd={() => { setDraggedApptId(null); setDragOverTechId(null); }}
                      className={`shrink-0 w-64 p-2.5 border-l-4 ${c.border} cursor-grab active:cursor-grabbing hover:shadow-md transition-all`}>
                      <p className="text-xs font-semibold truncate">{j.customer_name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />{shortAddr(j.location)}
                      </p>
                      <div className="flex items-center justify-between mt-1.5 text-[10px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="w-2.5 h-2.5" />
                          {format(new Date(j.appointment_date), "MMM d")} · {j.appointment_time.slice(0, 5)}
                        </span>
                        {j.appointment_type && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1">{j.appointment_type}</Badge>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      <JobDetailDrawer
        projectId={selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
        techs={techs as any}
      />
    </div>
  );
}
