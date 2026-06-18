import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/admin/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, addDays, formatDistance } from "date-fns";
import { DollarSign, Hammer, Users, FileText, UserPlus, Send, CreditCard, TrendingUp, TrendingDown, Percent, FileWarning, Plus, AlertTriangle, Clock as ClockIcon, MessageSquare } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

import { MetricCard } from "@/components/admin/dashboard/MetricCard";
import { AgendaSection } from "@/components/admin/dashboard/AgendaSection";
import {
  mcAlertKey,
  readMcDismissed,
  MC_DISMISSED_EVENT,
} from "@/lib/missionControlDismissed";

const DAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const DAY_LABELS_EN = ["S", "M", "T", "W", "T", "F", "S"];

export default function Dashboard() {
  const { isLoading, moneyMetrics, funnelMetrics, criticalAlerts, slaBreaches, recentFieldUploads, recentSystemActions, executionMetrics } =
    useDashboardData();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const userName =
    (user?.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ||
    (user?.user_metadata as { name?: string } | undefined)?.name ||
    user?.email?.split("@")[0] ||
    "";

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

  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const { data: weekAppointments = [] } = useQuery({
    queryKey: ["dashboard-week-appointments-full", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .gte("appointment_date", format(weekStart, "yyyy-MM-dd"))
        .lte("appointment_date", format(weekEnd, "yyyy-MM-dd"))
        .order("appointment_time", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const selectedDayAppointments = useMemo(
    () => weekAppointments.filter((a: any) => a.appointment_date === selectedDateStr),
    [weekAppointments, selectedDateStr]
  );

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

  // Row 2 — Financial Health (this month)
  const { data: financialHealth } = useQuery({
    queryKey: ["dashboard-financial-health"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      const todayStrISO = now.toISOString().slice(0, 10);

      const [thisMonthPay, prevMonthPay, completedJobs, unpaidInv, settings] = await Promise.all([
        supabase.from("payments").select("amount, description")
          .eq("category", "received").eq("status", "confirmed")
          .gte("payment_date", monthStart).lte("payment_date", todayStrISO),
        supabase.from("payments").select("amount, description")
          .eq("category", "received").eq("status", "confirmed")
          .gte("payment_date", prevMonthStart).lte("payment_date", prevMonthEnd),
        supabase.from("projects").select("id, project_status, completion_date, updated_at")
          .eq("project_status", "completed")
          .gte("updated_at", monthStart),
        supabase.from("invoices").select("id, total_amount, status")
          .not("status", "in", "(paid,cancelled,void)"),
        supabase.from("company_settings").select("default_margin_min_percent").maybeSingle(),
      ]);

      const sum = (rows: any[]) => (rows || []).reduce((s, r) => s + Number(r.amount || 0), 0);
      const revenue = sum(thisMonthPay.data || []);
      const prevRevenue = sum(prevMonthPay.data || []);
      const revenueDelta = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : null;

      let avgMargin: number | null = null;
      const completedIds = (completedJobs.data || []).map((p: any) => p.id);
      if (completedIds.length > 0) {
        const { data: jc } = await supabase
          .from("job_costs")
          .select("margin_percent, project_id")
          .in("project_id", completedIds);
        const vals = (jc || []).map((j: any) => Number(j.margin_percent)).filter((n) => !Number.isNaN(n));
        if (vals.length > 0) avgMargin = vals.reduce((a, b) => a + b, 0) / vals.length;
      }

      const unpaid = unpaidInv.data || [];
      const unpaidTotal = unpaid.reduce((s, i: any) => s + Number(i.total_amount || 0), 0);

      return {
        revenue,
        revenueDelta,
        avgMargin,
        minMargin: Number((settings.data as any)?.default_margin_min_percent ?? 30),
        unpaidCount: unpaid.length,
        unpaidTotal,
      };
    },
  });

  // Recent Activity feed
  const { data: recentActivity = [] } = useQuery({
    queryKey: ["dashboard-recent-activity"],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

      const [leadsRes, proposalsRes, paymentsRes] = await Promise.all([
        supabase
          .from("leads")
          .select("id, name, created_at")
          .is('deleted_at', null)
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

      const items: { type: "lead" | "proposal" | "payment" | "job"; label: string; date: string; link: string; amount?: number }[] = [];

      (leadsRes.data || []).forEach((l) =>
        items.push({ type: "lead", label: l.name, date: l.created_at, link: `/admin/leads` })
      );
      (proposalsRes.data || []).forEach((p) =>
        items.push({ type: "proposal", label: `#${p.proposal_number}`, date: p.sent_at!, link: `/admin/proposals` })
      );
      (paymentsRes.data || []).forEach((p) =>
        items.push({
          type: "payment",
          label: p.description || "Pagamento",
          date: p.created_at,
          link: `/admin/payments`,
          amount: Number(p.amount || 0),
        })
      );

      return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
    },
  });

  const tomorrowCount = weekAppointments.filter(
    (a) => a.appointment_date === tomorrowStr
  ).length;

  const newLeadsToday = criticalAlerts.newLeadsNoContact24h.length;

  // Mirror Mission Control's dismissed alerts so the home counter
  // disappears when the user clears items there.
  const [dismissed, setDismissed] = useState<string[]>(() => readMcDismissed());
  useEffect(() => {
    const onChange = () => setDismissed(readMcDismissed());
    window.addEventListener(MC_DISMISSED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(MC_DISMISSED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const criticalAlertEntries = useMemo(
    () => [
      ...criticalAlerts.proposalWithoutFollowUp.map((l) => ({
        type: "follow_up",
        label: `${t("mission.alerts.followUp")} – ${l.name}`,
        entityId: l.id,
      })),
      ...criticalAlerts.newLeadsNoContact24h.map((l) => ({
        type: "new_lead",
        label: `${t("dashboard.respostaLead")} – ${l.name}`,
        entityId: l.id,
      })),
      ...criticalAlerts.leadsStalled48h.map((l) => ({
        type: "stalled",
        label: `${t("dashboard.leadParado48h")} – ${l.name}`,
        entityId: l.id,
      })),
    ],
    [criticalAlerts, t]
  );

  const totalUrgent = criticalAlertEntries.filter(
    (a) => !dismissed.includes(mcAlertKey(a))
  ).length;

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

  const activityIcon = (type: "lead" | "proposal" | "payment" | "job") => {
    switch (type) {
      case "lead":
        return <UserPlus className="w-3.5 h-3.5 text-[hsl(var(--state-success))]" />;
      case "proposal":
        return <Send className="w-3.5 h-3.5 text-[hsl(var(--gold-warm))]" />;
      case "payment":
        return <CreditCard className="w-3.5 h-3.5 text-[hsl(var(--state-success))]" />;
      case "job":
        return <Hammer className="w-3.5 h-3.5 text-primary" />;
    }
  };

  const activityLabel = (type: "lead" | "proposal" | "payment" | "job") => {
    switch (type) {
      case "lead":
        return t("dashboard.novoLead");
      case "proposal":
        return t("dashboard.propostaEnviada");
      case "payment":
        return t("dashboard.pagamentoRecebido");
      case "job":
        return "Job";
    }
  };

  return (
    <AdminLayout title="" breadcrumbs={[]}>
      <div className="max-w-2xl lg:max-w-5xl mx-auto px-1 sm:px-0 pb-10">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {greeting}{userName ? `, ${userName}` : ""}
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
                <Link
                  to="/admin/mission-control"
                  className="font-semibold text-[hsl(var(--state-risk))] hover:underline underline-offset-2"
                >
                  {totalUrgent} {totalUrgent !== 1 ? t("dashboard.acoesPendentes") : t("dashboard.acaoPendente")}
                </Link>
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
              to="/admin/projects"
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
              to="/admin/projects"
              icon={<Hammer className="w-4 h-4" />}
              label="Em Produção"
              value={String(executionMetrics.jobsInProduction)}
              sub={
                executionMetrics.jobsInProduction > 0
                  ? `${executionMetrics.jobsInProduction} ativos`
                  : undefined
              }
              subColor="text-[hsl(var(--state-success))]"
              accent={executionMetrics.jobsInProduction > 0 ? "success" : "default"}
            />
            <MetricCard
              to="/admin/leads"
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
              to="/admin/proposals"
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

        {/* Row 2 — Saúde Financeira do Mês */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Saúde Financeira do Mês
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Receita do Mês */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Receita do Mês
                </span>
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-none">
                {formatCurrency(financialHealth?.revenue ?? 0)}
              </p>
              {financialHealth?.revenueDelta !== null && financialHealth?.revenueDelta !== undefined ? (
                <p
                  className={cn(
                    "text-[11px] font-semibold mt-1.5 flex items-center gap-1",
                    financialHealth.revenueDelta >= 0
                      ? "text-[hsl(var(--state-success))]"
                      : "text-[hsl(var(--state-blocked))]"
                  )}
                >
                  {financialHealth.revenueDelta >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {financialHealth.revenueDelta >= 0 ? "+" : ""}
                  {financialHealth.revenueDelta.toFixed(1)}% vs mês anterior
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-1.5">— vs mês anterior</p>
              )}
            </div>

            {/* Margem Média */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Margem Média
                </span>
                <Percent className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-none">
                {financialHealth?.avgMargin != null ? `${financialHealth.avgMargin.toFixed(1)}%` : "—"}
              </p>
              {financialHealth?.avgMargin != null &&
              financialHealth.avgMargin < financialHealth.minMargin ? (
                <p className="text-[11px] font-semibold mt-1.5 flex items-center gap-1 text-[hsl(var(--gold-warm))]">
                  <AlertTriangle className="w-3 h-3" />
                  Abaixo do mínimo {financialHealth.minMargin}%
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Mínimo {financialHealth?.minMargin ?? 30}% (projetos concluídos)
                </p>
              )}
            </div>

            {/* Faturas em Aberto */}
            <Link
              to="/admin/payments?tab=invoices&filter=unpaid"
              className="bg-card rounded-xl border border-border shadow-sm p-4 hover:shadow-md hover:border-primary/40 transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Faturas em Aberto
                </span>
                <FileWarning className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-none">
                {financialHealth?.unpaidCount ?? 0}
              </p>
              <p className="text-[11px] font-semibold mt-1.5 text-[hsl(var(--state-risk))]">
                {formatCurrency(financialHealth?.unpaidTotal ?? 0)} pendente
              </p>
            </Link>
          </div>
        </section>

        {/* Today's Agenda with mini week calendar */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Próximas 48h
            </h2>
            <Link
              to="/admin/schedule"
              className="text-xs font-semibold text-[hsl(var(--state-risk))] hover:underline"
            >
              {t("dashboard.verAgenda")}
            </Link>
          </div>

          {/* Mini week calendar — interactive */}
          <div className="flex gap-1.5 mb-4">
            {weekDays.map((d) => {
              const isSelected = d.dateStr === selectedDateStr;
              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setSelectedDateStr(d.dateStr)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg transition-colors focus:outline-none",
                    isSelected
                      ? "bg-primary text-primary-foreground ring-1 ring-primary"
                      : d.isToday
                      ? "bg-[hsl(var(--state-risk-bg))] text-[hsl(var(--state-risk))] ring-1 ring-[hsl(var(--state-risk)/0.3)]"
                      : "bg-card text-muted-foreground hover:bg-secondary/60"
                  )}
                >
                  <span className="text-[10px] font-semibold uppercase">{d.label}</span>
                  <span className={cn(
                    "text-sm font-bold",
                    isSelected ? "text-primary-foreground" : d.isToday ? "text-foreground" : "text-foreground/70"
                  )}>
                    {d.dayNum}
                  </span>
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      d.hasAppointments
                        ? isSelected
                          ? "bg-primary-foreground"
                          : "bg-[hsl(var(--state-success))]"
                        : "bg-transparent"
                    )}
                  />
                </button>
              );
            })}
          </div>

          {selectedDayAppointments.length > 0 ? (
            <div className="space-y-2">
              {selectedDayAppointments.slice(0, 5).map((apt: any) => (
                <Link
                  key={apt.id}
                  to="/admin/schedule"
                  className="block bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {apt.location || apt.customer_name || "Job"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {apt.appointment_type ? `${apt.appointment_type} · ` : ""}
                        {apt.customer_name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-foreground">
                        {apt.appointment_time ? apt.appointment_time.slice(0, 5) : "Dia inteiro"}
                      </p>
                      {apt.assigned_to && Array.isArray(apt.assigned_to) && apt.assigned_to.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {apt.assigned_to.length} técnico{apt.assigned_to.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              {selectedDayAppointments.length > 5 && (
                <Link
                  to="/admin/schedule"
                  className="block text-center text-xs font-semibold text-[hsl(var(--gold-warm))] hover:underline py-2"
                >
                  +{selectedDayAppointments.length - 5} mais →
                </Link>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-card/50 px-4 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">Dia livre</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sem jobs agendados para esta data
                </p>
              </div>
              <Link
                to="/admin/schedule"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Agendar job
              </Link>
            </div>
          )}
        </section>


        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("dashboard.atividadeRecente")}
            </h2>
            <Link
              to="/admin/leads"
              className="text-xs font-semibold text-[hsl(var(--state-risk))] hover:underline"
            >
              {t("dashboard.verTudo")}
            </Link>
          </div>

          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {recentActivity.length === 0 ? (
              criticalAlertEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t("dashboard.semAtividade")}
                </p>
              ) : (
                criticalAlertEntries.slice(0, 3).map((alert, i) => {
                  const Icon =
                    alert.type === "follow_up"
                      ? MessageSquare
                      : alert.type === "new_lead"
                      ? ClockIcon
                      : AlertTriangle;
                  return (
                    <Link
                      key={`mc-${i}`}
                      to="/admin/mission-control"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-[hsl(var(--state-risk-bg))] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-[hsl(var(--state-risk))]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{alert.label}</p>
                        <p className="text-[10px] text-muted-foreground">Mission Control</p>
                      </div>
                      <span className="text-[11px] font-semibold text-[hsl(var(--state-risk))] flex-shrink-0">
                        Ver
                      </span>
                    </Link>
                  );
                })
              )
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
                  {item.amount != null && item.amount > 0 && (
                    <span className="text-[11px] font-semibold text-[hsl(var(--state-success))] flex-shrink-0">
                      {formatCurrency(item.amount)}
                    </span>
                  )}
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
