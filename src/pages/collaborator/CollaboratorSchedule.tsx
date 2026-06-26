import { useState, useMemo } from "react";
import { useCollaboratorSchedule } from "@/hooks/useCollaboratorSchedule";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  ArrowRight,
  CalendarOff,
  AlertTriangle,
} from "lucide-react";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  isSameDay,
  differenceInCalendarDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatAppointmentTime } from "@/lib/constants";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { OnMyWayButton } from "@/components/shared/OnMyWayButton";
import { projectDisplayName } from "@/utils/projectDisplayName";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: {
    label: "Agendado",
    className:
      "bg-[hsl(var(--state-neutral-bg))] text-[hsl(var(--state-neutral))] border-[hsl(var(--state-neutral)/0.3)]",
  },
  confirmed: {
    label: "Confirmado",
    className: "bg-primary/10 text-primary border-primary/30",
  },
  in_progress: {
    label: "Em execução",
    className:
      "bg-[hsl(var(--state-risk-bg))] text-[hsl(var(--state-risk))] border-[hsl(var(--state-risk)/0.3)]",
  },
  completed: {
    label: "Concluído",
    className:
      "bg-[hsl(var(--state-success-bg))] text-[hsl(var(--state-success))] border-[hsl(var(--state-success)/0.3)]",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  pending: {
    label: "Pendente",
    className:
      "bg-[hsl(var(--state-risk-bg))] text-[hsl(var(--state-risk))] border-[hsl(var(--state-risk)/0.3)]",
  },
};

const SHORT_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const apptTypeLabel = (t: string) =>
  t === "production"
    ? "Produção"
    : t === "measurement"
      ? "Medição"
      : t === "follow_up"
        ? "Acompanhamento"
        : t === "inspection"
          ? "Inspeção"
          : t;

export default function CollaboratorSchedule() {
  const [view, setView] = useState<"day" | "week">("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const navigate = useNavigate();
  const { defaultArrivalWindow } = useCompanySettings();

  // Week offset relative to today, computed from selectedDate
  const weekOffset = useMemo(() => {
    const todayWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Math.round(
      differenceInCalendarDays(selectedWeekStart, todayWeekStart) / 7,
    );
  }, [selectedDate]);

  const { data: appointments = [], isLoading } =
    useCollaboratorSchedule(weekOffset);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 6);

  const goPrev = () =>
    setSelectedDate((d) => (view === "day" ? addDays(d, -1) : addWeeks(d, -1)));
  const goNext = () =>
    setSelectedDate((d) => (view === "day" ? addDays(d, 1) : addWeeks(d, 1)));
  const goToday = () => setSelectedDate(new Date());

  const centerLabel =
    view === "day"
      ? format(selectedDate, "EEE dd/MM", { locale: ptBR })
      : `${format(weekStart, "d MMM", { locale: ptBR })} – ${format(weekEnd, "d MMM", { locale: ptBR })}`;

  const dayAppointments = (day: Date) =>
    appointments.filter((a) =>
      isSameDay(new Date(a.appointment_date + "T00:00:00"), day),
    );

  const selectedDayAppts = dayAppointments(selectedDate);

  return (
    <div className="space-y-3">
      {/* Control header */}
      <div className="sticky top-[57px] z-30 -mx-4 px-4 py-2 bg-background/95 backdrop-blur border-b border-border space-y-2">
        {/* View toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex rounded-lg bg-muted p-0.5">
            {(["day", "week"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
                  view === v
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {v === "day" ? "Dia" : "Semana"}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={goToday}
          >
            Hoje
          </Button>
        </div>

        {/* Period navigator */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold capitalize text-foreground">
            {centerLabel}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : view === "week" ? (
        /* WEEK MODE */
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const today = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            const appts = dayAppointments(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "rounded-md border p-1 min-h-[120px] flex flex-col gap-1",
                  today
                    ? "border-primary/60 bg-primary/5"
                    : isSelected
                      ? "border-foreground/30 bg-muted/40"
                      : "border-border",
                )}
              >
                <button
                  onClick={() => {
                    setSelectedDate(day);
                    setView("day");
                  }}
                  className="text-center pb-1 border-b border-border/50"
                >
                  <div
                    className={cn(
                      "text-[9px] uppercase font-semibold leading-none",
                      today ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {SHORT_DAYS[day.getDay()]}
                  </div>
                  <div
                    className={cn(
                      "text-sm font-bold mt-0.5 leading-none",
                      today ? "text-primary" : "text-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </div>
                </button>

                <div className="flex-1 space-y-1 overflow-hidden">
                  {appts.length === 0 ? (
                    <p className="text-[9px] text-muted-foreground/60 text-center pt-2">
                      Sem jobs
                    </p>
                  ) : (
                    appts.map((appt) => (
                      <button
                        key={appt.id}
                        onClick={() =>
                          appt.project_id &&
                          navigate(`/collaborator/project/${appt.project_id}`)
                        }
                        className="w-full text-left rounded bg-card border border-border/60 p-1 hover:border-primary/50 transition-colors"
                      >
                        <p className="text-[9px] font-bold text-foreground leading-tight truncate">
                          {projectDisplayName(appt.customer_name, appt.location)}
                        </p>
                        {appt.location && (
                          <p className="text-[8px] text-muted-foreground truncate leading-tight">
                            {appt.location.split(",")[0]}
                          </p>
                        )}
                        <p className="text-[8px] text-primary font-semibold mt-0.5 leading-tight">
                          {formatAppointmentTime(
                            appt.appointment_time,
                            appt.arrival_window_minutes,
                            defaultArrivalWindow,
                          )}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DAY MODE */
        <div className="space-y-2">
          {selectedDayAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CalendarOff className="h-8 w-8 mb-2 text-muted-foreground/50" />
              <p className="text-sm">Nenhum job agendado</p>
            </div>
          ) : (
            selectedDayAppts.map((appt) => {
              const status =
                STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
              return (
                <Card key={appt.id} className="border-border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-foreground leading-tight">
                          {apptTypeLabel(appt.appointment_type)}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {projectDisplayName(appt.customer_name, appt.location)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap shrink-0",
                          status.className,
                        )}
                      >
                        {status.label}
                      </Badge>
                    </div>

                    {appt.location && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{appt.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {formatAppointmentTime(
                          appt.appointment_time,
                          appt.arrival_window_minutes,
                          defaultArrivalWindow,
                        )}
                        {appt.duration_hours && ` · ${appt.duration_hours}h`}
                      </span>
                    </div>

                    {appt.notes && (
                      <p className="text-xs text-muted-foreground border-l-2 border-border pl-2">
                        {appt.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <OnMyWayButton
                        phone={appt.customer_phone}
                        customerName={projectDisplayName(
                          appt.customer_name,
                          appt.location,
                        )}
                        className="h-8 text-xs"
                      />
                      {appt.project_id && (
                        <button
                          onClick={() =>
                            navigate(`/collaborator/project/${appt.project_id}`)
                          }
                          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Ver Detalhes
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
