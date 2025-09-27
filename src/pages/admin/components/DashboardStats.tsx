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
      change: 0, // Removido cálculo fictício
      trend: 'neutral',
      icon: Users,
      description: `${stats.newLeads} novos este mês`
    },
    {
      title: "Taxa de Conversão",
      value: `${stats.conversionRate}%`,
      change: 0, // Removido cálculo fictício
      trend: 'neutral',
      icon: Target,
      description: `${stats.convertedLeads} leads convertidos`
    },
    {
      title: "Projetos Ativos",
      value: stats.activeProjects.toLocaleString(),
      change: 0, // Removido cálculo fictício
      trend: 'neutral',
      icon: Building,
      description: `${stats.completedProjects} concluídos`
    },
    {
      title: "Receita Mensal",
      value: `$${(stats.monthlyRevenue / 1000).toFixed(1)}k`,
      change: 0, // Removido cálculo fictício
      trend: 'neutral',
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