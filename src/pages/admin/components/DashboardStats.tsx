import React from "react";
import { StatsCardsGrid, StatsCardProps } from "@/components/admin/StatsCards";
import { useAdminData } from "@/hooks/admin/useAdminData";
import {
  Users,
  Phone,
  CheckCircle,
  TrendingUp,
  Building,
  Calendar,
  DollarSign,
  Target
} from "lucide-react";

export function DashboardStats() {
  const { stats, isLoading } = useAdminData();

  const statsCards: StatsCardProps[] = [
    {
      title: "Total de Leads",
      value: stats.totalLeads.toLocaleString(),
      change: stats.newLeads > 0 ? 5 : 0, // Mock change calculation
      trend: stats.newLeads > 0 ? 'up' : 'neutral',
      icon: Users,
      description: `${stats.newLeads} novos este mês`
    },
    {
      title: "Taxa de Conversão",
      value: `${stats.conversionRate}%`,
      change: stats.conversionRate > 15 ? 2 : -1, // Mock change
      trend: stats.conversionRate > 15 ? 'up' : 'down',
      icon: Target,
      description: `${stats.convertedLeads} leads convertidos`
    },
    {
      title: "Projetos Ativos",
      value: stats.activeProjects.toLocaleString(),
      change: stats.activeProjects > 0 ? 3 : 0,
      trend: stats.activeProjects > 0 ? 'up' : 'neutral',
      icon: Building,
      description: `${stats.completedProjects} concluídos`
    },
    {
      title: "Receita Mensal",
      value: `$${(stats.monthlyRevenue / 1000).toFixed(1)}k`,
      change: stats.monthlyRevenue > 0 ? 8 : 0,
      trend: stats.monthlyRevenue > 0 ? 'up' : 'neutral',
      icon: DollarSign,
      description: `$${(stats.averageProjectValue / 1000).toFixed(1)}k ticket médio`
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Visão Geral
        </h2>
        <p className="text-sm text-muted-foreground">
          Métricas principais do seu negócio
        </p>
      </div>
      
      <StatsCardsGrid 
        cards={statsCards} 
        isLoading={isLoading}
        columns={4}
      />
    </div>
  );
}