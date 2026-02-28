import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatsCardsGrid } from "@/components/admin/StatsCards";
import { DollarSign, Briefcase, Users, TrendingUp } from "lucide-react";
import { useDashboardData } from "@/hooks/admin/useDashboardData";
import { usePerformanceData, ProjectWithCosts } from "@/hooks/usePerformanceData";
import { RevenueTrendChart } from "@/components/admin/performance/RevenueTrendChart";
import { ProjectPerformanceList } from "@/components/admin/performance/ProjectPerformanceList";
import { JobCostDetailsSheet } from "@/components/admin/performance/JobCostDetailsSheet";

export default function Performance() {
  const { performanceMetrics: m, isLoading: dashLoading } = useDashboardData();
  const { projects, monthlyRevenue, isLoading: perfLoading } = usePerformanceData();
  const [selectedProject, setSelectedProject] = useState<ProjectWithCosts | null>(null);

  const avgJobValue = m.completedCount > 0 ? Math.round(m.totalRevenue / m.completedCount) : 0;

  const cards = [
    {
      title: "Receita Total",
      value: `$${m.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: `Lucro: $${m.totalProfit.toLocaleString()}`,
      trend: 'up' as const,
    },
    {
      title: "Jobs Concluídos",
      value: m.completedCount.toString(),
      icon: Briefcase,
      description: `${m.inProductionCount} em produção`,
      trend: 'neutral' as const,
    },
    {
      title: "Leads (30d)",
      value: m.recentLeadsCount.toString(),
      icon: Users,
      description: `${m.totalLeads} total`,
      trend: 'up' as const,
    },
    {
      title: "Valor Médio/Job",
      value: `$${avgJobValue.toLocaleString()}`,
      icon: TrendingUp,
      description: `Margem: ${(m.avgMargin ?? 0).toFixed(1)}%`,
      trend: (m.avgMargin ?? 0) >= 30 ? 'up' as const : 'down' as const,
    },
  ];

  return (
    <AdminLayout title="Performance">
      <div className="space-y-6">
        <StatsCardsGrid cards={cards} isLoading={dashLoading} columns={4} />
        <RevenueTrendChart data={monthlyRevenue} isLoading={perfLoading} />
        <ProjectPerformanceList
          projects={projects}
          isLoading={perfLoading}
          onSelect={setSelectedProject}
        />
        <JobCostDetailsSheet
          project={selectedProject}
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      </div>
    </AdminLayout>
  );
}
