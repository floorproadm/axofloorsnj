import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AXO_ORG_ID } from "@/lib/constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppointmentRequestsBody } from "@/pages/admin/AppointmentRequests";
import { CalendarDays, Inbox, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft, ChevronRight, Plus, Clock, MapPin, Phone, User,
  CalendarIcon, Trash2, Edit2, Copy, Ruler, Wrench, PhoneCall, PackageCheck,
  Save
} from "lucide-react";
import {
  format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays,
  isSameDay, isToday, parseISO, setMonth, setYear, getMonth, getYear
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { DayNoteBar, DayNoteStrip } from "@/components/admin/schedule/DayNoteBar";
import { useDayNotes } from "@/hooks/useDayNotes";
import { ExecutionPanel, ExecutionBadge } from "@/components/admin/schedule/ExecutionPanel";
import { DispatchMapView } from "@/components/admin/schedule/DispatchMapView";

type Appointment = Tables<"appointments">;

const APPOINTMENT_TYPES = [
  { value: "measurement", label: "Medição", color: "bg-emerald-500", border: "border-l-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  { value: "production", label: "Produção", color: "bg-blue-500", border: "border-l-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  { value: "follow_up", label: "Follow-up", color: "bg-amber-500", border: "border-l-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  { value: "delivery", label: "Entrega", color: "bg-purple-500", border: "border-l-purple-500", bg: "bg-purple-50", text: "text-purple-700" },
  { value: "other", label: "Outro", color: "bg-gray-500", border: "border-l-gray-500", bg: "bg-gray-50", text: "text-gray-700" },
  { value: "on_site_estimate",    label: "On-Site Estimate",    color: "bg-violet-500",  border: "border-l-violet-500",  bg: "bg-violet-50",  text: "text-violet-700" },
  { value: "site_visit",         label: "Site Visit",         color: "bg-emerald-400", border: "border-l-emerald-400", bg: "bg-emerald-50", text: "text-emerald-700" },
  { value: "project_walkthrough", label: "Project Walkthrough", color: "bg-orange-400",  border: "border-l-orange-400",  bg: "bg-orange-50",  text: "text-orange-700" },
  { value: "punch_out",          label: "Punch-Out",          color: "bg-orange-500",  border: "border-l-orange-500",  bg: "bg-orange-50",  text: "text-orange-700" },
  { value: "quality_control",    label: "Quality Control",    color: "bg-yellow-500",  border: "border-l-yellow-500",  bg: "bg-yellow-50",  text: "text-yellow-700" },
  { value: "scope_clarification",label: "Scope Clarification", color: "bg-sky-400",     border: "border-l-sky-400",     bg: "bg-sky-50",     text: "text-sky-700" },
  { value: "payment_collection", label: "Payment Collection",  color: "bg-green-600",  border: "border-l-green-600",  bg: "bg-green-50",  text: "text-green-700" },
];

const SCHEDULE_TEMPLATES = [
  { label: "Medição Residencial", type: "measurement", duration_hours: 1, default_time: "09:00", icon: Ruler, description: "Visita padrão de medição · 1h" },
  { label: "Produção (Dia Inteiro)", type: "production", duration_hours: 8, default_time: "07:00", icon: Wrench, description: "Dia completo de produção · 8h" },
  { label: "Follow-up Rápido", type: "follow_up", duration_hours: 0.5, default_time: "14:00", icon: PhoneCall, description: "Ligação ou visita curta · 30min" },
  { label: "Entrega e Inspeção", type: "delivery", duration_hours: 2, default_time: "10:00", icon: PackageCheck, description: "Entrega final + checklist · 2h" },
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const mainTab = (searchParams.get("tab") === "appointments" ? "appointments" : searchParams.get("tab") === "settings" ? "settings" : "schedule") as "schedule" | "appointments" | "settings";
  const setMainTab = (v: "schedule" | "appointments" | "settings") => {
    const next = new URLSearchParams(searchParams);
    if (v === "appointments") next.set("tab", "appointments");
    else if (v === "settings") next.set("tab", "settings");
    else next.delete("tab");
    setSearchParams(next, { replace: true });
  };
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "list" | "week" | "map">("day");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDefaults, setTemplateDefaults] = useState<{ type: string; duration: number; time: string } | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch appointments for the visible week (real + synthesized from projects/leads)
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", format(weekStart, "yyyy-MM-dd"), format(weekEnd, "yyyy-MM-dd")],
    queryFn: async () => {
      const startStr = format(weekStart, "yyyy-MM-dd");
      const endStr = format(weekEnd, "yyyy-MM-dd");

      const [apptRes, projRes, leadRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("*")
          .eq("organization_id", AXO_ORG_ID)
          .gte("appointment_date", startStr)
          .lte("appointment_date", endStr)
          .order("appointment_time", { ascending: true }),
        supabase
          .from("projects")
          .select("id, customer_name, customer_phone, address, project_type, start_date")
          .eq("organization_id", AXO_ORG_ID)
          .not("start_date", "is", null)
          .gte("start_date", startStr)
          .lte("start_date", endStr),
        supabase
          .from("leads")
          .select("id, name, phone, address, city, services, next_action_date, status")
          .eq("organization_id", AXO_ORG_ID)
          .eq("status", "estimate_scheduled")
          .not("next_action_date", "is", null)
          .gte("next_action_date", startStr)
          .lte("next_action_date", endStr),
      ]);

      if (apptRes.error) throw apptRes.error;

      const realAppts = (apptRes.data || []) as Appointment[];

      const projectAppts: Appointment[] = (projRes.data || []).map((p: any) => ({
        id: `proj-${p.id}` as any,
        organization_id: AXO_ORG_ID,
        appointment_type: "production",
        appointment_date: p.start_date,
        appointment_time: "08:00:00",
        duration_hours: 8,
        customer_name: p.customer_name || "Projeto",
        customer_phone: p.customer_phone || "",
        location: p.address || "",
        notes: p.project_type || "",
        project_id: p.id,
        status: "scheduled",
        assigned_to: [],
        customer_id: null,
        reminder_sent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any));

      const leadAppts: Appointment[] = (leadRes.data || []).map((l: any) => {
        const svc = Array.isArray(l.services) && l.services.length > 0 ? String(l.services[0]) : "Visita de medição";
        const loc = [l.address, l.city].filter(Boolean).join(", ");
        return {
          id: `lead-${l.id}` as any,
          organization_id: AXO_ORG_ID,
          appointment_type: "measurement",
          appointment_date: l.next_action_date,
          appointment_time: "09:00:00",
          duration_hours: 1,
          customer_name: l.name || "Lead",
          customer_phone: l.phone || "",
          location: loc,
          notes: svc,
          project_id: null,
          status: "scheduled",
          assigned_to: [],
          customer_id: null,
          reminder_sent: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any;
      });

      return [...realAppts, ...projectAppts, ...leadAppts];
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
      // Soft conflict check: ±1h window on same date
      try {
        const dateStr = data.appointment_date as string | undefined;
        const timeStr = data.appointment_time as string | undefined;
        if (dateStr && timeStr) {
          const [h, m] = timeStr.split(":").map(Number);
          const target = (h || 0) * 60 + (m || 0);
          const conflict = appointments.find((a) => {
            if (data.id && a.id === data.id) return false;
            if (a.appointment_date !== dateStr) return false;
            const [ah, am] = a.appointment_time.slice(0, 5).split(":").map(Number);
            const mins = (ah || 0) * 60 + (am || 0);
            return Math.abs(mins - target) <= 60;
          });
          if (conflict) {
            sonnerToast.warning(`There's already an appointment at this time: ${conflict.customer_name}`);
          }
        }
      } catch { /* non-blocking */ }

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

  const openNew = () => { setEditingAppointment(null); setTemplateDefaults(null); setModalOpen(true); };
  const openEdit = (a: Appointment) => {
    const id = String(a.id);
    if (id.startsWith("proj-")) { navigate(`/admin/projects/${id.slice(5)}`); return; }
    if (id.startsWith("lead-")) { navigate(`/admin/leads/${id.slice(5)}`); return; }
    setEditingAppointment(a); setTemplateDefaults(null); setModalOpen(true);
  };
  const openFromTemplate = (tpl: typeof SCHEDULE_TEMPLATES[number]) => {
    setEditingAppointment(null);
    setTemplateDefaults({ type: tpl.type, duration: tpl.duration_hours, time: tpl.default_time });
    setTemplateDialogOpen(false);
    setModalOpen(true);
  };

  return (
    <AdminLayout title="Schedule & Appointment">
      <div className="flex flex-col h-full">
        {/* Main Tabs: Schedule & Appointment | Appointments | Settings */}
        <div className="px-4 pt-3">
          <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "schedule" | "appointments" | "settings")}>
            <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto w-auto">
              <TabsTrigger
                value="schedule"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
              >
                <CalendarDays className="w-4 h-4 mr-1.5" />
                Schedule
              </TabsTrigger>
              <TabsTrigger
                value="appointments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
              >
                <Inbox className="w-4 h-4 mr-1.5" />
                Appointments
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
              >
                <Settings className="w-4 h-4 mr-1.5" />
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {mainTab === "appointments" ? (
          <div className="p-4">
            <AppointmentRequestsBody />
          </div>
        ) : mainTab === "settings" ? (
          <ScheduleSettings />
        ) : (
        <>
        {/* Header */}
        <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm px-4 py-3 space-y-3 md:space-y-4">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto gap-1.5">
                  <Plus className="w-4 h-4" /> Novo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={openNew} className="gap-2">
                  <CalendarIcon className="w-4 h-4" /> Novo Agendamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTemplateDialogOpen(true)} className="gap-2">
                  <Copy className="w-4 h-4" /> Usar Template
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                <TabsTrigger value="map" className="text-sm px-5">Map</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>
          ) : viewMode === "day" ? (
            <>
              <DayNoteBar date={currentDate} />
              <DayView appointments={todayAppointments} onEdit={openEdit} />
            </>
          ) : viewMode === "list" ? (
            <>
              <DayNoteBar date={currentDate} />
              <ListView appointments={todayAppointments} onEdit={openEdit} date={currentDate} />
            </>
          ) : viewMode === "map" ? (
            <DispatchMapView appointments={todayAppointments} date={currentDate} />
          ) : (
            <WeekView appointments={appointments} weekDays={weekDays} currentDate={currentDate} onEdit={openEdit} onSelectDay={setCurrentDate} weekStart={weekStart} weekEnd={weekEnd} />
          )}
        </div>
        </>
        )}
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
        templateDefaults={templateDefaults}
      />

      {/* Template Picker Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Escolher Template</DialogTitle>
            <DialogDescription>Selecione um modelo para pré-preencher o agendamento.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {SCHEDULE_TEMPLATES.map(tpl => {
              const cfg = getTypeConfig(tpl.type);
              const Icon = tpl.icon;
              return (
                <button
                  key={tpl.type}
                  onClick={() => openFromTemplate(tpl)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-border/50 p-3 text-left transition-colors hover:bg-muted/60"
                  )}
                >
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
                    <Icon className={cn("w-4 h-4", cfg.text)} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{tpl.label}</div>
                    <div className="text-xs text-muted-foreground">{tpl.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
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
                    <div className={cn("text-xs font-semibold truncate flex items-center gap-1", cfg.text)}>
                      <ExecutionBadge startedAt={(a as any).started_at} finishedAt={(a as any).finished_at} />
                      <span className="truncate">{a.customer_name}</span>
                    </div>
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
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm pointer-events-none px-4 text-center">
          Nenhum agendamento para hoje
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
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground text-sm truncate flex items-center gap-1.5">
                  <ExecutionBadge startedAt={(a as any).started_at} finishedAt={(a as any).finished_at} />
                  <span className="truncate">{a.customer_name}</span>
                </span>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", cfg.bg, cfg.text)}>
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
  appointments, weekDays, currentDate, onEdit, onSelectDay, weekStart, weekEnd
}: {
  appointments: Appointment[]; weekDays: Date[]; currentDate: Date;
  onEdit: (a: Appointment) => void; onSelectDay: (d: Date) => void;
  weekStart: Date; weekEnd: Date;
}) {
  const { data: dayNotes = [] } = useDayNotes(
    format(weekStart, "yyyy-MM-dd"),
    format(weekEnd, "yyyy-MM-dd")
  );
  const noteByDate = useMemo(() => {
    const m: Record<string, typeof dayNotes[0]> = {};
    dayNotes.forEach((n) => { m[n.note_date] = n; });
    return m;
  }, [dayNotes]);

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
              <DayNoteStrip note={noteByDate[dateStr]} />
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
  open, onOpenChange, appointment, projects, currentDate, onSave, onDelete, saving, templateDefaults
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  appointment: Appointment | null;
  projects: { id: string; customer_name: string; address: string | null; customer_phone: string }[];
  currentDate: Date;
  onSave: (data: any) => void;
  onDelete: (id: string) => void;
  saving: boolean;
  templateDefaults?: { type: string; duration: number; time: string } | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
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
    assigned_to: [] as string[],
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);

  // Fetch team members (profiles)
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data.filter(p => p.user_id);
    },
  });

  // Reset form when modal opens
  const handleOpenChange = (v: boolean) => {
    if (v) {
      if (appointment) {
        setIsEditing(false); // view mode for existing
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
          assigned_to: (appointment as any).assigned_to || [],
        });
      } else {
        setIsEditing(true); // edit mode for new
        setForm({
          customer_name: "", customer_phone: "",
          appointment_type: templateDefaults?.type || "measurement",
          appointment_date: format(currentDate, "yyyy-MM-dd"),
          appointment_time: templateDefaults?.time || "09:00",
          duration_hours: templateDefaults?.duration || 1,
          location: "", notes: "", project_id: null,
          assigned_to: [],
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
      organization_id: AXO_ORG_ID,
      ...(appointment ? { id: appointment.id } : {}),
    });
  };

  const typeCfg = getTypeConfig(form.appointment_type);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{!appointment ? "Novo Agendamento" : isEditing ? "Editar Agendamento" : "Detalhes do Agendamento"}</DialogTitle>
          <DialogDescription>
            {!appointment ? "Preencha os dados para criar um novo agendamento." : isEditing ? "Atualize os dados do agendamento." : "Visualize as informações do agendamento."}
          </DialogDescription>
        </DialogHeader>

        {/* ── VIEW MODE ── */}
        {appointment && !isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", typeCfg.bg, typeCfg.text)}>
                {typeCfg.label}
              </span>
              <span className="text-xs text-muted-foreground capitalize">{appointment.status}</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{form.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{form.customer_phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-foreground">
                  {format(parseISO(form.appointment_date), "dd/MM/yyyy")} às {form.appointment_time}
                  <span className="text-muted-foreground ml-1">· {form.duration_hours}h</span>
                </p>
              </div>

              {form.location && (
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-foreground">{form.location}</p>
                </div>
              )}

              {form.assigned_to.length > 0 && (
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {form.assigned_to.map(uid => {
                      const member = teamMembers.find(m => m.user_id === uid);
                      return (
                        <Badge key={uid} variant="secondary" className="text-xs">
                          {member?.full_name || member?.email || "Membro"}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {form.notes && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{form.notes}</p>
                </div>
              )}
            </div>

            {appointment && (
              <ExecutionPanel
                appointmentId={appointment.id}
                startedAt={(appointment as any).started_at ?? null}
                finishedAt={(appointment as any).finished_at ?? null}
                actualMinutes={(appointment as any).actual_duration_minutes ?? null}
                estimatedHours={appointment.duration_hours || 1}
              />
            )}



            <DialogFooter className="flex-row gap-2 justify-end sm:justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5">
                <Edit2 className="w-3.5 h-3.5" /> Editar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* ── EDIT / CREATE MODE ── */
          <>
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
                <Label className="text-xs">Equipe Designada</Label>
                <Popover open={teamPickerOpen} onOpenChange={setTeamPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-auto min-h-9 justify-start text-left font-normal">
                      {form.assigned_to.length === 0 ? (
                        <span className="text-muted-foreground text-xs">Selecionar membros (serão notificados)</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {form.assigned_to.map(uid => {
                            const member = teamMembers.find(m => m.user_id === uid);
                            return (
                              <Badge key={uid} variant="secondary" className="text-xs">
                                {member?.full_name || member?.email || "Membro"}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {teamMembers.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">Nenhum membro encontrado</p>
                      )}
                      {teamMembers.map(member => (
                        <label
                          key={member.user_id}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60 cursor-pointer"
                        >
                          <Checkbox
                            checked={form.assigned_to.includes(member.user_id!)}
                            onCheckedChange={(checked) => {
                              setForm(f => ({
                                ...f,
                                assigned_to: checked
                                  ? [...f.assigned_to, member.user_id!]
                                  : f.assigned_to.filter(id => id !== member.user_id),
                              }));
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{member.full_name || "Sem nome"}</p>
                            {member.email && <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Schedule Settings ──────────────────────────────────────
function ScheduleSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["schedule-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("id, default_job_start_time, custom_send_time")
        .eq("organization_id", AXO_ORG_ID)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [jobStartTime, setJobStartTime] = useState("08:00");
  const [sendTime, setSendTime] = useState("09:00");

  useEffect(() => {
    if (settings) {
      setJobStartTime(settings.default_job_start_time || "08:00");
      setSendTime(settings.custom_send_time || "09:00");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("company_settings")
        .update({
          default_job_start_time: jobStartTime,
          custom_send_time: sendTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-settings"] });
      toast({ title: "Configurações salvas" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center text-muted-foreground">
        Carregando configurações...
      </div>
    );
  }

  return (
    <div className="p-4 max-w-xl mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Configurações de Agenda</h2>
        <p className="text-sm text-muted-foreground">
          Defina os horários padrão para operações do sistema.
        </p>
      </div>

      <div className="space-y-4 bg-card border border-border/50 rounded-xl p-5">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Default Job Start Time</Label>
            <p className="text-xs text-muted-foreground">
              Horário padrão de início para novos jobs e agendamentos de produção.
            </p>
            <Input
              type="time"
              value={jobStartTime}
              onChange={(e) => setJobStartTime(e.target.value)}
              className="w-40 h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Custom Send Time</Label>
            <p className="text-xs text-muted-foreground">
              Hora padrão para envio de propostas e faturas ao cliente.
            </p>
            <Input
              type="time"
              value={sendTime}
              onChange={(e) => setSendTime(e.target.value)}
              className="w-40 h-9"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            size="sm"
            className="gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {saveMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
