import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
  location: string | null;
  duration_hours: number | null;
  customer_name: string;
}

interface AgendaSectionProps {
  appointments: Appointment[];
}

const statusBadge: Record<string, { label: string; className: string }> = {
  confirmed: {
    label: "Confirmado",
    className:
      "bg-[hsl(var(--state-success-bg))] text-[hsl(var(--state-success))] border-[hsl(var(--state-success)/0.3)]",
  },
  scheduled: {
    label: "Agendado",
    className:
      "bg-[hsl(var(--state-neutral-bg))] text-[hsl(var(--state-neutral))] border-[hsl(var(--state-neutral)/0.3)]",
  },
  in_progress: {
    label: "Em Andamento",
    className:
      "bg-[hsl(var(--state-risk-bg))] text-[hsl(var(--state-risk))] border-[hsl(var(--state-risk)/0.3)]",
  },
  pending: {
    label: "Pendente",
    className:
      "bg-[hsl(var(--state-neutral-bg))] text-[hsl(var(--state-neutral))] border-[hsl(var(--state-neutral)/0.3)]",
  },
};

const typeLabels: Record<string, string> = {
  measurement: "Medição",
  production: "Produção",
  follow_up: "Follow-up",
  inspection: "Inspeção",
};

export function AgendaSection({ appointments }: AgendaSectionProps) {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-6 rounded-xl border border-dashed border-border bg-card/50">
        <p className="text-sm font-medium text-foreground">Dia livre</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Sem jobs agendados para hoje
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {appointments.slice(0, 4).map((apt) => {
        const badge = statusBadge[apt.status] || statusBadge.pending;
        const endTime = apt.duration_hours
          ? format(
              new Date(
                new Date(`2000-01-01T${apt.appointment_time}`).getTime() +
                  apt.duration_hours * 3600000
              ),
              "HH:mm"
            )
          : null;

        const isActive =
          apt.status === "confirmed" || apt.status === "in_progress";

        return (
          <Card
            key={apt.id}
            className="rounded-xl overflow-hidden shadow-sm border-border"
          >
            <CardContent className="p-0">
              <div className="flex">
                <div
                  className={`w-1 flex-shrink-0 ${
                    isActive
                      ? "bg-[hsl(var(--state-success))]"
                      : "bg-[hsl(var(--state-neutral))]"
                  }`}
                />
                <div className="flex-1 p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-foreground leading-tight">
                        {typeLabels[apt.appointment_type] ||
                          apt.appointment_type}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {apt.customer_name}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap ${badge.className}`}
                    >
                      {badge.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {apt.appointment_time.slice(0, 5)}
                        {endTime ? ` – ${endTime}` : ""}
                      </span>
                    </div>
                    {apt.location && (
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{apt.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {appointments.length > 4 && (
        <Link
          to="/admin/schedule"
          className="block text-center text-xs font-semibold text-[hsl(var(--gold-warm))] hover:underline py-2"
        >
          +{appointments.length - 4} mais na agenda →
        </Link>
      )}
    </div>
  );
}
