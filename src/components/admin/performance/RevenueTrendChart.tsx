import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { MonthlyRevenue } from "@/hooks/usePerformanceData";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  data: MonthlyRevenue[];
  isLoading: boolean;
}

const chartConfig = {
  revenue: { label: "Receita", color: "hsl(var(--primary))" },
};

export function RevenueTrendChart({ data, isLoading }: Props) {
  if (isLoading) {
    return <Card className="p-6"><Skeleton className="h-[250px] w-full rounded-xl" /></Card>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Tendência de Receita</h3>
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
          <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => `$${Number(value).toLocaleString()}`} />} />
          <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#fillRevenue)" strokeWidth={2} />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
}
