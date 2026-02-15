import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/admin/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, getWeek, startOfWeek, endOfWeek, addDays } from "date-fns";
import {
  DollarSign,
  Briefcase,
  Users,
  Clock,
  Bell,
  ChevronRight,
} from "lucide-react";

export default function Dashboard() {
  const {
    isLoading,
    moneyMetrics,
    funnelMetrics,
    criticalAlerts,
  } = useDashboardData();

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const { data: appointments = [] } = useQuery({
    queryKey: ["dashboard-appointments", todayStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("appointment_date", todayStr)
        .order("appointment_time", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
  const tomorrow = addDays(today, 1);
  const tomorrowStr = format(tomorrow, "yyyy-MM-dd");

  const { data: weekAppointments = [] } = useQuery({
    queryKey: ["dashboard-week-appointments", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("appointment_date")
        .gte("appointment_date", format(weekStart, "yyyy-MM-dd"))
        .lte("appointment_date", format(weekEnd, "yyyy-MM-dd"));
      if (error) throw error;
      return data || [];
    },
  });

  const tomorrowCount = weekAppointments.filter(a => a.appointment_date === tomorrowStr).length;

  const newLeadsToday = useMemo(() => {
    return criticalAlerts.newLeadsNoContact24h.length;
  }, [criticalAlerts]);

  const priorityTasks = useMemo(() => {
    const tasks: { label: string; color: "blocked" | "risk" | "success"; link: string }[] = [];

    criticalAlerts.proposalWithoutFollowUp.slice(0, 2).forEach(l => {
      tasks.push({
        label: `Follow up - ${l.name}`,
        color: "blocked",
        link: "/admin/leads?status=proposal_sent",
      });
    });

    criticalAlerts.newLeadsNoContact24h.slice(0, 2).forEach(l => {
      tasks.push({
        label: `Resposta Lead - ${l.name}`,
        color: "risk",
        link: "/admin/leads?status=cold_lead",
      });
    });

    criticalAlerts.leadsStalled48h.slice(0, 1).forEach(l => {
      tasks.push({
        label: `Lead parado +48h - ${l.name}`,
        color: "blocked",
        link: "/admin/leads",
      });
    });

    return tasks.slice(0, 4);
  }, [criticalAlerts]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  const weekNumber = getWeek(today);
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 18 ? "Good afternoon" : "Good evening";

  const dotColor = {
    blocked: "bg-[hsl(var(--state-blocked))]",
    risk: "bg-[hsl(var(--state-risk))]",
    success: "bg-[hsl(var(--state-success))]",
  };

  const statusBadge: Record<string, { label: string; className: string }> = {
    confirmed: { label: "Em Andamento", className: "bg-[hsl(var(--state-success-bg))] text-[hsl(var(--state-success))] border-[hsl(var(--state-success)/0.3)]" },
    scheduled: { label: "Agendado", className: "bg-[hsl(var(--state-neutral-bg))] text-[hsl(var(--state-neutral))] border-[hsl(var(--state-neutral)/0.3)]" },
    in_progress: { label: "Em Andamento", className: "bg-[hsl(var(--state-risk-bg))] text-[hsl(var(--state-risk))] border-[hsl(var(--state-neutral)/0.3)]" },
    pending: { label: "Pendente", className: "bg-[hsl(var(--state-neutral-bg))] text-[hsl(var(--state-neutral))] border-[hsl(var(--state-neutral)/0.3)]" },
  };

  const typeLabels: Record<string, string> = {
    measurement: "Medição",
    production: "Produção",
    follow_up: "Follow-up",
    inspection: "Inspeção",
  };

  return (
    <AdminLayout title="" breadcrumbs={[]}>
      <div className="max-w-2xl mx-auto px-1 sm:px-0 pb-10">
        {/* Header bar */}
        <div className="flex items-center justify-center mb-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground text-center">
            Week {weekNumber} &middot; {format(today, "MMM d")}
          </p>
        </div>

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {greeting}, Eduardo
          </h1>
          <p className="text-muted-foreground mt-1">
            You have <span className="font-semibold text-foreground">{appointments.length}</span> job{appointments.length !== 1 ? "s" : ""} scheduled for today
          </p>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="space-y-3 mb-8">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            <SummaryCard
              icon={<DollarSign className="w-4 h-4" />}
              label="Faturas Abertas"
              value={formatCurrency(moneyMetrics.estimatedValueOpen)}
              sub={`+${moneyMetrics.activeLeadsCount} pendentes`}
              subColor="text-[hsl(var(--state-success))]"
            />
            <SummaryCard
              icon={<Briefcase className="w-4 h-4" />}
              label="Jobs Semana"
              value={String(weekAppointments.length)}
              sub={tomorrowCount > 0 ? `+${tomorrowCount} amanhã` : undefined}
              subColor="text-[hsl(var(--state-success))]"
            />
            <SummaryCard
              icon={<Users className="w-4 h-4" />}
              label="Novos Leads"
              value={String(funnelMetrics.cold_lead + funnelMetrics.warm_lead)}
              sub={newLeadsToday > 0 ? `+${newLeadsToday} hoje` : undefined}
              subColor="text-[hsl(var(--state-success))]"
            />
          </div>
        )}

        {/* Priority Tasks */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Tarefas Prioritárias
            </h2>
            <Link to="/admin/leads" className="text-xs font-semibold text-[hsl(var(--gold-warm))] hover:underline">
              Ver todos
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-11 rounded-lg" />)}
            </div>
          ) : priorityTasks.length === 0 ? (
            <div className="text-center py-8 rounded-xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground">Nenhuma tarefa prioritária 🎉</p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-card">
              {priorityTasks.map((task, idx) => (
                <Link
                  key={idx}
                  to={task.link}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/60 transition-colors group"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor[task.color]}`} />
                  <span className="flex-1 text-sm font-medium text-foreground truncate">
                    {task.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Today's Agenda */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Agenda de Hoje
            </h2>
            <Link to="/admin/schedule" className="text-xs font-semibold text-[hsl(var(--gold-warm))] hover:underline">
              Ver agenda
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-8 rounded-xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 4).map((apt) => {
                const badge = statusBadge[apt.status] || statusBadge.pending;
                const endTime = apt.duration_hours
                  ? format(
                      new Date(new Date(`2000-01-01T${apt.appointment_time}`).getTime() + apt.duration_hours * 3600000),
                      "HH:mm"
                    )
                  : null;

                return (
                  <Card key={apt.id} className="rounded-xl overflow-hidden shadow-sm border-border">
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Color strip */}
                        <div className={`w-1 flex-shrink-0 ${
                          apt.status === "confirmed" || apt.status === "in_progress"
                            ? "bg-[hsl(var(--state-success))]"
                            : "bg-[hsl(var(--state-neutral))]"
                        }`} />
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-sm text-foreground leading-tight">
                              {typeLabels[apt.appointment_type] || apt.appointment_type}
                            </h3>
                            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${badge.className}`}>
                              {badge.label}
                            </Badge>
                          </div>
                          {apt.location && (
                            <p className="text-xs text-muted-foreground mb-2">{apt.location}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{apt.appointment_time.slice(0, 5)}{endTime ? ` - ${endTime}` : ""}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

/* Extracted sub-component for the 3 summary cards */
function SummaryCard({
  icon,
  label,
  value,
  sub,
  subColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <Card className="rounded-xl shadow-sm border-border hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1.5">
          {icon}
          <span>{label}</span>
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{value}</p>
        {sub && (
          <p className={`text-xs font-semibold mt-1 ${subColor || "text-muted-foreground"}`}>
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
