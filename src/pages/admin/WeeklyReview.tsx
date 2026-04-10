import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  startOfWeek, endOfWeek, subWeeks, format, addWeeks
} from "date-fns";
import {
  DollarSign, TrendingUp, Briefcase, Users, ChevronLeft,
  ChevronRight, CheckCircle2, Clock, BarChart3,
  Target, ArrowUp, ArrowDown, Minus, Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { useWeeklyReview, useUpsertWeeklyReview, useWeeklyReviewHistory } from "@/hooks/useWeeklyReviews";
import { toast } from "sonner";

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const marginColor = (m: number) =>
  m >= 30 ? "text-emerald-500" : m >= 15 ? "text-amber-500" : "text-red-500";

const marginBg = (m: number) =>
  m >= 30 ? "bg-emerald-500/10 border-emerald-500/20" : m >= 15 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20";

const marginLabel = (m: number) =>
  m >= 30 ? "🟢 Excellent" : m >= 15 ? "🟡 Acceptable" : "🔴 Review Costs";

export default function WeeklyReview() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionItems, setActionItems] = useState('');

  const baseDate = subWeeks(new Date(), weekOffset);
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 0 });
  const isCurrentWeek = weekOffset === 0;
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  const { data: weekReview } = useWeeklyReview(weekStartStr);
  const { data: reviewHistory = [] } = useWeeklyReviewHistory();
  const { mutateAsync: upsertReview, isPending: isSaving } = useUpsertWeeklyReview();
  const isWeekClosed = weekReview?.status === 'closed';

  const weekLabel = isCurrentWeek
    ? "This Week"
    : weekOffset === 1
    ? "Last Week"
    : `Week of ${format(weekStart, "MMM d")}`;

  // Fetch projects completed this week
  const { data: weekProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["weekly-review-projects", weekOffset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id, customer_name, project_type, project_status,
          start_date, completion_date, square_footage,
          address, city, team_lead,
          job_costs(estimated_revenue, total_cost, margin_percent, profit_amount, labor_cost, material_cost, additional_costs)
        `)
        .gte("start_date", format(weekStart, "yyyy-MM-dd"))
        .lte("start_date", format(weekEnd, "yyyy-MM-dd"))
        .order("start_date", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        ...p,
        job_costs: Array.isArray(p.job_costs) ? p.job_costs[0] ?? null : p.job_costs,
      }));
    },
  });

  // Fetch leads this week
  const { data: weekLeads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["weekly-review-leads", weekOffset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, status, created_at, contact_name, service_type")
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch payments this week
  const { data: weekPayments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ["weekly-review-payments", weekOffset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, category, status, payment_date, description")
        .gte("payment_date", format(weekStart, "yyyy-MM-dd"))
        .lte("payment_date", format(weekEnd, "yyyy-MM-dd"))
        .eq("status", "confirmed");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch last week for comparison
  const { data: lastWeekProjects = [] } = useQuery({
    queryKey: ["weekly-review-last-projects", weekOffset],
    queryFn: async () => {
      const prevStart = startOfWeek(subWeeks(baseDate, 1), { weekStartsOn: 0 });
      const prevEnd = endOfWeek(subWeeks(baseDate, 1), { weekStartsOn: 0 });
      const { data, error } = await supabase
        .from("projects")
        .select("id, job_costs(estimated_revenue, profit_amount, margin_percent)")
        .gte("start_date", format(prevStart, "yyyy-MM-dd"))
        .lte("start_date", format(prevEnd, "yyyy-MM-dd"));
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        ...p,
        job_costs: Array.isArray(p.job_costs) ? p.job_costs[0] ?? null : p.job_costs,
      }));
    },
  });

  const isLoading = loadingProjects || loadingLeads || loadingPayments;

  // Calculations
  const totalRevenue = weekProjects.reduce((s: number, p: any) => s + (p.job_costs?.estimated_revenue ?? 0), 0);
  const totalProfit = weekProjects.reduce((s: number, p: any) => s + (p.job_costs?.profit_amount ?? 0), 0);
  const totalLabor = weekProjects.reduce((s: number, p: any) => s + (p.job_costs?.labor_cost ?? 0), 0);
  const totalMaterial = weekProjects.reduce((s: number, p: any) => s + (p.job_costs?.material_cost ?? 0), 0);
  const avgMargin = weekProjects.length > 0
    ? weekProjects.reduce((s: number, p: any) => s + (p.job_costs?.margin_percent ?? 0), 0) / weekProjects.length
    : 0;
  const completedCount = weekProjects.filter((p: any) => p.project_status === "completed").length;
  const inProgressCount = weekProjects.filter((p: any) => p.project_status === "in_production").length;

  const cashIn = weekPayments.filter((p: any) => p.category === "received").reduce((s: number, p: any) => s + p.amount, 0);
  const cashOut = weekPayments.filter((p: any) => p.category !== "received").reduce((s: number, p: any) => s + p.amount, 0);

  // Last week comparison
  const lastWeekRevenue = lastWeekProjects.reduce((s: number, p: any) => s + (p.job_costs?.estimated_revenue ?? 0), 0);
  const revenueDelta = lastWeekRevenue > 0 ? ((totalRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

  const wonLeads = weekLeads.filter((l: any) => l.status === "won").length;
  const totalLeads = weekLeads.length;
  const convRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  // Chart data — project breakdown
  const chartData = weekProjects.map((p: any) => ({
    name: p.customer_name.split(" ")[0],
    revenue: p.job_costs?.estimated_revenue ?? 0,
    profit: p.job_costs?.profit_amount ?? 0,
    margin: p.job_costs?.margin_percent ?? 0,
  }));

  // Days of week activity
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayData = dayLabels.map((day, i) => {
    const dayDate = format(addWeeks(weekStart, 0), "yyyy-MM-dd");
    const dayProjects = weekProjects.filter((p: any) => {
      if (!p.start_date) return false;
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return p.start_date === format(d, "yyyy-MM-dd");
    });
    return { day, jobs: dayProjects.length };
  });

  const TrendIcon = ({ delta }: { delta: number }) => {
    if (delta > 2) return <ArrowUp className="w-3 h-3 text-emerald-500" />;
    if (delta < -2) return <ArrowDown className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <AdminLayout title="Weekly Review">
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Weekly Review</h1>
              <p className="text-xs text-muted-foreground">
                {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
              </p>
            </div>
          </div>
          {/* Week Navigator */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w + 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[90px] text-center">{weekLabel}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={isCurrentWeek} onClick={() => setWeekOffset(w => w - 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading week data...</div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "Revenue", value: fmt(totalRevenue), icon: DollarSign,
                  sub: <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><TrendIcon delta={revenueDelta} />{Math.abs(revenueDelta).toFixed(0)}% vs prev week</span>,
                  accent: "text-primary"
                },
                {
                  label: "Net Profit", value: fmt(totalProfit), icon: TrendingUp,
                  sub: <span className={cn("text-[11px] font-medium", marginColor(avgMargin))}>{marginLabel(avgMargin)}</span>,
                  accent: totalProfit >= 0 ? "text-emerald-500" : "text-red-500"
                },
                {
                  label: "Jobs Active", value: `${weekProjects.length}`, icon: Briefcase,
                  sub: <span className="text-[11px] text-muted-foreground">{completedCount} done · {inProgressCount} in progress</span>,
                  accent: "text-blue-500"
                },
                {
                  label: "New Leads", value: `${totalLeads}`, icon: Users,
                  sub: <span className="text-[11px] text-muted-foreground">{wonLeads} won · {convRate}% conv. rate</span>,
                  accent: "text-violet-500"
                },
              ].map((card) => (
                <Card key={card.label} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{card.label}</span>
                      <card.icon className={cn("w-4 h-4", card.accent)} />
                    </div>
                    <p className={cn("text-2xl font-bold", card.accent)}>{card.value}</p>
                    {card.sub}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Avg Margin Banner */}
            <Card className={cn("border", marginBg(avgMargin))}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Average Margin This Week</p>
                    <p className="text-xs text-muted-foreground">Based on {weekProjects.length} project{weekProjects.length !== 1 ? "s" : ""} · Target ≥ 30%</p>
                  </div>
                </div>
                <span className={cn("text-3xl font-bold", marginColor(avgMargin))}>
                  {avgMargin.toFixed(1)}%
                </span>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Revenue Chart */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Revenue vs Profit by Job</p>
                  {chartData.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">No jobs this week</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={chartData} barSize={16} barGap={4}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{ fontSize: 11, borderRadius: 8 }}
                          formatter={(val: any, name: string) => [fmt(val), name === "revenue" ? "Revenue" : "Profit"]}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" opacity={0.3} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry: any, i: number) => (
                            <Cell key={i} fill={entry.margin >= 30 ? "#10b981" : entry.margin >= 15 ? "#f59e0b" : "#ef4444"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Cash Flow */}
              <Card className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cash Flow This Week</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-sm text-emerald-600 font-medium">💵 Cash In</span>
                      <span className="font-bold text-emerald-600">{fmt(cashIn)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                      <span className="text-sm text-red-500 font-medium">💸 Cash Out</span>
                      <span className="font-bold text-red-500">{fmt(cashOut)}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-muted/50 border border-border/50">
                      <span className="text-sm font-semibold">Net Cash</span>
                      <span className={cn("font-bold", cashIn - cashOut >= 0 ? "text-emerald-500" : "text-red-500")}>
                        {fmt(cashIn - cashOut)}
                      </span>
                    </div>
                  </div>
                  <div className="pt-1 grid grid-cols-2 gap-2">
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Labor</p>
                      <p className="text-sm font-semibold">{fmt(totalLabor)}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Material</p>
                      <p className="text-sm font-semibold">{fmt(totalMaterial)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Jobs List */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Jobs This Week ({weekProjects.length})
                </p>
                {weekProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No jobs scheduled this week</p>
                ) : (
                  <div className="space-y-2">
                    {weekProjects.map((p: any) => {
                      const margin = p.job_costs?.margin_percent ?? 0;
                      const revenue = p.job_costs?.estimated_revenue ?? 0;
                      const profit = p.job_costs?.profit_amount ?? 0;
                      return (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-2 h-2 rounded-full", margin >= 30 ? "bg-emerald-500" : margin >= 15 ? "bg-amber-500" : "bg-red-500")} />
                            <div>
                              <p className="text-sm font-medium">{p.customer_name}</p>
                              <p className="text-xs text-muted-foreground">{p.project_type} · {p.city ?? p.address ?? "—"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{fmt(revenue)}</p>
                            <p className={cn("text-xs font-medium", marginColor(margin))}>
                              {margin.toFixed(0)}% margin
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leads Summary */}
            {weekLeads.length > 0 && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Leads This Week ({weekLeads.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {["new", "won", "lost"].map((status) => {
                      const count = weekLeads.filter((l: any) => l.status === status).length;
                      const colors: Record<string, string> = { new: "text-blue-500", won: "text-emerald-500", lost: "text-red-500" };
                      return (
                        <div key={status} className="text-center p-3 rounded-xl bg-muted/30">
                          <p className={cn("text-xl font-bold", colors[status])}>{count}</p>
                          <p className="text-xs text-muted-foreground capitalize">{status}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
