import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { useAdminData } from "@/hooks/admin/useAdminData";

interface ServiceData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

const serviceColors = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))", 
  "#10b981",
  "#f59e0b",
  "#ef4444"
];

export function ServicesChart() {
  const { leads, isLoading } = useAdminData();

  const generateServicesData = (): ServiceData[] => {
    const serviceCount = new Map<string, number>();
    const totalLeads = leads.length;

    // Count services from all leads
    leads.forEach(lead => {
      if (Array.isArray(lead.services)) {
        lead.services.forEach(service => {
          const current = serviceCount.get(service) || 0;
          serviceCount.set(service, current + 1);
        });
      }
    });

    // Convert to array and sort by count
    const servicesArray = Array.from(serviceCount.entries())
      .map(([name, count], index) => ({
        name: name.replace(/([A-Z])/g, ' $1').trim(), // Add spaces to camelCase
        count,
        percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
        color: serviceColors[index % serviceColors.length]
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 services

    return servicesArray;
  };

  const data = generateServicesData();
  const totalRequests = data.reduce((sum, item) => sum + item.count, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Serviços Mais Solicitados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Serviços Mais Solicitados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-center">
            <div>
              <p className="text-muted-foreground">Nenhum dado de serviços disponível</p>
              <p className="text-sm text-muted-foreground mt-1">
                Os dados aparecerão conforme novos leads forem recebidos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Serviços Mais Solicitados</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Top 5 serviços baseado nos leads recebidos
            </p>
          </div>
          <Badge variant="secondary">
            {totalRequests} solicitações
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="horizontal" margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number"
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                type="category"
                dataKey="name"
                className="text-xs fill-muted-foreground"
                width={80}
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-lg p-2 md:p-3 shadow-lg">
                        <p className="font-medium text-sm">{label}</p>
                        <div className="space-y-1 mt-2">
                          <p className="text-xs text-muted-foreground">
                            Solicitações: <span className="font-medium text-foreground">{data.count}</span>
                          </p>
                          <p className="text-xs text-primary font-medium">
                            {data.percentage}% do total
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service List */}
        <div className="space-y-2 pt-4 border-t">
          {data.map((service, index) => (
            <div key={service.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: service.color }}
                />
                <span className="text-xs md:text-sm font-medium truncate">{service.name}</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                <Badge variant="outline" className="text-xs">
                  {service.count}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {service.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}