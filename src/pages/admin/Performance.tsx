import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DollarSign, Briefcase, TrendingUp, BarChart3,
  CalendarDays, Target, Download
} from "lucide-react";
import { useDashboardData } from "@/hooks/admin/useDashboardData";
import { usePerformanceData, ProjectWithCosts } from "@/hooks/usePerformanceData";
import { JobCostDetailsSheet } from "@/components/admin/performance/JobCostDetailsSheet";
import { PerformanceExportSheet } from "@/components/admin/performance/PerformanceExportSheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";
import { cn } from "@/lib/utils";
import { subWeeks, startOfWeek, endOfWeek, format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { AXO_ORG_ID } from "@/lib/constants";

// ── Weekly Review (inline, same component) ──────────────────────────────────
import WeeklyReviewTab from "@/components/admin/performance/WeeklyReviewTab";

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

const marginColor = (m: number) =>
  m >= 30 ? "text-emerald-500" : m >= 15 ? "text-amber-500" : "text-red-500";

const marginBg = (m: number) =>
  m >= 30 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
    : m >= 15 ? "bg-amber-500/10 border-amber-500/20 text-amber-600"
    : "bg-red-500/10 border-red-500/20 text-red-500";

type Period = "30d" | "90d" | "6m" | "1y" | "all";

const PERIODS: { label: string; value: Period }[] = [
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "6 months", value: "6m" },
  { label: "1 year", value: "1y" },
  { label: "All time", value: "all" },
];

