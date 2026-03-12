import { useState } from "react";
import { AXO_ORG_ID } from "@/lib/constants";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Loader2, Trash2, ListTodo, CalendarClock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NewTaskDialog } from "@/components/admin/dashboard/NewTaskDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface PartnerChecklistProps {
  partnerId: string;
}

interface ChecklistTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  completed_at: string | null;
  created_at: string;
}

interface ChecklistEvent {
  id: string;
  customer_name: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
  notes: string | null;
}

const EVENT_TYPES = [
  { value: "measurement", label: "Medição" },
  { value: "follow_up", label: "Follow-up" },
  { value: "production", label: "Produção" },
  { value: "delivery", label: "Entrega" },
  { value: "other", label: "Outro" },
];

export function PartnerChecklist({ partnerId }: PartnerChecklistProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  // Event form state
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("follow_up");
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [eventTime, setEventTime] = useState("09:00");

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["partner-checklist", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks" as any)
        .select("id, title, status, priority, completed_at, created_at")
        .eq("related_partner_id", partnerId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ChecklistTask[];
    },
  });

  // Fetch appointments where notes contain partner ID (linked events)
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["partner-events", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, customer_name, appointment_date, appointment_time, appointment_type, status, notes")
        .like("notes", `%partner:${partnerId}%`)
        .order("appointment_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ChecklistEvent[];
    },
  });

  const createTask = useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      priority?: string;
      assigned_to?: string | null;
      due_date?: string | null;
      related_partner_id?: string | null;
    }) => {
      const { error } = await supabase
        .from("tasks" as any)
        .insert({
          title: input.title,
          description: input.description ?? null,
          priority: input.priority ?? "medium",
          assigned_to: input.assigned_to ?? null,
          due_date: input.due_date ?? null,
          related_partner_id: input.related_partner_id ?? partnerId,
          status: "pending",
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-checklist", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const createEvent = useMutation({
    mutationFn: async () => {
      if (!eventName.trim() || !eventDate) return;
      const { error } = await supabase.from("appointments").insert({
        customer_name: eventName.trim(),
        appointment_date: format(eventDate, "yyyy-MM-dd"),
        appointment_time: eventTime,
        appointment_type: eventType,
        status: "scheduled",
        notes: `partner:${partnerId}`,
        customer_phone: "",
        organization_id: AXO_ORG_ID,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-events", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setEventDialogOpen(false);
      setEventName("");
      setEventType("follow_up");
      setEventDate(undefined);
      setEventTime("09:00");
    },
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from("tasks" as any)
        .update({
          status: done ? "done" : "pending",
          completed_at: done ? new Date().toISOString() : null,
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-checklist", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-checklist", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-events", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;
  const isLoading = tasksLoading || eventsLoading;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-primary" />
          Tarefas & Eventos
          {totalCount > 0 && (
            <span className="text-xs text-muted-foreground font-medium">
              {doneCount}/{totalCount}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
              <Plus className="w-3.5 h-3.5" /> Novo
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setTaskDialogOpen(true)} className="gap-2 cursor-pointer">
              <ListTodo className="w-3.5 h-3.5" /> Tarefa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEventDialogOpen(true)} className="gap-2 cursor-pointer">
              <CalendarClock className="w-3.5 h-3.5" /> Evento
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <NewTaskDialog
          externalOpen={taskDialogOpen}
          onExternalOpenChange={setTaskDialogOpen}
          onSubmit={(task) => createTask.mutate(task)}
          isPending={createTask.isPending}
          relatedPartnerId={partnerId}
          hideTrigger
        />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Tasks */}
          {tasks.length > 0 && (
            <div className="space-y-1">
              {tasks.map((task) => {
                const isDone = task.status === "done";
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-2.5 group rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50",
                      isDone && "opacity-50"
                    )}
                  >
                    <Checkbox
                      checked={isDone}
                      onCheckedChange={(checked) =>
                        toggleTask.mutate({ id: task.id, done: !!checked })
                      }
                      className="flex-shrink-0"
                    />
                    <ListTodo className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span
                      className={cn(
                        "text-sm flex-1 min-w-0 truncate",
                        isDone && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => deleteTask.mutate(task.id)}
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Events */}
          {events.length > 0 && (
            <div className="space-y-1">
              {events.map((ev) => {
                const typeLabel = EVENT_TYPES.find(t => t.value === ev.appointment_type)?.label ?? ev.appointment_type;
                return (
                  <div
                    key={ev.id}
                    className="flex items-center gap-2.5 group rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate("/admin/schedule")}
                  >
                    <CalendarClock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="text-sm flex-1 min-w-0 truncate">
                      {ev.customer_name}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                      {typeLabel} · {ev.appointment_date ? format(new Date(ev.appointment_date + "T00:00:00"), "dd/MM") : ""}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => deleteEvent.mutate(ev.id)}
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {tasks.length === 0 && events.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">Nenhuma tarefa ou evento</p>
          )}
        </>
      )}

      {/* Event Creation Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nome / Descrição"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              autoFocus
            />
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !eventDate && "text-muted-foreground")}>
                    <CalendarClock className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, "dd/MM/yyyy") : "Data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-28"
              />
            </div>
            <Button
              onClick={() => createEvent.mutate()}
              disabled={!eventName.trim() || !eventDate || createEvent.isPending}
              className="w-full"
            >
              Criar Evento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
