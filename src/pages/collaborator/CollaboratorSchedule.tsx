import { useState } from "react";
import { useCollaboratorSchedule } from "@/hooks/useCollaboratorSchedule";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  scheduled: "outline",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export default function CollaboratorSchedule() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { data: appointments = [], isLoading } = useCollaboratorSchedule(weekOffset);
  const navigate = useNavigate();

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const adjustedStart = addDays(weekStart, weekOffset * 7);
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(adjustedStart, i));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Navigator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset((o) => o - 1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-sm font-heading font-semibold text-foreground">
          Semana de {format(adjustedStart, "MMM d")}
        </h1>
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset((o) => o + 1)}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Daily Sections */}
      {weekDays.map((day) => {
        const dayAppointments = appointments.filter((a) =>
          isSameDay(new Date(a.appointment_date + "T00:00:00"), day)
        );
        const today = isSameDay(day, new Date());

        return (
          <div key={day.toISOString()} className="space-y-2">
            <h2 className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              today ? "text-primary" : "text-muted-foreground"
            )}>
              {format(day, "EEEE, MMM d")}
              {today && " — Hoje"}
            </h2>

            {dayAppointments.length === 0 ? (
              <p className="text-xs text-muted-foreground pl-1">Sem jobs agendados</p>
            ) : (
              dayAppointments.map((appt) => (
                <Card
                  key={appt.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => appt.project_id && navigate(`/collaborator/project/${appt.project_id}`)}
                >
                  <CardContent className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground">
                        {appt.customer_name}
                      </span>
                      <Badge variant={STATUS_VARIANT[appt.status] || "outline"} className="text-[10px]">
                        {appt.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {appt.appointment_time?.slice(0, 5)}
                        {appt.duration_hours && ` · ${appt.duration_hours}h`}
                      </span>
                      <span className="text-muted-foreground/50">
                        {appt.appointment_type}
                      </span>
                    </div>

                    {appt.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{appt.location}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
