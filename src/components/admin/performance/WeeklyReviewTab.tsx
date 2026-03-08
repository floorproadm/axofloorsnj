import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { subWeeks, startOfWeek, endOfWeek, addWeeks, format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DollarSign, TrendingUp, Briefcase, Users, ArrowUp, ArrowDown, Minus, Target, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { PerformanceExportSheet } from "./PerformanceExportSheet";

const fmt = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
const marginColor = (m: number) => m >= 30 ? "text-emerald-500" : m >= 15 ? "text-amber-500" : "text-red-500";
const marginBg = (m: number) => m >= 30 ? "bg-emerald-500/10 border-emerald-500/20" : m >= 15 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20";

export default function WeeklyReviewTab() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const baseDate = subWeeks(new Date(), weekOffset);
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 0 });
  const isCurrentWeek = weekOffset === 0;
  const weekLabel = isCurrentWeek ? "This Week" : weekOffset === 1 ? "Last Week" : `Week of ${format(weekStart, "MMM d")}`;

  const { data: weekProjects = [], isLoading: lp } = useQuery({
    queryKey: ["wr-projects", weekOffset],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects")
        .select("id, customer_name, project_type, project_status, start_date, completion_date, city, address, job_costs(estimated_revenue, total_cost, margin_percent, profit_amount, labor_cost, material_cost)")
        .gte("start_date", format(weekStart, "yyyy-MM-dd"))
        .lte("start_date", format(weekEnd, "yyyy-MM-dd"))
        .order("start_date");
      if (error) throw error;
      return (data ?? []).map((p: any) => ({ ...p, job_costs: Array.isArray(p.job_costs) ? p.job_costs[0] ?? null : p.job_costs }));
    },
  });

  const { data: weekLeads = [] } = useQuery({
    queryKey: ["wr-leads", weekOffset],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, status").gte("created_at", weekStart.toISOString()).lte("created_at", weekEnd.toISOString());
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: weekPayments = [] } = useQuery({
    queryKey: ["wr-payments", weekOffset],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("amount, category, status, payment_date").gte("payment_date", format(weekStart, "yyyy-MM-dd")).lte("payment_date", format(weekEnd, "yyyy-MM-dd")).eq("status", "confirmed");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: prevProjects = [] } = useQuery({
    queryKey: ["wr-prev", weekOffset],
    queryFn: async () => {
      const ps = startOfWeek(subWeeks(baseDate, 1), { weekStartsOn: 0 });
      const pe = endOfWeek(subWeeks(baseDate, 1), { weekStartsOn: 0 });
      const { data, error } = await supabase.from("projects").select("job_costs(estimated_revenue)").gte("start_date", format(ps, "yyyy-MM-dd")).lte("start_date", format(pe, "yyyy-MM-dd"));
      if (error) throw error;
      return (data ?? []).map((p: any) => ({ ...p, job_costs: Array.isArray(p.job_costs) ? p.job_costs[0] ?? null : p.job_costs }));
    },
  });

  const totalRevenue = weekProjects.reduce((s: number, p: any) => s + (p.job_costs?.estimated_revenue ?? 0), 0);
  const totalProfit = weekProjects.reduce((s: number, p: any) => s + (p.job_costs?.profit_amount ?? 0), 0);
  const avgMargin = weekProjects.length > 0 ? weekProjects.reduce((s: number, p: any) => s + (p.job_costs?.margin_percent ?? 0), 0) / weekProjects.length : 0;
  const cashIn = weekPayments.filter((p: any) => p.category === "received").reduce((s: number, p: any) => s + p.amount, 0);
  const cashOut = weekPayments.filter((p: any) => p.category !== "received").reduce((s: number, p: any) => s + p.amount, 0);
  const prevRevenue = prevProjects.reduce((s: number, p: any) => s + (p.job_costs?.estimated_revenue ?? 0), 0);
  const revDelta = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const wonLeads = weekLeads.filter((l: any) => l.status === "won").length;

  const chartData = weekProjects.map((p: any) => ({
    name: p.customer_name.split(" ")[0],
    revenue: p.job_costs?.estimated_revenue ?? 0,
    profit: p.job_costs?.profit_amount ?? 0,
    margin: p.job_costs?.margin_percent ?? 0,
  }));

  return (
    <div className="space-y-5">
      {/* Week Nav */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w + 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium min-w-[120px] text-center">{weekLabel}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={isCurrentWeek} onClick={() => setWeekOffset(w => w - 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground">{format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-auto"
          onClick={() => setExportOpen(true)}
          title="Download Report"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Revenue", value: fmt(totalRevenue), color: "text-primary", sub: revDelta !== 0 ? `${revDelta > 0 ? "+" : ""}${revDelta.toFixed(0)}% vs prev` : "—" },
          { label: "Net Profit", value: fmt(totalProfit), color: totalProfit >= 0 ? "text-emerald-500" : "text-red-500", sub: `${avgMargin.toFixed(1)}% avg margin` },
          { label: "Jobs", value: `${weekProjects.length}`, color: "text-blue-500", sub: `${weekProjects.filter((p:any) => p.project_status === "completed").length} completed` },
          { label: "New Leads", value: `${weekLeads.length}`, color: "text-violet-500", sub: `${wonLeads} won` },
        ].map(k => (
          <Card key={k.label} className="border-border/50">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">{k.label}</p>
              <p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
              <p className="text-[11px] text-muted-foreground">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Margin banner */}
      <Card className={cn("border", marginBg(avgMargin))}>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Average Margin — {weekLabel}</p>
            <p className="text-xs text-muted-foreground">{weekProjects.length} job{weekProjects.length !== 1 ? "s" : ""} · Target ≥ 30%</p>
          </div>
          <span className={cn("text-3xl font-bold", marginColor(avgMargin))}>{avgMargin.toFixed(1)}%</span>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Chart */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Revenue vs Profit</p>
            {chartData.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-sm text-muted-foreground">No jobs this week</div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={chartData} barSize={14} barGap={3}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: any, name: string) => [fmt(v), name === "revenue" ? "Revenue" : "Profit"]} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" opacity={0.25} radius={[3,3,0,0]} />
                  <Bar dataKey="profit" radius={[3,3,0,0]}>
                    {chartData.map((e: any, i: number) => <Cell key={i} fill={e.margin >= 30 ? "#10b981" : e.margin >= 15 ? "#f59e0b" : "#ef4444"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Cash Flow */}
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cash Flow</p>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between">
              <span className="text-sm text-emerald-600 font-medium">💵 Cash In</span>
              <span className="font-bold text-emerald-600">{fmt(cashIn)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex justify-between">
              <span className="text-sm text-red-500 font-medium">💸 Cash Out</span>
              <span className="font-bold text-red-500">{fmt(cashOut)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/50 border border-border/50 flex justify-between">
              <span className="text-sm font-semibold">Net Cash</span>
              <span className={cn("font-bold", cashIn - cashOut >= 0 ? "text-emerald-500" : "text-red-500")}>{fmt(cashIn - cashOut)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs list */}
      {weekProjects.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Jobs ({weekProjects.length})</p>
            <div className="space-y-2">
              {weekProjects.map((p: any) => {
                const margin = p.job_costs?.margin_percent ?? 0;
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-2 h-2 rounded-full", margin >= 30 ? "bg-emerald-500" : margin >= 15 ? "bg-amber-500" : "bg-red-500")} />
                      <div>
                        <p className="text-sm font-medium">{p.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{p.project_type} · {p.city ?? "—"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{fmt(p.job_costs?.estimated_revenue ?? 0)}</p>
                      <p className={cn("text-xs font-medium", marginColor(margin))}>{margin.toFixed(0)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <PerformanceExportSheet
        open={exportOpen}
        onOpenChange={setExportOpen}
        projects={weekProjects}
        periodLabel={`${weekLabel} (${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")})`}
      />
    </div>
  );
}
