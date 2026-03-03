import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, Plus, Clock, MapPin, Phone, User,
  CalendarIcon, Trash2, Edit2
} from "lucide-react";
import {
  format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays,
  isSameDay, isToday, parseISO, setMonth, setYear, getMonth, getYear
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Appointment = Tables<"appointments">;

const APPOINTMENT_TYPES = [
  { value: "measurement", label: "Medição", color: "bg-emerald-500", border: "border-l-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  { value: "production", label: "Produção", color: "bg-blue-500", border: "border-l-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  { value: "follow_up", label: "Follow-up", color: "bg-amber-500", border: "border-l-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  { value: "delivery", label: "Entrega", color: "bg-purple-500", border: "border-l-purple-500", bg: "bg-purple-50", text: "text-purple-700" },
  { value: "other", label: "Outro", color: "bg-gray-500", border: "border-l-gray-500", bg: "bg-gray-50", text: "text-gray-700" },
];

const HOURS = Array.from({ length: 17 }, (_, i) => i + 5); // 5AM to 9PM

function getTypeConfig(type: string) {
  return APPOINTMENT_TYPES.find(t => t.value === type) || APPOINTMENT_TYPES[4];
}

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
}

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  format(new Date(2026, i, 1), "MMMM", { locale: ptBR })
);

export default function Schedule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "list" | "week">("day");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch appointments for the visible week
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", format(weekStart, "yyyy-MM-dd"), format(weekEnd, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .gte("appointment_date", format(weekStart, "yyyy-MM-dd"))
        .lte("appointment_date", format(weekEnd, "yyyy-MM-dd"))
        .order("appointment_time", { ascending: true });
      if (error) throw error;
      return data as Appointment[];
    },
  });

  // Fetch projects for autocomplete
  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-schedule"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, customer_name, address, customer_phone")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const todayAppointments = useMemo(
    () => appointments.filter(a => a.appointment_date === format(currentDate, "yyyy-MM-dd")),
    [appointments, currentDate]
  );

  const dayCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    appointments.forEach(a => {
      map[a.appointment_date] = (map[a.appointment_date] || 0) + 1;
    });
    return map;
  }, [appointments]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: TablesInsert<"appointments"> & { id?: string }) => {
      if (data.id) {
        const { id, ...rest } = data;
        const { error } = await supabase.from("appointments").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("appointments").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setModalOpen(false);
      setEditingAppointment(null);
      toast({ title: editingAppointment ? "Agendamento atualizado" : "Agendamento criado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setModalOpen(false);
      setEditingAppointment(null);
      toast({ title: "Agendamento removido" });
    },
  });

  const openNew = () => { setEditingAppointment(null); setModalOpen(true); };
  const openEdit = (a: Appointment) => { setEditingAppointment(a); setModalOpen(true); };

  return (
    <AdminLayout title="Schedule">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm px-4 py-3 space-y-3 md:space-y-4">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">Schedule</h1>
              <Select
                value={`${getMonth(currentDate)}-${getYear(currentDate)}`}
                onValueChange={(v) => {
                  const [m, y] = v.split("-").map(Number);
                  setCurrentDate(setYear(setMonth(new Date(), m), y));
                }}
              >
                <SelectTrigger className="w-[160px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((name, i) => (
                    <SelectItem key={i} value={`${i}-${getYear(currentDate)}`}>
                      {name} {getYear(currentDate)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={openNew} className="w-full sm:w-auto gap-1.5">
              <Plus className="w-4 h-4" /> Novo
            </Button>
          </div>

          {/* Week navigation */}
          <div className="w-full overflow-hidden">
            <div className="grid grid-cols-[32px,1fr,32px] items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setCurrentDate(d => subWeeks(d, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="grid grid-cols-7 gap-0.5 md:gap-1 min-w-0">
                {weekDays.map(day => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const count = dayCountMap[dateStr] || 0;
                  const selected = isSameDay(day, currentDate);
                  const today = isToday(day);
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setCurrentDate(day)}
                      className={cn(
                        "rounded-lg py-1.5 md:py-2 text-center transition-all relative min-w-0",
                        selected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : today
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/60 text-muted-foreground"
                      )}
                    >
                      <div className="text-[10px] md:text-xs uppercase font-medium leading-none mb-0.5 truncate px-0.5">
                        {format(day, "EEEEE", { locale: ptBR })}
                      </div>
                      <div className="text-lg md:text-xl font-bold leading-tight">{format(day, "d")}</div>
                      {count > 0 && (
                        <div className={cn(
                          "hidden md:block text-[10px] font-semibold leading-none mt-0.5",
                          selected ? "text-primary-foreground/80" : "text-primary"
                        )}>
                          {count} job{count > 1 ? "s" : ""}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setCurrentDate(d => addWeeks(d, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* View mode tabs — centered */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <div className="flex justify-center">
              <TabsList className="h-9">
                <TabsTrigger value="day" className="text-sm px-5">Day</TabsTrigger>
                <TabsTrigger value="list" className="text-sm px-5">List</TabsTrigger>
                <TabsTrigger value="week" className="text-sm px-5">Week</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>
          ) : viewMode === "day" ? (
            <DayView appointments={todayAppointments} onEdit={openEdit} />
          ) : viewMode === "list" ? (
            <ListView appointments={todayAppointments} onEdit={openEdit} date={currentDate} />
          ) : (
            <WeekView appointments={appointments} weekDays={weekDays} currentDate={currentDate} onEdit={openEdit} onSelectDay={setCurrentDate} />
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AppointmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        appointment={editingAppointment}
        projects={projects}
        currentDate={currentDate}
        onSave={(data) => saveMutation.mutate(data)}
        onDelete={(id) => deleteMutation.mutate(id)}
        saving={saveMutation.isPending}
      />
    </AdminLayout>
  );
}

// ─── Day View ──────────────────────────────────────────────
function DayView({ appointments, onEdit }: { appointments: Appointment[]; onEdit: (a: Appointment) => void }) {
  return (
    <div className="relative">
      {HOURS.map(hour => (
        <div key={hour} className="flex border-b border-border/30 min-h-[60px]">
          <div className="w-16 flex-shrink-0 text-[11px] text-muted-foreground font-medium py-1 px-2 text-right">
            {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
          </div>
          <div className="flex-1 relative">
            {appointments
              .filter(a => {
                const t = parseTime(a.appointment_time);
                return Math.floor(t) === hour;
              })
              .map(a => {
                const cfg = getTypeConfig(a.appointment_type);
                const duration = a.duration_hours || 1;
                return (
                  <button
                    key={a.id}
                    onClick={() => onEdit(a)}
                    className={cn(
                      "absolute left-1 right-2 rounded-md border-l-4 px-2.5 py-1.5 text-left transition-shadow hover:shadow-md cursor-pointer",
                      cfg.border, cfg.bg
                    )}
                    style={{ height: `${duration * 60 - 4}px` }}
                  >
                    <div className={cn("text-xs font-semibold truncate", cfg.text)}>{a.customer_name}</div>
                    <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {a.appointment_time.slice(0, 5)}
                      {a.location && <><MapPin className="w-3 h-3 ml-1" />{a.location}</>}
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
      {appointments.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm pointer-events-none">
          Sem agendamentos. Dia livre ou falha no pipeline.
        </div>
      )}
    </div>
  );
}

// ─── List View ──────────────────────────────────────────────
function ListView({ appointments, onEdit, date }: { appointments: Appointment[]; onEdit: (a: Appointment) => void; date: Date }) {
  return (
    <div className="p-4 space-y-3">
      <div className="text-sm font-medium text-muted-foreground mb-2">
        {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })} · {appointments.length} agendamento{appointments.length !== 1 ? "s" : ""}
      </div>
      {appointments.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">Sem agendamentos nesta semana</div>
      )}
      {appointments.map(a => {
        const cfg = getTypeConfig(a.appointment_type);
        return (
          <button
            key={a.id}
            onClick={() => onEdit(a)}
            className={cn(
              "w-full text-left bg-card rounded-xl border border-border/50 p-4 flex gap-4 items-start transition-shadow hover:shadow-md border-l-4",
              cfg.border
            )}
          >
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", cfg.bg)}>
              <Clock className={cn("w-5 h-5", cfg.text)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-sm truncate">{a.customer_name}</span>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", cfg.bg, cfg.text)}>
                  {cfg.label}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {a.appointment_time.slice(0, 5)} · {a.duration_hours || 1}h
                </div>
                {a.location && (
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3 h-3" /> {a.location}
                  </div>
                )}
                {a.customer_phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> {a.customer_phone}
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Week View ──────────────────────────────────────────────
function WeekView({
  appointments, weekDays, currentDate, onEdit, onSelectDay
}: {
  appointments: Appointment[]; weekDays: Date[]; currentDate: Date;
  onEdit: (a: Appointment) => void; onSelectDay: (d: Date) => void;
}) {
  return (
    <div className="overflow-x-auto">
    <div className="grid grid-cols-7 gap-px bg-border/30 min-h-[400px] min-w-[600px]">
      {weekDays.map(day => {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayAppts = appointments.filter(a => a.appointment_date === dateStr);
        const selected = isSameDay(day, currentDate);
        return (
          <div
            key={dateStr}
            className={cn(
              "bg-card p-2 min-h-[120px] cursor-pointer transition-colors",
              selected && "bg-primary/5"
            )}
            onClick={() => onSelectDay(day)}
          >
            <div className={cn(
              "text-xs font-medium mb-2",
              isToday(day) ? "text-primary" : "text-muted-foreground"
            )}>
              {format(day, "EEE d", { locale: ptBR })}
            </div>
            <div className="space-y-1">
              {dayAppts.slice(0, 4).map(a => {
                const cfg = getTypeConfig(a.appointment_type);
                return (
                  <button
                    key={a.id}
                    onClick={(e) => { e.stopPropagation(); onEdit(a); }}
                    className={cn(
                      "w-full text-left rounded px-1.5 py-0.5 text-[10px] truncate border-l-2",
                      cfg.border, cfg.bg, cfg.text
                    )}
                  >
                    {a.appointment_time.slice(0, 5)} {a.customer_name}
                  </button>
                );
              })}
              {dayAppts.length > 4 && (
                <div className="text-[10px] text-muted-foreground px-1">+{dayAppts.length - 4} mais</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}

// ─── Appointment Modal ──────────────────────────────────────
function AppointmentModal({
  open, onOpenChange, appointment, projects, currentDate, onSave, onDelete, saving
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appointment: Appointment | null;
  projects: { id: string; customer_name: string; address: string | null; customer_phone: string }[];
  currentDate: Date;
  onSave: (data: any) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    appointment_type: "measurement",
    appointment_date: format(currentDate, "yyyy-MM-dd"),
    appointment_time: "09:00",
    duration_hours: 1,
    location: "",
    notes: "",
    project_id: null as string | null,
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Reset form when modal opens
  const handleOpenChange = (v: boolean) => {
    if (v) {
      if (appointment) {
        setForm({
          customer_name: appointment.customer_name,
          customer_phone: appointment.customer_phone,
          appointment_type: appointment.appointment_type,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time.slice(0, 5),
          duration_hours: appointment.duration_hours || 1,
          location: appointment.location || "",
          notes: appointment.notes || "",
          project_id: appointment.project_id,
        });
      } else {
        setForm({
          customer_name: "", customer_phone: "", appointment_type: "measurement",
          appointment_date: format(currentDate, "yyyy-MM-dd"), appointment_time: "09:00",
          duration_hours: 1, location: "", notes: "", project_id: null,
        });
      }
    }
    onOpenChange(v);
  };

  const linkProject = (projectId: string) => {
    const p = projects.find(pr => pr.id === projectId);
    if (p) {
      setForm(f => ({
        ...f,
        project_id: p.id,
        customer_name: p.customer_name,
        customer_phone: p.customer_phone,
        location: p.address || f.location,
      }));
    }
  };

  const handleSubmit = () => {
    if (!form.customer_name || !form.customer_phone) return;
    onSave({
      ...form,
      ...(appointment ? { id: appointment.id } : {}),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{appointment ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
          <DialogDescription>
            {appointment ? "Atualize os dados do agendamento." : "Preencha os dados para criar um novo agendamento."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Link to project */}
          <div>
            <Label className="text-xs">Vincular a Projeto</Label>
            <Select value={form.project_id || ""} onValueChange={linkProject}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione um projeto (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.customer_name} {p.address ? `- ${p.address}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Cliente *</Label>
              <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Telefone *</Label>
              <Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} className="h-9" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={form.appointment_type} onValueChange={v => setForm(f => ({ ...f, appointment_type: v }))}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPOINTMENT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Data</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-9 text-xs justify-start">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {format(parseISO(form.appointment_date), "dd/MM")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parseISO(form.appointment_date)}
                    onSelect={(d) => { if (d) { setForm(f => ({ ...f, appointment_date: format(d, "yyyy-MM-dd") })); setDatePickerOpen(false); } }}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs">Horário</Label>
              <Input type="time" value={form.appointment_time} onChange={e => setForm(f => ({ ...f, appointment_time: e.target.value }))} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Duração (h)</Label>
              <Input type="number" min={0.5} step={0.5} value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: Number(e.target.value) }))} className="h-9" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Local</Label>
            <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Endereço" className="h-9" />
          </div>

          <div>
            <Label className="text-xs">Notas</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 justify-between sm:justify-between">
          {appointment && (
            <Button variant="destructive" size="sm" onClick={() => onDelete(appointment.id)} className="gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Remover
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={saving || !form.customer_name || !form.customer_phone} size="sm" className="ml-auto">
            {saving ? "Salvando..." : appointment ? "Atualizar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
