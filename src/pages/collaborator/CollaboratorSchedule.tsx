import { useState } from "react";
import { useCollaboratorSchedule } from "@/hooks/useCollaboratorSchedule";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, MapPin, Clock, Users, ArrowRight, CalendarOff } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, isSameDay, getISOWeek } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: {
    label: "scheduled",
    className: "bg-[hsl(var(--state-neutral-bg))] text-[hsl(var(--state-neutral))] border-[hsl(var(--state-neutral)/0.3)]",
  },
  confirmed: {
    label: "confirmed",
    className: "bg-[hsl(var(--state-success-bg))] text-[hsl(var(--state-success))] border-[hsl(var(--state-success)/0.3)]",
  },
  completed: {
    label: "completed",
    className: "bg-[hsl(var(--state-success-bg))] text-[hsl(var(--state-success))] border-[hsl(var(--state-success)/0.3)]",
  },
  cancelled: {
    label: "cancelled",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  pending: {
    label: "pending",
    className: "bg-[hsl(var(--state-risk-bg))] text-[hsl(var(--state-risk))] border-[hsl(var(--state-risk)/0.3)]",
  },
};

export default function CollaboratorSchedule() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { data: appointments = [], isLoading } = useCollaboratorSchedule(weekOffset);
  const navigate = useNavigate();

  const adjustedDate = addWeeks(new Date(), weekOffset);
  const adjustedStart = startOfWeek(adjustedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(adjustedStart, i));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Week Navigator */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((o) => o - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-sm font-heading font-semibold text-foreground">
          Week of {format(adjustedStart, "MMM d, yyyy")}
        </h1>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((o) => o + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Daily Sections */}
      {weekDays.map((day) => {
        const dayAppointments = appointments.filter((a) =>
          isSameDay(new Date(a.appointment_date + "T00:00:00"), day)
        );
        const today = isSameDay(day, new Date());

        return (
          <div key={day.toISOString()} className="mb-4">
            {/* Day Header */}
            <div className="flex items-center justify-between mb-2 border-b border-border pb-2">
              <div>
                <h2 className={cn(
                  "text-sm font-bold",
                  today ? "text-primary" : "text-foreground"
                )}>
                  {format(day, "EEEE")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {format(day, "MMM d")}
                </p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {dayAppointments.length} job{dayAppointments.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Job Cards or Empty */}
            {dayAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <CalendarOff className="h-5 w-5 mb-1 text-muted-foreground/50" />
                <p className="text-xs">No jobs scheduled</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dayAppointments.map((appt) => {
                  const status = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;

                  return (
                    <Card key={appt.id} className="border-border shadow-sm">
                      <CardContent className="p-4 space-y-3">
                        {/* Title + Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm text-foreground leading-tight">
                              {appt.appointment_type === "production" ? "Floor Production" :
                               appt.appointment_type === "measurement" ? "Measurement Visit" :
                               appt.appointment_type === "follow_up" ? "Follow-up" :
                               appt.appointment_type === "inspection" ? "Inspection" :
                               appt.appointment_type}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {appt.customer_name}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap shrink-0",
                              status.className
                            )}
                          >
                            {status.label}
                          </Badge>
                        </div>

                        {/* Location */}
                        {appt.location && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{appt.location}</span>
                          </div>
                        )}

                        {/* Time + Members */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {appt.appointment_time?.slice(0, 5)}
                              {appt.duration_hours && ` · ${appt.duration_hours}h`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>3 members</span>
                          </div>
                        </div>

                        {/* View Details Link */}
                        {appt.project_id && (
                          <button
                            onClick={() => navigate(`/collaborator/project/${appt.project_id}`)}
                            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-1 mx-auto"
                          >
                            View Details
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
