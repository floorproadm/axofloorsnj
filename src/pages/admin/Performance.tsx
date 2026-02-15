import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { DollarSign, Briefcase, TrendingUp, Users, Clock, CheckCircle2 } from "lucide-react";
import { subDays, format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Performance() {
  const now = new Date();
  const thirtyDaysAgo = format(subDays(now, 30), "yyyy-MM-dd");

  // Fetch projects for revenue & jobs metrics
  const { data: projects = [] } = useQuery({
    queryKey: ["perf-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, project_status, estimated_cost, actual_cost, created_at, start_date, completion_date")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch leads for conversion metrics
  const { data: leads = [] } = useQuery({
    queryKey: ["perf-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, status, created_at, converted_to_project_id");
      if (error) throw error;
      return data;
    },
  });

  // Fetch job costs for revenue
  const { data: jobCosts = [] } = useQuery({
    queryKey: ["perf-job-costs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_costs")
        .select("project_id, estimated_revenue, total_cost, profit_amount, margin_percent");
      if (error) throw error;
      return data;
    },
  });

  const metrics = useMemo(() => {
    const completedProjects = projects.filter(p => p.project_status === "completed");
    const inProductionProjects = projects.filter(p => p.project_status === "in_production");
    const recentLeads = leads.filter(l => l.created_at >= thirtyDaysAgo);
    const convertedLeads = leads.filter(l => l.converted_to_project_id !== null);
    const recentConverted = recentLeads.filter(l => l.converted_to_project_id !== null);

    const totalRevenue = jobCosts.reduce((sum, jc) => sum + (Number(jc.estimated_revenue) || 0), 0);
    const totalProfit = jobCosts.reduce((sum, jc) => sum + (Number(jc.profit_amount) || 0), 0);
    const avgMargin = jobCosts.length > 0
      ? jobCosts.reduce((sum, jc) => sum + (Number(jc.margin_percent) || 0), 0) / jobCosts.length
      : 0;

    const conversionRate = recentLeads.length > 0
      ? (recentConverted.length / recentLeads.length) * 100
      : 0;

    const avgCycleTime = completedProjects.length > 0
      ? completedProjects.reduce((sum, p) => {
          if (p.start_date && p.completion_date) {
            return sum + differenceInDays(parseISO(p.completion_date), parseISO(p.start_date));
          }
          return sum;
        }, 0) / completedProjects.filter(p => p.start_date && p.completion_date).length || 0
      : 0;

    return {
      totalRevenue,
      totalProfit,
      avgMargin,
      completedCount: completedProjects.length,
      inProductionCount: inProductionProjects.length,
      totalLeads: leads.length,
      recentLeadsCount: recentLeads.length,
      conversionRate,
      avgCycleTime: Math.round(avgCycleTime),
    };
  }, [projects, leads, jobCosts, thirtyDaysAgo]);

  const conversionColor = metrics.conversionRate >= 30
    ? "text-emerald-600"
    : metrics.conversionRate >= 15
    ? "text-amber-600"
    : "text-red-600";

  const cards = [
    {
      title: "Receita Total",
      value: `$${metrics.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
      subtitle: `Lucro: $${metrics.totalProfit.toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
      icon: DollarSign,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Jobs Concluídos",
      value: metrics.completedCount.toString(),
      subtitle: `${metrics.inProductionCount} em produção`,
      icon: CheckCircle2,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Taxa de Conversão",
      value: `${metrics.conversionRate.toFixed(1)}%`,
      subtitle: `${metrics.recentLeadsCount} leads (30d)`,
      icon: TrendingUp,
      iconBg: metrics.conversionRate >= 30 ? "bg-emerald-100" : metrics.conversionRate >= 15 ? "bg-amber-100" : "bg-red-100",
      iconColor: conversionColor,
      valueColor: conversionColor,
    },
    {
      title: "Margem Média",
      value: `${metrics.avgMargin.toFixed(1)}%`,
      subtitle: "Sobre todos os projetos",
      icon: Briefcase,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Total de Leads",
      value: metrics.totalLeads.toString(),
      subtitle: `${metrics.recentLeadsCount} nos últimos 30 dias`,
      icon: Users,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: "Ciclo Médio",
      value: `${metrics.avgCycleTime}d`,
      subtitle: "Início → Conclusão",
      icon: Clock,
      iconBg: "bg-sky-100",
      iconColor: "text-sky-600",
    },
  ];

  return (
    <AdminLayout title="Performance">
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Visão Geral</h2>
          <p className="text-sm text-muted-foreground">Métricas consolidadas de receita, operação e conversão.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card key={card.title} className="p-5 flex items-start gap-4 border-border/50">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.iconBg}`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">{card.title}</p>
                <p className={`text-2xl font-bold mt-0.5 ${(card as any).valueColor || "text-foreground"}`}>
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