function getPeriodStart(period: Period): Date | null {
  const now = new Date();
  if (period === "30d") return subMonths(now, 1);
  if (period === "90d") return subMonths(now, 3);
  if (period === "6m") return subMonths(now, 6);
  if (period === "1y") return subMonths(now, 12);
  return null;
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const [period, setPeriod] = useState<Period>("90d");
  const [selectedProject, setSelectedProject] = useState<ProjectWithCosts | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const { projects: allProjects, isLoading } = usePerformanceData();

  const periodStart = getPeriodStart(period);

  // Real revenue source: CONFIRMED invoice_payment payments joined with invoice + project + job_costs
  const { data: paidInvoices = [], isLoading: loadingInv } = useQuery({
    queryKey: ["performance-paid-invoices", period],
    queryFn: async () => {
      let q = supabase
        .from("payments")
        .select("id, amount, payment_date, invoice_id, project_id, invoices!inner(id, total_amount, paid_at, created_at), projects!inner(id, customer_name, project_type, project_status, start_date, completion_date, job_costs(id, estimated_revenue, total_cost, margin_percent, profit_amount, labor_cost, material_cost, additional_costs))")
        .eq("organization_id", AXO_ORG_ID)
        .eq("status", "confirmed")
        .eq("category", "invoice_payment")
        .not("invoice_id", "is", null);
      if (periodStart) q = q.gte("payment_date", periodStart.toISOString().split("T")[0]);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.invoice_id,
        project_id: r.project_id,
        total_amount: r.amount,
        paid_at: r.payment_date,
        created_at: r.payment_date,
        status: "paid",
        projects: { ...r.projects, job_costs: Array.isArray(r.projects?.job_costs) ? r.projects.job_costs[0] ?? null : r.projects?.job_costs },
      }));
    },
  });

  // Per-project aggregation (avoid double counting cost across multiple payments)
  const projectAgg = useMemo(() => {
    const map = new Map<string, { project: any; revenue: number }>();
    paidInvoices.forEach((inv: any) => {
      const pid = inv.project_id;
      if (!pid) return;
      const cur = map.get(pid) ?? { project: inv.projects, revenue: 0 };
      cur.revenue += Number(inv.total_amount) || 0;
      map.set(pid, cur);
    });
    return Array.from(map.values());
  }, [paidInvoices]);

  const totalRevenue = paidInvoices.reduce((s: number, i: any) => s + (Number(i.total_amount) || 0), 0);
  const projectsWithCosts = projectAgg.filter(a => (a.project?.job_costs?.total_cost ?? 0) > 0);
  const totalCost = projectsWithCosts.reduce((s, a) => s + (a.project?.job_costs?.total_cost ?? 0), 0);
  const totalLabor = projectsWithCosts.reduce((s, a) => s + (a.project?.job_costs?.labor_cost ?? 0), 0);
  const totalMaterial = projectsWithCosts.reduce((s, a) => s + (a.project?.job_costs?.material_cost ?? 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const hasCostData = projectsWithCosts.length > 0;
  const avgMargin = hasCostData
    ? projectsWithCosts.reduce((s, a) => s + (a.project?.job_costs?.margin_percent ?? 0), 0) / projectsWithCosts.length
    : 0;
  const avgJobValue = projectAgg.length > 0 ? totalRevenue / projectAgg.length : 0;

  // Completed Jobs list derived from same paid-invoice aggregation as KPIs (single source of truth)
  const completedJobs = useMemo(() => {
    return projectAgg
      .filter(a => a.project?.project_status === "completed")
      .map(a => ({
        ...a.project,
        job_costs: a.project?.job_costs
          ? { ...a.project.job_costs, estimated_revenue: a.revenue }
          : { estimated_revenue: a.revenue, margin_percent: 0 },
      })) as ProjectWithCosts[];
  }, [projectAgg]);

  // Service breakdown (from paid invoices)
  const byService = useMemo(() => {
    const map: Record<string, { revenue: number; count: number; profit: number }> = {};
    projectAgg.forEach(a => {
      const type = a.project?.project_type || "Other";
      if (!map[type]) map[type] = { revenue: 0, count: 0, profit: 0 };
      map[type].revenue += a.revenue;
      map[type].profit += (a.revenue - (a.project?.job_costs?.total_cost ?? 0));
      map[type].count += 1;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name: name.replace(" & ", " &\n"), ...v, margin: v.revenue > 0 ? (v.profit / v.revenue) * 100 : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [projectAgg]);

  // Weekly chart: group paid invoices by ISO week
  const chartData = useMemo(() => {
    const byWeek: Record<string, { revenue: number; cost: number }> = {};
    paidInvoices.forEach((inv: any) => {
      const d = inv.paid_at || inv.created_at;
      if (!d) return;
      const wkStart = startOfWeek(new Date(d), { weekStartsOn: 1 });
      const key = format(wkStart, "yyyy-MM-dd");
      if (!byWeek[key]) byWeek[key] = { revenue: 0, cost: 0 };
      byWeek[key].revenue += Number(inv.total_amount) || 0;
    });
    // Approximate weekly cost: distribute project total_cost across its invoices proportionally
    const projTotals = new Map<string, number>();
    paidInvoices.forEach((inv: any) => projTotals.set(inv.project_id, (projTotals.get(inv.project_id) ?? 0) + Number(inv.total_amount || 0)));
    paidInvoices.forEach((inv: any) => {
      const d = inv.paid_at || inv.created_at;
      if (!d) return;
      const cost = inv.projects?.job_costs?.total_cost ?? 0;
      const totalForProj = projTotals.get(inv.project_id) ?? 0;
      const share = totalForProj > 0 ? (Number(inv.total_amount) / totalForProj) : 0;
      const wkStart = startOfWeek(new Date(d), { weekStartsOn: 1 });
      const key = format(wkStart, "yyyy-MM-dd");
      byWeek[key].cost += cost * share;
    });
    return Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({
        month: format(new Date(k), "MMM d"),
        revenue: Math.round(v.revenue),
        profit: Math.round(v.revenue - v.cost),
      }));
  }, [paidInvoices]);

  const kpis = [
    { label: "Revenue", value: fmt(totalRevenue), icon: DollarSign, color: "text-primary", sub: `${paidInvoices.length} confirmed payment${paidInvoices.length !== 1 ? "s" : ""}` },
    { label: "Net Profit", value: hasCostData ? fmt(totalProfit) : "—", icon: TrendingUp, color: hasCostData ? (totalProfit >= 0 ? "text-emerald-500" : "text-red-500") : "text-muted-foreground", sub: hasCostData ? `${avgMargin.toFixed(1)}% avg margin` : "Set Job Costs" },
    { label: "Avg Job Value", value: fmt(avgJobValue), icon: Briefcase, color: "text-blue-500", sub: `${projectAgg.length} job${projectAgg.length !== 1 ? "s" : ""} billed` },
    { label: "Labor + Material", value: hasCostData ? fmt(totalLabor + totalMaterial) : "—", icon: Target, color: "text-muted-foreground", sub: hasCostData ? `${fmt(totalLabor)} labor · ${fmt(totalMaterial)} mat.` : "No cost data" },
  ];

  return (
    <div className="space-y-5">
      {/* Period filter + Download */}
      <div className="relative flex items-center gap-2">
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map(p => (
              <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(k => (
          <Card key={k.label} className="border-border/50">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">{k.label}</p>
              <p className={cn("text-2xl font-bold", k.color)}>{k.value}</p>
              <p className="text-[11px] text-muted-foreground">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Avg Margin banner */}
      {hasCostData ? (
        <Card className={cn("border", avgMargin >= 30 ? "bg-emerald-500/5 border-emerald-500/20" : avgMargin >= 15 ? "bg-amber-500/5 border-amber-500/20" : "bg-red-500/5 border-red-500/20")}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Average Margin</p>
              <p className="text-xs text-muted-foreground">Target ≥ 30% · {avgMargin >= 30 ? "🟢 Excellent" : avgMargin >= 15 ? "🟡 Acceptable" : "🔴 Review Costs"}</p>
            </div>
            <span className={cn("text-3xl font-bold", marginColor(avgMargin))}>{avgMargin.toFixed(1)}%</span>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-amber-600">Margem real indisponível</p>
            <p className="text-xs text-muted-foreground mt-1">Complete os Job Costs dos projetos faturados para visualizar a margem real.</p>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Revenue vs Profit</p>
            {chartData.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-sm text-muted-foreground">No data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={chartData} barSize={14} barGap={3}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: any, name: string) => [fmt(v), name === "revenue" ? "Revenue" : "Profit"]} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" opacity={0.25} radius={[3,3,0,0]} name="revenue" />
                  <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[3,3,0,0]} name="profit" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">By Service Type</p>
            {byService.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-sm text-muted-foreground">No data</div>
            ) : (
              <div className="space-y-2">
                {byService.slice(0, 5).map(s => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className="w-24 truncate text-xs text-muted-foreground flex-shrink-0">{s.name.replace("\n", " ")}</div>
                    <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (s.revenue / byService[0].revenue) * 100)}%` }}
                      />
                    </div>
                    <div className="text-right flex-shrink-0 min-w-[80px]">
                      <span className="text-xs font-semibold">{fmt(s.revenue)}</span>
                      <span className={cn("text-[10px] ml-1", marginColor(s.margin))}>{s.margin.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed Jobs ({completedJobs.length})</p>
          </div>
          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
          ) : completedJobs.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No completed projects in this period</div>
          ) : (
            <div className="space-y-1.5">
              {completedJobs.slice(0, 10).map(p => {
                const revenue = p.job_costs?.estimated_revenue ?? 0;
                const margin = p.job_costs?.margin_percent ?? 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-transparent hover:border-border/50 hover:bg-muted/30 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", margin >= 30 ? "bg-emerald-500" : margin >= 15 ? "bg-amber-500" : "bg-red-500")} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{p.project_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5",
                        p.project_status === "completed" ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10" :
                        p.project_status === "in_production" ? "text-blue-600 border-blue-500/30 bg-blue-500/10" :
                        "text-muted-foreground"
                      )}>
                        {p.project_status === "in_production" ? "In Progress" : p.project_status}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{fmt(revenue)}</p>
                        <p className={cn("text-xs font-medium", marginColor(margin))}>{margin.toFixed(0)}%</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <JobCostDetailsSheet project={selectedProject} open={!!selectedProject} onClose={() => setSelectedProject(null)} />
      <PerformanceExportSheet
        open={exportOpen}
        onOpenChange={setExportOpen}
        projects={completedJobs}
        periodLabel={PERIODS.find(p => p.value === period)?.label ?? period}
      />
    </div>
  );
}




// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Performance() {
  return (
    <AdminLayout title="Performance">
      <div className="space-y-5">

        <Tabs defaultValue="overview">
          <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto w-full md:w-auto justify-center md:justify-start">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
            >
              <TrendingUp className="w-4 h-4 mr-1.5" /> Overview
            </TabsTrigger>
            <TabsTrigger
              value="weekly"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
            >
              <CalendarDays className="w-4 h-4 mr-1.5" /> Weekly
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-5"><OverviewTab /></TabsContent>
          <TabsContent value="weekly" className="mt-5"><WeeklyReviewTab /></TabsContent>
          
        </Tabs>
      </div>
    </AdminLayout>
  );
}
