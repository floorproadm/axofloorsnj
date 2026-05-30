import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import { toast } from "sonner";
import {
  format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks,
  isWithinInterval, parseISO, isSameDay,
} from "date-fns";
import {
  DndContext, DragOverlay, useDraggable, useDroppable,
  PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, CalendarX, X, MapPin, Clock,
  ExternalLink, Loader2, Briefcase, User as UserIcon,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type Crew = {
  id: string; full_name: string; avatar_url: string | null; role: string | null;
};
type Appointment = {
  id: string; appointment_date: string; appointment_time: string;
  appointment_type: string; status: string; location: string | null;
  notes: string | null; project_id: string | null; customer_name: string;
  customer_phone: string | null; assigned_to: string[] | null;
};
type Unavailability = {
  id: string; crew_member_id: string; start_date: string; end_date: string; reason: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-amber-500/15 border-amber-500/40 text-amber-200",
  pending: "bg-amber-500/15 border-amber-500/40 text-amber-200",
  confirmed: "bg-emerald-500/15 border-emerald-500/40 text-emerald-200",
  in_progress: "bg-emerald-500/15 border-emerald-500/40 text-emerald-200",
  completed: "bg-muted border-border text-muted-foreground",
  cancelled: "bg-destructive/15 border-destructive/40 text-destructive-foreground",
};

function statusClass(s: string) {
  return STATUS_STYLES[s] ?? STATUS_STYLES.scheduled;
}

function initials(name: string) {
  return name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

// ───────────────────── Hooks ─────────────────────
function useScheduleData(weekStart: Date) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const startStr = format(weekStart, "yyyy-MM-dd");
  const endStr = format(weekEnd, "yyyy-MM-dd");

  const crewQ = useQuery({
    queryKey: ["sched-crew"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .or("is_active_crew.is.null,is_active_crew.eq.true")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Crew[];
    },
  });

  const apptQ = useQuery({
    queryKey: ["sched-appts", startStr, endStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, appointment_date, appointment_time, appointment_type, status, location, notes, project_id, customer_name, customer_phone, assigned_to")
        .gte("appointment_date", startStr)
        .lte("appointment_date", endStr)
        .order("appointment_date");
      if (error) throw error;
      return (data ?? []) as Appointment[];
    },
  });

  const unavQ = useQuery({
    queryKey: ["sched-unav", startStr, endStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crew_unavailability" as any)
        .select("*")
        .lte("start_date", endStr)
        .gte("end_date", startStr);
      if (error) throw error;
      return (data ?? []) as unknown as Unavailability[];
    },
  });

  return { crewQ, apptQ, unavQ };
}

// ───────────────────── Assign mutation ─────────────────────
function useAssignCrew() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      appointment: Appointment;
      newCrewId: string;
      removeCrewId?: string; // when moving between cells
    }) => {
      const { appointment, newCrewId, removeCrewId } = params;
      const current = appointment.assigned_to ?? [];
      let next = current.filter((id) => id !== removeCrewId);
      if (!next.includes(newCrewId)) next.push(newCrewId);

      const { error: e1 } = await supabase
        .from("appointments")
        .update({ assigned_to: next })
        .eq("id", appointment.id);
      if (e1) throw e1;

      // sync appointment_assignees
      if (removeCrewId) {
        await supabase
          .from("appointment_assignees")
          .delete()
          .eq("appointment_id", appointment.id)
          .eq("profile_id", removeCrewId);
      }
      const { error: e3 } = await supabase
        .from("appointment_assignees")
        .upsert(
          { appointment_id: appointment.id, profile_id: newCrewId },
          { onConflict: "appointment_id,profile_id", ignoreDuplicates: true } as any,
        );
      if (e3 && !String(e3.message).toLowerCase().includes("duplicate")) throw e3;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sched-appts"] });
      toast.success("Crew alocado");
    },
    onError: (err: any) => toast.error(err.message ?? "Erro ao alocar"),
  });
}

function useRemoveCrew() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { appointmentId: string; crewId: string; current: string[] }) => {
      const next = (p.current ?? []).filter((id) => id !== p.crewId);
      const { error } = await supabase
        .from("appointments")
        .update({ assigned_to: next })
        .eq("id", p.appointmentId);
      if (error) throw error;
      await supabase
        .from("appointment_assignees")
        .delete()
        .eq("appointment_id", p.appointmentId)
        .eq("profile_id", p.crewId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sched-appts"] });
      toast.success("Removido");
    },
  });
}

