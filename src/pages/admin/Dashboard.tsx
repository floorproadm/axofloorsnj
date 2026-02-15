import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/admin/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, getWeek, isToday, parseISO, startOfWeek, endOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DollarSign,
  Briefcase,
  Users,
  Clock,
  Bell,
  ChevronRight,
  CalendarDays,
  MapPin
} from "lucide-react";

export default function Dashboard() {
  const {
    isLoading,
    moneyMetrics,
    funnelMetrics,
    criticalAlerts,
    executionMetrics,
  } = useDashboardData();

  // Fetch today's appointments
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

  // Fetch this week's job count
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

  // New leads today count
  const newLeadsToday = useMemo(() => {
    return criticalAlerts.newLeadsNoContact24h.length;
  }, [criticalAlerts]);

  // Priority tasks from critical alerts
  const priorityTasks = useMemo(() => {
    const tasks: { label: string; time?: string; color: string; link: string }[] = [];

    criticalAlerts.proposalWithoutFollowUp.slice(0, 2).forEach(l => {
      tasks.push({
        label: `Follow up - ${l.name}`,
        color: "bg-red-500",
        link: "/admin/leads?status=proposal_sent",
      });
    });

    criticalAlerts.newLeadsNoContact24h.slice(0, 2).forEach(l => {
      tasks.push({
        label: `Resposta Lead - ${l.name}`,
        color: "bg-amber-500",
        link: "/admin/leads?status=cold_lead",
      });
    });

    criticalAlerts.leadsStalled48h.slice(0, 1).forEach(l => {
      tasks.push({
        label: `Lead parado +48h - ${l.name}`,
        color: "bg-red-500",
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

  const statusColors: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700",
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    pending: "bg-gray-100 text-gray-700",
  };

  const typeLabels: Record<string, string> = {
    measurement: "Medição",
    production: "Produção",
    follow_up: "Follow-up",
    inspection: "Inspeção",
  };

  return (
    <AdminLayout title="" breadcrumbs={[]}>
      <div className="max-w-lg mx-auto space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">
            Week {weekNumber} | {format(today, "MMM d")}
          </span>
          <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {priorityTasks.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{greeting}, Eduardo</h1>
          <p className="text-muted-foreground text-sm">
            You have {appointments.length} job{appointments.length !== 1 ? "s" : ""} scheduled for today
          </p>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[88px] rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Faturas Abertas */}
            <Card className="rounded-xl border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span>Faturas Abertas</span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(moneyMetrics.estimatedValueOpen)}
                </p>
                <p className="text-sm text-blue-600 font-medium mt-0.5">
                  +{moneyMetrics.activeLeadsCount} pendentes
                </p>
              </CardContent>
            </Card>

            {/* Jobs Semana */}
            <Card className="rounded-xl border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Briefcase className="w-4 h-4" />
                  <span>Jobs Semana</span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {weekAppointments.length}
                </p>
                {tomorrowCount > 0 && (
                  <p className="text-sm text-green-600 font-medium mt-0.5">
                    +{tomorrowCount} amanhã
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Novos Leads */}
            <Card className="rounded-xl border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Users className="w-4 h-4" />
                  <span>Novos Leads</span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {funnelMetrics.cold_lead + funnelMetrics.warm_lead}
                </p>
                {newLeadsToday > 0 && (
                  <p className="text-sm text-green-600 font-medium mt-0.5">
                    +{newLeadsToday} hoje
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tarefas Prioritárias */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">Tarefas Prioritárias</h2>
            <Link to="/admin/leads" className="text-sm text-blue-600 font-medium hover:underline">
              Ver todos
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : priorityTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma tarefa prioritária 🎉
            </p>
          ) : (
            <div className="space-y-1">
              {priorityTasks.map((task, idx) => (
                <Link
                  key={idx}
                  to={task.link}
                  className="flex items-center gap-3 py-3 px-1 hover:bg-muted/50 rounded-lg transition-colors group"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${task.color} flex-shrink-0`} />
                  <span className="flex-1 text-sm text-foreground truncate">{task.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Agenda de Hoje */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">Agenda de Hoje</h2>
            <Link to="/admin/schedule" className="text-sm text-blue-600 font-medium hover:underline">
              Ver agenda
            </Link>
          </div>

          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum agendamento para hoje
            </p>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 4).map((apt) => (
                <Card key={apt.id} className="rounded-xl border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-sm text-foreground">
                        {typeLabels[apt.appointment_type] || apt.appointment_type} - {apt.customer_name}
                      </h3>
                      <Badge
                        className={`text-xs capitalize ${statusColors[apt.status] || "bg-gray-100 text-gray-700"}`}
                        variant="secondary"
                      >
                        {apt.status === "confirmed" ? "Em Andamento" : apt.status === "scheduled" ? "Agendado" : apt.status}
                      </Badge>
                    </div>
                    {apt.location && (
                      <p className="text-xs text-muted-foreground mb-1.5">{apt.location}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {apt.appointment_time.slice(0, 5)}
                          {apt.duration_hours ? ` - ${format(
                            new Date(`2000-01-01T${apt.appointment_time}`).getTime() + (apt.duration_hours * 60 * 60 * 1000),
                            "HH:mm"
                          )}` : ""}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
