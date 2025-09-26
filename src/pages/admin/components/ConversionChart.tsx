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
  Area,
  AreaChart
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useAdminData } from "@/hooks/admin/useAdminData";

interface ConversionDataPoint {
  month: string;
  leads: number;
  converted: number;
  rate: number;
}

export function ConversionChart() {
  const { leads, isLoading } = useAdminData();

  // Generate conversion data for last 6 months
  const generateConversionData = (): ConversionDataPoint[] => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      // Filter leads for this month
      const monthLeads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate.getMonth() === date.getMonth() && 
               leadDate.getFullYear() === date.getFullYear();
      });
      
      const totalLeads = monthLeads.length;
      const convertedLeads = monthLeads.filter(lead => lead.status === 'converted').length;
      const rate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
      
      months.push({
        month: monthName,
        leads: totalLeads,
        converted: convertedLeads,
        rate: rate
      });
    }
    
    return months;
  };

  const data = generateConversionData();
  const currentRate = data[data.length - 1]?.rate || 0;
  const previousRate = data[data.length - 2]?.rate || 0;
  const rateChange = currentRate - previousRate;
  const trend = rateChange > 0 ? 'up' : rateChange < 0 ? 'down' : 'neutral';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Conversão</CardTitle>
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Taxa de Conversão</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Evolução da conversão de leads nos últimos 6 meses
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`${
                trend === 'up' 
                  ? 'text-green-600 bg-green-50' 
                  : trend === 'down' 
                    ? 'text-red-600 bg-red-50' 
                    : 'text-muted-foreground bg-muted/50'
              }`}
            >
              {trend === 'up' ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : trend === 'down' ? (
                <TrendingDown className="w-3 h-3 mr-1" />
              ) : null}
              {currentRate}%
            </Badge>
          </div>
        </div>
      </CardHeader>
        <CardContent className="p-4 md:p-6">
        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="conversionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 12 }}
                width={30}
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
                            Leads: <span className="font-medium text-foreground">{data.leads}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Convertidos: <span className="font-medium text-foreground">{data.converted}</span>
                          </p>
                          <p className="text-xs text-primary font-medium">
                            Taxa: {data.rate}%
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#conversionGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-lg md:text-2xl font-bold">{data.reduce((sum, d) => sum + d.leads, 0)}</p>
            <p className="text-xs text-muted-foreground">Total Leads</p>
          </div>
          <div className="text-center">
            <p className="text-lg md:text-2xl font-bold">{data.reduce((sum, d) => sum + d.converted, 0)}</p>
            <p className="text-xs text-muted-foreground">Convertidos</p>
          </div>
          <div className="text-center">
            <p className="text-lg md:text-2xl font-bold text-primary">{currentRate}%</p>
            <p className="text-xs text-muted-foreground">Taxa Atual</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}