// ───────────────────── Sub-components ─────────────────────
function AppointmentCard({
  appt, draggableId, onClick, onRemove, compact = false,
}: {
  appt: Appointment;
  draggableId: string;
  onClick?: () => void;
  onRemove?: () => void;
  compact?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: draggableId,
    data: { appointment: appt, sourceCrewId: draggableId.split("::")[1] },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "group relative rounded-md border px-2 py-1.5 text-[11px] cursor-grab active:cursor-grabbing transition",
        statusClass(appt.status),
        isDragging && "opacity-30",
        compact ? "" : "hover:brightness-110",
      )}
      style={{ touchAction: "none" }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 font-medium truncate">
            <Clock className="w-2.5 h-2.5 shrink-0" />
            {appt.appointment_time?.slice(0, 5)}
          </div>
          <div className="truncate text-[10px] opacity-80 mt-0.5">
            {appt.location || appt.customer_name}
          </div>
        </div>
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="opacity-0 group-hover:opacity-100 hover:bg-background/40 rounded p-0.5"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function DayCell({
  crewId, date, appts, isUnavailable, unavReason, onApptClick, onRemoveAssignment,
}: {
  crewId: string;
  date: Date;
  appts: Appointment[];
  isUnavailable: boolean;
  unavReason?: string;
  onApptClick: (a: Appointment) => void;
  onRemoveAssignment: (a: Appointment) => void;
}) {
  const dateStr = format(date, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({
    id: `cell::${crewId}::${dateStr}`,
    data: { crewId, date: dateStr },
  });

  const cell = (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[72px] border-r border-b border-border p-1 space-y-1 transition",
        isUnavailable && "bg-destructive/10",
        isOver && "bg-primary/15 ring-1 ring-primary/40",
      )}
    >
      {appts.map((a) => (
        <AppointmentCard
          key={a.id}
          appt={a}
          draggableId={`appt::${crewId}::${a.id}`}
          onClick={() => onApptClick(a)}
          onRemove={() => onRemoveAssignment(a)}
        />
      ))}
    </div>
  );

  if (isUnavailable && unavReason) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{cell}</TooltipTrigger>
          <TooltipContent side="top">Indisponível: {unavReason}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return cell;
}

