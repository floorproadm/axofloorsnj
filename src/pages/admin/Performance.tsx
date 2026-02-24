import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { DollarSign, Briefcase, TrendingUp, Users, Clock, CheckCircle2 } from "lucide-react";
import { useDashboardData } from "@/hooks/admin/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export default function Performance() {
  const { performanceMetrics: m, isLoading } = useDashboardData();

  const conversionColor = m.conversionRate >= 30
    ? "text-emerald-600"
    : m.conversionRate >= 15
    ? "text-amber-600"
    : "text-red-600";

  const cards = [
    {
      title: "Receita Total",
      value: `$${m.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
      subtitle: `Lucro: $${m.totalProfit.toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
      icon: DollarSign,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Jobs Concluídos",
      value: m.completedCount.toString(),
      subtitle: `${m.inProductionCount} em produção`,
      icon: CheckCircle2,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Taxa de Conversão",
      value: `${m.conversionRate.toFixed(1)}%`,
      subtitle: `${m.recentLeadsCount} leads (30d)`,
      icon: TrendingUp,
      iconBg: m.conversionRate >= 30 ? "bg-emerald-100" : m.conversionRate >= 15 ? "bg-amber-100" : "bg-red-100",
      iconColor: conversionColor,
      valueColor: conversionColor,
    },
    {
      title: "Margem Média",
      value: `${(m.avgMargin ?? 0).toFixed(1)}%`,
      subtitle: "Sobre todos os projetos",
      icon: Briefcase,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Total de Leads",
      value: m.totalLeads.toString(),
      subtitle: `${m.recentLeadsCount} nos últimos 30 dias`,
      icon: Users,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: "Ciclo Médio",
      value: `${Math.round(m.avgCycleTime)}d`,
      subtitle: "Início → Conclusão",
      icon: Clock,
      iconBg: "bg-sky-100",
      iconColor: "text-sky-600",
    },
  ];

  return (
    <AdminLayout title="Performance">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Visão Geral</h2>
          <p className="text-sm text-muted-foreground">Métricas consolidadas de receita, operação e conversão.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[100px] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <Card key={card.title} className="p-5 flex items-start gap-4 border-border/50">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.iconBg}`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">{card.title}</p>
                  <p className={`text-2xl font-bold mt-0.5 ${'valueColor' in card ? card.valueColor : "text-foreground"}`}>
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
