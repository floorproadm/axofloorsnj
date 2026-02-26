import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/admin/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { DollarSign, Briefcase, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

import { MetricCard } from "@/components/admin/dashboard/MetricCard";
import { PriorityTasksList } from "@/components/admin/dashboard/PriorityTasksList";
import { AgendaSection } from "@/components/admin/dashboard/AgendaSection";

export default function Dashboard() {
  const { isLoading, moneyMetrics, funnelMetrics, criticalAlerts, slaBreaches, recentFieldUploads, recentSystemActions } =
    useDashboardData();
  const { t } = useLanguage();

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

  const tomorrowCount = weekAppointments.filter(
    (a) => a.appointment_date === tomorrowStr
  ).length;

  const newLeadsToday = criticalAlerts.newLeadsNoContact24h.length;

  const totalUrgent =
    criticalAlerts.proposalWithoutFollowUp.length +
    criticalAlerts.newLeadsNoContact24h.length +
    criticalAlerts.leadsStalled48h.length;

  const priorityTasks = useMemo(() => {
    const tasks: {
      label: string;
      color: "blocked" | "risk" | "success";
      link: string;
      type: "follow_up" | "new_lead" | "stalled" | "field_upload" | "sla_followup" | "sla_estimate" | "sla_auto_escalation";
    }[] = [];

    // System auto-escalations (24h)
    if (recentSystemActions.length > 0) {
      tasks.push({
        label: `${recentSystemActions.length} escalações automáticas (24h)`,
        color: "risk",
        link: "/admin/leads",
        type: "sla_auto_escalation",
      });
    }

    // SLA breaches first (highest priority)
    if (slaBreaches.followupOverdue.count > 0) {
      tasks.push({
        label: `${slaBreaches.followupOverdue.count} follow-ups atrasados`,
        color: "blocked",
        link: "/admin/leads?status=proposal_sent",
        type: "sla_followup",
      });
    }

    if (slaBreaches.estimateStale.count > 0) {
      tasks.push({
        label: `${slaBreaches.estimateStale.count} estimates parados > 3 dias`,
        color: "risk",
        link: "/admin/leads?status=estimate_scheduled",
        type: "sla_estimate",
      });
    }

    // Field uploads
    if (recentFieldUploads.length > 0) {
      tasks.push({
        label: `${recentFieldUploads.length} uploads recentes do campo`,
        color: "success",
        link: "/admin/jobs",
        type: "field_upload",
      });
    }

    criticalAlerts.proposalWithoutFollowUp.slice(0, 2).forEach((l) => {
      tasks.push({
        label: `Follow up – ${l.name}`,
        color: "blocked",
        link: "/admin/leads?status=proposal_sent",
        type: "follow_up",
      });
    });

    criticalAlerts.newLeadsNoContact24h.slice(0, 2).forEach((l) => {
      tasks.push({
        label: `${t("dashboard.respostaLead")} – ${l.name}`,
        color: "risk",
        link: "/admin/leads?status=cold_lead",
        type: "new_lead",
      });
    });

    criticalAlerts.leadsStalled48h.slice(0, 1).forEach((l) => {
      tasks.push({
        label: `${t("dashboard.leadParado48h")} – ${l.name}`,
        color: "blocked",
        link: "/admin/leads",
        type: "stalled",
      });
    });

    return tasks.slice(0, 7);
  }, [criticalAlerts, slaBreaches, recentFieldUploads, recentSystemActions, t]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  const greeting = (() => {
    const h = today.getHours();
    if (h < 12) return t("dashboard.goodMorning");
    if (h < 18) return t("dashboard.goodAfternoon");
    return t("dashboard.goodEvening");
  })();

  return (
    <AdminLayout title="" breadcrumbs={[]}>
      <div className="max-w-2xl mx-auto px-1 sm:px-0 pb-10">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {greeting}, Eduardo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {appointments.length > 0 ? (
              <>
                <span className="font-semibold text-foreground">
                  {appointments.length}
                </span>{" "}
                {t("dashboard.jobsHoje")}
              </>
            ) : (
              t("dashboard.semJobsHoje")
            )}
            {totalUrgent > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-[hsl(var(--state-risk))]">
                  {totalUrgent} {totalUrgent !== 1 ? t("dashboard.acoesPendentes") : t("dashboard.acaoPendente")}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Metric Cards */}
        {isLoading ? (
          <div className="flex gap-3 mb-8 overflow-x-auto pb-1 scrollbar-hide">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[88px] min-w-[160px] flex-1 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 mb-8 overflow-x-auto pb-1 scrollbar-hide">
            <MetricCard
              icon={<DollarSign className="w-4 h-4" />}
              label="Pipeline"
              value={formatCurrency(moneyMetrics.estimatedValueOpen)}
              sub={
                moneyMetrics.activeLeadsCount > 0
                  ? `${moneyMetrics.activeLeadsCount} ${t("dashboard.leadsAtivos")}`
                  : undefined
              }
              subColor="text-[hsl(var(--state-success))]"
              accent={moneyMetrics.estimatedValueOpen > 0 ? "success" : "default"}
              className="flex-1"
            />
            <MetricCard
              icon={<Briefcase className="w-4 h-4" />}
              label={t("dashboard.semana")}
              value={String(weekAppointments.length)}
              sub={
                tomorrowCount > 0
                  ? `+${tomorrowCount} ${t("dashboard.amanha")}`
                  : undefined
              }
              subColor="text-[hsl(var(--state-success))]"
              className="flex-1"
            />
            <MetricCard
              icon={<Users className="w-4 h-4" />}
              label="Leads"
              value={String(funnelMetrics.cold_lead + funnelMetrics.warm_lead)}
              sub={
                newLeadsToday > 0
                  ? `${newLeadsToday} ${t("dashboard.semContato")}`
                  : undefined
              }
              subColor="text-[hsl(var(--state-risk))]"
              accent={newLeadsToday > 0 ? "risk" : "default"}
              className="flex-1"
            />
          </div>
        )}

        {/* Priority Tasks */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("dashboard.acoesUrgentes")}
              {totalUrgent > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[hsl(var(--state-blocked))] text-white text-[10px] font-bold align-middle">
                  {totalUrgent}
                </span>
              )}
            </h2>
            <Link
              to="/admin/leads"
              className="text-xs font-semibold text-[hsl(var(--gold-warm))] hover:underline"
            >
              {t("dashboard.verTodos")}
            </Link>
          </div>
          <PriorityTasksList tasks={priorityTasks} isLoading={isLoading} />
        </section>

        {/* Today's Agenda */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("dashboard.agendaDeHoje")}
            </h2>
            <Link
              to="/admin/schedule"
              className="text-xs font-semibold text-[hsl(var(--gold-warm))] hover:underline"
            >
              {t("dashboard.verAgenda")}
            </Link>
          </div>
          <AgendaSection appointments={appointments} />
        </section>
      </div>
    </AdminLayout>
  );
}