// ───────────────────── Unavailability Dialog ─────────────────────
function UnavailabilityDialog({
  open, onOpenChange, crew,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  crew: Crew[];
}) {
  const qc = useQueryClient();
  const [crewId, setCrewId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!crewId || !start || !end) throw new Error("Preencha todos os campos");
      const { error } = await supabase.from("crew_unavailability" as any).insert({
        crew_member_id: crewId, start_date: start, end_date: end,
        reason: reason || null, organization_id: AXO_ORG_ID,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sched-unav"] });
      toast.success("Indisponibilidade registrada");
      onOpenChange(false);
      setCrewId(""); setStart(""); setEnd(""); setReason("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Marcar indisponibilidade</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Crew Member</Label>
            <Select value={crewId} onValueChange={setCrewId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {crew.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Início</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div><Label>Fim</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>
          <div>
            <Label>Motivo</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Férias, doença, etc." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ───────────────────── Detail Sheet ─────────────────────
function ApptDetailSheet({ appt, onOpenChange }: { appt: Appointment | null; onOpenChange: (b: boolean) => void }) {
  return (
    <Sheet open={!!appt} onOpenChange={onOpenChange}>
      <SheetContent>
        {appt && (
          <>
            <SheetHeader>
              <SheetTitle>{appt.appointment_type}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" />
                {format(parseISO(appt.appointment_date), "EEE, MMM d")} · {appt.appointment_time?.slice(0, 5)}
              </div>
              <div className="flex items-center gap-2"><UserIcon className="w-4 h-4 text-muted-foreground" />
                {appt.customer_name}
              </div>
              {appt.location && (
                <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span>{appt.location}</span>
                </div>
              )}
              <Badge variant="outline">{appt.status}</Badge>
              {appt.notes && (
                <div className="bg-muted/50 rounded p-2 text-xs whitespace-pre-wrap">{appt.notes}</div>
              )}
              {appt.project_id && (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={`/admin/projects/${appt.project_id}`}>
                    <ExternalLink className="w-3 h-3" /> Abrir projeto
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ───────────────────── Main ─────────────────────
export default function CrewScheduleTab() {
  const isMobile = useIsMobile();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showUnavDialog, setShowUnavDialog] = useState(false);
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);
  const [activeDrag, setActiveDrag] = useState<Appointment | null>(null);

  const { crewQ, apptQ, unavQ } = useScheduleData(weekStart);
  const assign = useAssignCrew();
  const remove = useRemoveCrew();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const crew = crewQ.data ?? [];
  const appts = apptQ.data ?? [];
  const unav = unavQ.data ?? [];

  // appointments grouped by crew/date
  const apptsByCrewDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appts) {
      for (const cid of a.assigned_to ?? []) {
        const key = `${cid}::${a.appointment_date}`;
        const arr = map.get(key) ?? [];
        arr.push(a);
        map.set(key, arr);
      }
    }
    return map;
  }, [appts]);

  const unassigned = useMemo(
    () => appts.filter((a) => !a.assigned_to || a.assigned_to.length === 0),
    [appts],
  );

  const isUnavailable = (crewId: string, date: Date) => {
    return unav.find(
      (u) =>
        u.crew_member_id === crewId &&
        isWithinInterval(date, { start: parseISO(u.start_date), end: parseISO(u.end_date) }),
    );
  };

  const handleDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current as any;
    setActiveDrag(data?.appointment ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDrag(null);
    if (!e.over) return;
    const overData = e.over.data.current as any;
    const activeData = e.active.data.current as any;
    if (!overData?.crewId || !activeData?.appointment) return;

    const appt: Appointment = activeData.appointment;
    const newCrewId: string = overData.crewId;
    const targetDate: string = overData.date;
    const sourceCrewId: string | undefined = activeData.sourceCrewId !== "unassigned" ? activeData.sourceCrewId : undefined;

    // Same date check (drop on same crew/date = no-op)
    if (sourceCrewId === newCrewId && appt.appointment_date === targetDate) return;

    // Conflict: crew already has an appointment on this date (different appointment)
    const existing = apptsByCrewDate.get(`${newCrewId}::${targetDate}`) ?? [];
    if (existing.some((a) => a.id !== appt.id)) {
      const crewName = crew.find((c) => c.id === newCrewId)?.full_name ?? "Crew";
      toast.error(`Conflito: ${crewName} já tem job nesse dia`);
      return;
    }

    // Unavailability check
    const u = unav.find(
      (x) =>
        x.crew_member_id === newCrewId &&
        isWithinInterval(parseISO(targetDate), { start: parseISO(x.start_date), end: parseISO(x.end_date) }),
    );
    if (u) {
      toast.error(`Crew indisponível: ${u.reason ?? "sem motivo"}`);
      return;
    }

    assign.mutate({ appointment: appt, newCrewId, removeCrewId: sourceCrewId });
  };

  const weekLabel = `${format(weekStart, "d MMM")} – ${format(addDays(weekStart, 6), "d MMM, yyyy")}`;

  // ─────────── render ───────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-2 text-sm font-medium tabular-nums min-w-[180px] text-center">{weekLabel}</div>
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Hoje
          </Button>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowUnavDialog(true)}>
          <CalendarX className="w-4 h-4" /> Indisponível
        </Button>
      </div>

      {apptQ.isLoading || crewQ.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {isMobile ? (
            // ───── MOBILE: tabs per day ─────
            <Tabs defaultValue={format(new Date(), "yyyy-MM-dd")}>
              <TabsList className="w-full overflow-x-auto justify-start">
                {days.map((d) => (
                  <TabsTrigger key={d.toISOString()} value={format(d, "yyyy-MM-dd")} className="flex-col h-auto py-1 px-2">
                    <span className="text-[10px] uppercase opacity-70">{format(d, "EEE")}</span>
                    <span className="text-sm font-bold">{format(d, "d")}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {days.map((d) => (
                <TabsContent key={d.toISOString()} value={format(d, "yyyy-MM-dd")} className="space-y-2 mt-3">
                  {crew.map((c) => {
                    const cellAppts = apptsByCrewDate.get(`${c.id}::${format(d, "yyyy-MM-dd")}`) ?? [];
                    const unavMatch = isUnavailable(c.id, d);
                    return (
                      <Card key={c.id} className={cn("p-2", unavMatch && "bg-destructive/10 border-destructive/30")}>
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-6 h-6"><AvatarImage src={c.avatar_url ?? undefined} /><AvatarFallback className="text-[10px]">{initials(c.full_name)}</AvatarFallback></Avatar>
                          <span className="text-xs font-medium">{c.full_name}</span>
                          {unavMatch && <Badge variant="destructive" className="text-[9px]">{unavMatch.reason ?? "Indisponível"}</Badge>}
                        </div>
                        <DayCell
                          crewId={c.id} date={d} appts={cellAppts}
                          isUnavailable={!!unavMatch} unavReason={unavMatch?.reason ?? undefined}
                          onApptClick={setDetailAppt}
                          onRemoveAssignment={(a) => remove.mutate({ appointmentId: a.id, crewId: c.id, current: a.assigned_to ?? [] })}
                        />
                      </Card>
                    );
                  })}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            // ───── DESKTOP: grid + side panel ─────
            <div className="grid grid-cols-[1fr_240px] gap-4">
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* header row */}
                    <div className="grid grid-cols-[140px_repeat(7,minmax(0,1fr))] border-b border-border bg-muted/30 text-[11px] uppercase tracking-wide font-medium">
                      <div className="p-2 border-r border-border">Crew</div>
                      {days.map((d) => (
                        <div key={d.toISOString()} className={cn(
                          "p-2 border-r border-border text-center tabular-nums",
                          isSameDay(d, new Date()) && "bg-primary/10 text-primary",
                        )}>
                          <div>{format(d, "EEE")}</div>
                          <div className="text-base font-bold normal-case tracking-normal">{format(d, "d")}</div>
                        </div>
                      ))}
                    </div>
                    {/* crew rows */}
                    {crew.map((c) => (
                      <div key={c.id} className="grid grid-cols-[140px_repeat(7,minmax(0,1fr))]">
                        <div className="p-2 border-r border-b border-border flex items-center gap-2 bg-muted/10">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={c.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[10px]">{initials(c.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate">{c.full_name}</div>
                            {c.role && <div className="text-[10px] text-muted-foreground truncate">{c.role}</div>}
                          </div>
                        </div>
                        {days.map((d) => {
                          const cellAppts = apptsByCrewDate.get(`${c.id}::${format(d, "yyyy-MM-dd")}`) ?? [];
                          const unavMatch = isUnavailable(c.id, d);
                          return (
                            <DayCell
                              key={d.toISOString()}
                              crewId={c.id} date={d} appts={cellAppts}
                              isUnavailable={!!unavMatch} unavReason={unavMatch?.reason ?? undefined}
                              onApptClick={setDetailAppt}
                              onRemoveAssignment={(a) => remove.mutate({ appointmentId: a.id, crewId: c.id, current: a.assigned_to ?? [] })}
                            />
                          );
                        })}
                      </div>
                    ))}
                    {crew.length === 0 && (
                      <div className="p-8 text-center text-sm text-muted-foreground">Nenhum crew ativo</div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Side panel */}
              <Card className="p-3 h-fit sticky top-4">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Jobs sem crew</h3>
                  <Badge variant="secondary" className="ml-auto text-[10px]">{unassigned.length}</Badge>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {unassigned.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Tudo alocado 🎉</p>
                  )}
                  {unassigned.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      appt={a}
                      draggableId={`appt::unassigned::${a.id}`}
                      onClick={() => setDetailAppt(a)}
                    />
                  ))}
                </div>
              </Card>
            </div>
          )}

          <DragOverlay>
            {activeDrag && (
              <div className={cn("rounded-md border px-2 py-1.5 text-[11px] shadow-lg", statusClass(activeDrag.status))}>
                <div className="font-medium">{activeDrag.appointment_time?.slice(0, 5)}</div>
                <div className="text-[10px] opacity-80">{activeDrag.location || activeDrag.customer_name}</div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <UnavailabilityDialog open={showUnavDialog} onOpenChange={setShowUnavDialog} crew={crew} />
      <ApptDetailSheet appt={detailAppt} onOpenChange={(b) => !b && setDetailAppt(null)} />
    </div>
  );
}
