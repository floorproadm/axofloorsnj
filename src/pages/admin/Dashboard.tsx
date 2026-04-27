import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/admin/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, addDays, formatDistance } from "date-fns";
import { DollarSign, Briefcase, Users, FileText, UserPlus, Send, CreditCard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

import { MetricCard } from "@/components/admin/dashboard/MetricCard";
import { AgendaSection } from "@/components/admin/dashboard/AgendaSection";

const DAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const DAY_LABELS_EN = ["S", "M", "T", "W", "T", "F", "S"];

export default function Dashboard() {
  const { isLoading, moneyMetrics, funnelMetrics, criticalAlerts, slaBreaches, recentFieldUploads, recentSystemActions } =
    useDashboardData();
  const { t, language } = useLanguage();

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

  // 4th MetricCard: Proposals count
  const { data: proposalsData } = useQuery({
    queryKey: ["dashboard-proposals-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("id, status")
        .in("status", ["draft", "sent"]);
      if (error) throw error;
      return data || [];
    },
  });

  const openProposals = proposalsData?.length ?? 0;
  const sentProposals = proposalsData?.filter((p) => p.status === "sent").length ?? 0;

  // Recent Activity feed
  const { data: recentActivity = [] } = useQuery({
    queryKey: ["dashboard-recent-activity"],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const [leadsRes, proposalsRes, paymentsRes] = await Promise.all([
        supabase
          .from("leads")
          .select("id, name, created_at")
          .gte("created_at", cutoff)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("proposals")
          .select("id, proposal_number, sent_at")
          .not("sent_at", "is", null)
          .gte("sent_at", cutoff)
          .order("sent_at", { ascending: false })
          .limit(5),
        supabase
          .from("payments")
          .select("id, description, amount, created_at")
          .eq("category", "received")
          .eq("status", "confirmed")
          .gte("created_at", cutoff)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const items: { type: "lead" | "proposal" | "payment"; label: string; date: string; link: string }[] = [];

      (leadsRes.data || []).forEach((l) =>
        items.push({ type: "lead", label: l.name, date: l.created_at, link: `/admin/leads` })
      );
      (proposalsRes.data || []).forEach((p) =>
        items.push({ type: "proposal", label: `#${p.proposal_number}`, date: p.sent_at!, link: `/admin/proposals` })
      );
      (paymentsRes.data || []).forEach((p) =>
        items.push({
          type: "payment",
          label: p.description || `$${p.amount}`,
          date: p.created_at,
          link: `/admin/payments`,
        })
      );

      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
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

  // Mission Control panel moved to /admin/mission-control — Home only shows entry banner.

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

  // Week calendar data
  const weekDays = useMemo(() => {
    const labels = language === "en" ? DAY_LABELS_EN : DAY_LABELS;
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i);
      const dateStr = format(day, "yyyy-MM-dd");
      const hasAppointments = weekAppointments.some((a) => a.appointment_date === dateStr);
      const isToday = dateStr === todayStr;
      return { label: labels[i], dateStr, hasAppointments, isToday, dayNum: format(day, "d") };
    });
  }, [weekStart, weekAppointments, todayStr, language]);

  const activityIcon = (type: "lead" | "proposal" | "payment") => {
    switch (type) {
      case "lead":
        return <UserPlus className="w-3.5 h-3.5 text-[hsl(var(--state-success))]" />;
      case "proposal":
        return <Send className="w-3.5 h-3.5 text-[hsl(var(--gold-warm))]" />;
      case "payment":
        return <CreditCard className="w-3.5 h-3.5 text-[hsl(var(--state-success))]" />;
    }
  };

  const activityLabel = (type: "lead" | "proposal" | "payment") => {
    switch (type) {
      case "lead":
        return t("dashboard.novoLead");
      case "proposal":
        return t("dashboard.propostaEnviada");
      case "payment":
        return t("dashboard.pagamentoRecebido");
    }
  };

  return (
    <AdminLayout title="" breadcrumbs={[]}>
      <div className="max-w-2xl lg:max-w-5xl mx-auto px-1 sm:px-0 pb-10">
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

        {/* Metric Cards — 4 cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[88px] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
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
            />
            <MetricCard
              icon={<FileText className="w-4 h-4" />}
              label={t("dashboard.proposals")}
              value={String(openProposals)}
              sub={
                sentProposals > 0
                  ? `${sentProposals} sent`
                  : undefined
              }
              subColor="text-[hsl(var(--gold-warm))]"
              accent={openProposals > 0 ? "success" : "default"}
            />
          </div>
        )}

        {/* Mission Control entry point — full panel moved to /admin/mission-control */}
        {totalUrgent > 0 && (
          <section className="mb-8">
            <Link
              to="/admin/mission-control"
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[hsl(var(--state-risk))]/30 bg-[hsl(var(--state-risk-bg))] hover:bg-[hsl(var(--state-risk-bg))]/80 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[hsl(var(--state-risk))] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-base font-bold">{totalUrgent}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Mission Control</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {totalUrgent} {totalUrgent !== 1 ? t("dashboard.acoesPendentes") : t("dashboard.acaoPendente")}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[hsl(var(--gold-warm))] group-hover:underline flex-shrink-0">
                {t("dashboard.verTodos")} →
              </span>
            </Link>
          </section>
        )}

        {/* Today's Agenda with mini week calendar */}
        <section className="mb-8">
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

          {/* Mini week calendar */}
          <div className="flex gap-1.5 mb-4">
            {weekDays.map((d) => (
              <div
                key={d.dateStr}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg transition-colors",
                  d.isToday
                    ? "bg-accent text-accent-foreground"
                    : "bg-card text-muted-foreground"
                )}
              >
                <span className="text-[10px] font-semibold uppercase">{d.label}</span>
                <span className={cn(
                  "text-sm font-bold",
                  d.isToday ? "text-foreground" : "text-foreground/70"
                )}>
                  {d.dayNum}
                </span>
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    d.hasAppointments
                      ? "bg-[hsl(var(--state-success))]"
                      : "bg-transparent"
                  )}
                />
              </div>
            ))}
          </div>

          <AgendaSection appointments={appointments} />
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("dashboard.atividadeRecente")}
            </h2>
            <Link
              to="/admin/leads"
              className="text-xs font-semibold text-[hsl(var(--gold-warm))] hover:underline"
            >
              {t("dashboard.verTudo")}
            </Link>
          </div>

          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {t("dashboard.semAtividade")}
              </p>
            ) : (
              recentActivity.map((item, i) => (
                <Link key={i} to={item.link} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {activityIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activityLabel(item.type)} — {item.label}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0">
                    {formatDistance(new Date(item.date), today, {
                      addSuffix: true,
                    })}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
