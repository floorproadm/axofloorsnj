import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { TrendingUp, DollarSign, Calendar } from "lucide-react";
import { useAdminData } from "@/hooks/admin/useAdminData";

interface RevenueData {
  month: string;
  actual: number;
  projected: number;
  target: number;
}

export function RevenueProjection() {
  const { projects, stats, isLoading } = useAdminData();

  const generateRevenueData = (): RevenueData[] => {
    const months = [];
    const now = new Date();
    
    // Calculr meta mensal baseada na receita histórica real
    const historicalProjects = projects.filter(p => 
      p.project_status === 'completed' && p.actual_cost
    );
    const historicalRevenue = historicalProjects.reduce((sum, p) => sum + (p.actual_cost || 0), 0);
    const monthsOfHistory = Math.max(1, historicalProjects.length / 6); // Estimate months
    const monthlyTarget = historicalRevenue / monthsOfHistory || 0; // Target baseado no histórico real
    
    // Últimos 6 meses + próximos 6 meses
    for (let i = -5; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      const isCurrentOrFuture = i >= 0;
      
      let actualRevenue = 0;
      
      if (!isCurrentOrFuture) {
        // Revenue real para meses passados
        const monthProjects = projects.filter(project => {
          if (!project.completion_date || project.project_status !== 'completed') return false;
          const completionDate = new Date(project.completion_date);
          return completionDate.getMonth() === date.getMonth() && 
                 completionDate.getFullYear() === date.getFullYear();
        });
        
        actualRevenue = monthProjects.reduce((sum, p) => sum + (p.actual_cost || p.estimated_cost || 0), 0);
      }
      
      // Projeção baseada na média histórica real apenas
      let projectedRevenue = 0;
      
      if (isCurrentOrFuture && historicalRevenue > 0) {
        // Para meses futuros, usar média histórica real sem growth fictício
        projectedRevenue = monthlyTarget;
      }
      
      months.push({
        month: monthName,
        actual: actualRevenue,
        projected: projectedRevenue,
        target: monthlyTarget
      });
    }
    
    return months;
  };

  const data = generateRevenueData();
  const currentMonth = data[5]; // Mês atual está no índice 5
  const totalProjected = data.slice(6).reduce((sum, d) => sum + d.projected, 0);
  const annualTarget = data[0]?.target ? data[0].target * 12 : 0; // Meta anual baseada na meta mensal real

  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}k`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projeção de Receita</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg">Projeção de Receita</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Histórico e projeção dos próximos 6 meses
            </p>
          </div>
          <Badge variant="secondary" className="text-green-600 bg-green-50 w-fit">
            <TrendingUp className="w-3 h-3 mr-1" />
            {formatCurrency(totalProjected)} próximos 6m
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="h-64 sm:h-80 w-full overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11 }}
                width={40}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-card border border-border rounded-lg p-2 sm:p-3 shadow-lg max-w-48">
                        <p className="font-medium text-sm">{label}</p>
                        <div className="space-y-1 mt-2">
                          {payload.map((entry, index) => (
                            <p key={index} className="text-xs">
                              <span 
                                className="inline-block w-2 h-2 rounded-full mr-2" 
                                style={{ backgroundColor: entry.color }}
                              />
                              {entry.name === 'actual' ? 'Real' : 
                               entry.name === 'projected' ? 'Projetado' : 'Meta'}: {' '}
                              <span className="font-medium">
                                {formatCurrency(entry.value as number)}
                              </span>
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine 
                x={data[5]?.month} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="2 2"
                label={{ value: "Hoje", position: "top", fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="target"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 3 }}
                name="actual"
              />
              <Line
                type="monotone"
                dataKey="projected"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={{ fill: "#10b981", r: 3 }}
                name="projected"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1 mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Real (último mês)</p>
            </div>
            <p className="text-lg sm:text-xl font-bold">
              {formatCurrency(data[4]?.actual || 0)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-xs text-muted-foreground">Projeção (6m)</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-green-600">
              {formatCurrency(totalProjected)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Meta Anual</p>
            </div>
            <p className="text-lg sm:text-xl font-bold">
              {formatCurrency(annualTarget)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}