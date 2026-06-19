import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Briefcase, Trophy, Download, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { format, subDays, startOfMonth, subMonths } from "date-fns";
import { AXO_ORG_ID } from "@/lib/constants";

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const marginColor = (m: number) =>
  m >= 30 ? "text-emerald-500" : m >= 15 ? "text-amber-500" : "text-red-500";

type Period = "W" | "M" | "Q" | "Y" | "custom";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Week", value: "W" },
  { label: "Month", value: "M" },
  { label: "Quarter", value: "Q" },
  { label: "Year", value: "Y" },
  { label: "Custom", value: "custom" },
];

function getPeriodStart(p: Period, customStart?: string): Date | null {
  const now = new Date();
  if (p === "W") return subDays(now, 7);
  if (p === "M") return subDays(now, 30);
  if (p === "Q") return subDays(now, 90);
  if (p === "Y") return subDays(now, 365);
  if (p === "custom" && customStart) return new Date(customStart);
  return null;
}

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 199 89% 48%))",
  "hsl(var(--chart-3, 142 76% 36%))",
  "hsl(var(--chart-4, 38 92% 50%))",
  "hsl(var(--chart-5, 280 65% 60%))",
  "hsl(var(--muted-foreground))",
];

export function AnalyticsTab() {
  const [period, setPeriod] = useState<Period>("Q");
  const [customStart, setCustomStart] = useState<string>(format(subMonths(new Date(), 3), "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const periodStart = getPeriodStart(period, customStart);
  const periodEndStr = period === "custom" ? customEnd : null;

  // ── Paid invoices joined with projects + job_costs + lead source
  const { data: paidInvoices = [] } = useQuery({
    queryKey: ["analytics-paid-invoices", period, customStart, customEnd],
    queryFn: async () => {
      let q = supabase
        .from("payments")
        .select("id, amount, payment_date, invoice_id, project_id, projects!inner(id, customer_name, customer_id, project_type, project_status, lead_source, completion_date, job_costs(id, total_cost, labor_cost, material_cost, additional_costs))")
        .eq("organization_id", AXO_ORG_ID)
        .eq("status", "confirmed")
        .eq("category", "invoice_payment")
        .not("invoice_id", "is", null);
      if (periodStart) q = q.gte("payment_date", periodStart.toISOString().split("T")[0]);
      if (periodEndStr) q = q.lte("payment_date", periodEndStr);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        amount: Number(r.amount) || 0,
        payment_date: r.payment_date,
        project_id: r.project_id,
        project: {
          ...r.projects,
          job_costs: Array.isArray(r.projects?.job_costs) ? r.projects.job_costs[0] ?? null : r.projects?.job_costs,
        },
      }));
    },
  });

  // Aggregate revenue per project
  const projectAgg = useMemo(() => {
    const map = new Map<string, { project: any; revenue: number }>();
    paidInvoices.forEach((p: any) => {
      if (!p.project_id) return;
      const cur = map.get(p.project_id) ?? { project: p.project, revenue: 0 };
      cur.revenue += p.amount;
      map.set(p.project_id, cur);
    });
    return Array.from(map.values());
  }, [paidInvoices]);

  const totalRevenue = projectAgg.reduce((s, a) => s + a.revenue, 0);
  const totalJobs = projectAgg.length;
  const avgJobValue = totalJobs > 0 ? totalRevenue / totalJobs : 0;

  // ── KPIs
  const byServiceMap = useMemo(() => {
    const map: Record<string, { revenue: number; count: number }> = {};
    projectAgg.forEach(a => {
      const t = a.project?.project_type || "Other";
      if (!map[t]) map[t] = { revenue: 0, count: 0 };
      map[t].revenue += a.revenue;
      map[t].count += 1;
    });
    return map;
  }, [projectAgg]);

  const byServiceList = useMemo(
    () => Object.entries(byServiceMap)
      .map(([name, v]) => ({ name, ...v, pct: totalRevenue > 0 ? (v.revenue / totalRevenue) * 100 : 0 }))
      .sort((a, b) => b.revenue - a.revenue),
    [byServiceMap, totalRevenue]
  );

  const bestService = byServiceList[0]?.name ?? "—";

  // ── Avg Job Value Trend (last 6 months)
  const { data: trendData = [] } = useQuery({
    queryKey: ["analytics-avg-job-trend"],
    queryFn: async () => {
      const sixMonthsAgo = subMonths(new Date(), 5);
      const { data, error } = await supabase
        .from("payments")
        .select("amount, payment_date, project_id")
        .eq("organization_id", AXO_ORG_ID)
        .eq("status", "confirmed")
        .eq("category", "invoice_payment")
        .gte("payment_date", format(startOfMonth(sixMonthsAgo), "yyyy-MM-dd"));
      if (error) throw error;

      const byMonth: Record<string, Map<string, number>> = {};
      (data ?? []).forEach((p: any) => {
        if (!p.payment_date || !p.project_id) return;
        const key = p.payment_date.substring(0, 7);
        if (!byMonth[key]) byMonth[key] = new Map();
        byMonth[key].set(p.project_id, (byMonth[key].get(p.project_id) ?? 0) + Number(p.amount));
      });

      const out: { month: string; avg: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const key = format(d, "yyyy-MM");
        const entries = byMonth[key];
        if (entries && entries.size > 0) {
          const total = Array.from(entries.values()).reduce((s, v) => s + v, 0);
          out.push({ month: format(d, "MMM"), avg: Math.round(total / entries.size) });
        } else {
          out.push({ month: format(d, "MMM"), avg: 0 });
        }
      }
      return out;
    },
  });

  // ── Revenue by Lead Source (RPC)
  const { data: bySource = [] } = useQuery({
    queryKey: ["analytics-revenue-by-source", period, customStart],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_revenue_by_lead_source", {
        p_org_id: AXO_ORG_ID,
        p_start: periodStart ? periodStart.toISOString().split("T")[0] : null,
      });
      if (error) throw error;
      return (data ?? []) as Array<{
        lead_source: string; project_count: number; revenue: number;
        cost: number; profit: number; margin: number;
      }>;
    },
  });

  // ── Top 5 Clients
  const topClients = useMemo(() => {
    const map = new Map<string, { name: string; total: number; jobs: number }>();
    projectAgg.forEach(a => {
      const name = a.project?.customer_name || "—";
      const key = a.project?.customer_id || name;
      const cur = map.get(key) ?? { name, total: 0, jobs: 0 };
      cur.total += a.revenue;
      cur.jobs += 1;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [projectAgg]);

  // ── Job Performance Table
  const jobRows = useMemo(() => {
    return projectAgg.map(a => {
      const cost = a.project?.job_costs?.total_cost ?? 0;
      const margin = a.revenue > 0 ? ((a.revenue - cost) / a.revenue) * 100 : 0;
      return {
        id: a.project?.id,
        customer: a.project?.customer_name || "—",
        type: a.project?.project_type || "—",
        revenue: a.revenue,
        cost,
        margin,
      };
    }).sort((x, y) => y.revenue - x.revenue);
  }, [projectAgg]);

  // ── Export CSV
  const handleExportCSV = () => {
    const periodLabel = PERIODS.find(p => p.value === period)?.label ?? period;
    const lines: string[] = [
      `Analytics Report — ${periodLabel}`,
      `Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
      "",
      "SUMMARY",
      `Total Jobs,${totalJobs}`,
      `Total Revenue,$${totalRevenue.toFixed(2)}`,
      `Avg Job Value,$${avgJobValue.toFixed(2)}`,
      `Best Service,${bestService}`,
      "",
      "REVENUE BY SERVICE",
      "Service,Revenue,Count,Share %",
      ...byServiceList.map(s => `${s.name},$${s.revenue.toFixed(2)},${s.count},${s.pct.toFixed(1)}%`),
      "",
      "REVENUE BY LEAD SOURCE",
      "Source,Revenue,Jobs,Margin %",
      ...bySource.map(s => `${s.lead_source},$${Number(s.revenue).toFixed(2)},${s.project_count},${Number(s.margin).toFixed(1)}%`),
      "",
      "TOP CLIENTS",
      "Client,Total Spent,Jobs",
      ...topClients.map(c => `${c.name},$${c.total.toFixed(2)},${c.jobs}`),
      "",
      "JOB PERFORMANCE",
      "Customer,Type,Revenue,Cost,Margin %",
      ...jobRows.map(j => `${j.customer},${j.type},$${j.revenue.toFixed(2)},$${j.cost.toFixed(2)},${j.margin.toFixed(1)}%`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${periodLabel}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sourceChartData = bySource.map(s => ({
    name: s.lead_source.charAt(0).toUpperCase() + s.lead_source.slice(1),
    value: Number(s.revenue),
  }));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top bar: period filter + export */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map(p => (
              <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {period === "custom" && (
          <>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-8 text-xs rounded-md border border-input bg-background px-2"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-8 text-xs rounded-md border border-input bg-background px-2"
            />
          </>
        )}
        <Button variant="outline" size="sm" className="ml-auto h-8" onClick={handleExportCSV}>
          <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Section 1: 3 unique KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Avg Job Value</p>
            <p className="text-2xl font-bold text-blue-500">{fmt(avgJobValue)}</p>
            <p className="text-[11px] text-muted-foreground">{totalJobs} job{totalJobs !== 1 ? "s" : ""} billed</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Total Jobs Completed</p>
            <p className="text-2xl font-bold">{totalJobs}</p>
            <p className="text-[11px] text-muted-foreground">in this period</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Best Performing Service</p>
            <p className="text-lg font-bold truncate">{bestService}</p>
            <p className="text-[11px] text-muted-foreground">
              {byServiceList[0] ? `${fmt(byServiceList[0].revenue)} · ${byServiceList[0].pct.toFixed(0)}%` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Avg Job Value trend */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Avg Job Value — Last 6 Months
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: any) => [fmt(v), "Avg"]} />
              <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Section 2: Revenue by Service Type (horizontal bars) */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Revenue by Service Type</p>
          {byServiceList.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">No data for this period</div>
          ) : (
            <div className="space-y-2.5">
              {byServiceList.map(s => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="w-32 truncate text-xs font-medium flex-shrink-0">{s.name}</div>
                  <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full transition-all"
                      style={{ width: `${Math.max(2, s.pct)}%` }}
                    />
                  </div>
                  <div className="text-right flex-shrink-0 min-w-[110px]">
                    <span className="text-xs font-semibold">{fmt(s.revenue)}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">{s.pct.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Revenue by Lead Source (donut) */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Revenue by Lead Source</p>
          {sourceChartData.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">No source data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={sourceChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {sourceChartData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => fmt(Number(v))} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Job Performance Table */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Job Performance ({jobRows.length})
          </p>
          {jobRows.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No jobs in this period</div>
          ) : (
            <div className="overflow-x-auto -mx-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border/50">
                    <th className="px-4 py-2 font-medium">Customer</th>
                    <th className="px-2 py-2 font-medium">Service</th>
                    <th className="px-2 py-2 font-medium text-right">Revenue</th>
                    <th className="px-2 py-2 font-medium text-right">Cost</th>
                    <th className="px-4 py-2 font-medium text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {jobRows.map(j => (
                    <tr key={j.id} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="px-4 py-2 font-medium truncate max-w-[160px]">{j.customer}</td>
                      <td className="px-2 py-2 text-muted-foreground truncate max-w-[140px]">{j.type}</td>
                      <td className="px-2 py-2 text-right font-semibold">{fmt(j.revenue)}</td>
                      <td className="px-2 py-2 text-right text-muted-foreground">{j.cost > 0 ? fmt(j.cost) : "—"}</td>
                      <td className={cn("px-4 py-2 text-right font-semibold", j.cost > 0 ? marginColor(j.margin) : "text-muted-foreground")}>
                        {j.cost > 0 ? `${j.margin.toFixed(0)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 5: Top 5 Clients */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top 5 Clients by Revenue</p>
          </div>
          {topClients.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No client data for this period</div>
          ) : (
            <div className="space-y-2">
              {topClients.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/30">
                  <div className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                    i === 0 ? "bg-amber-500/20 text-amber-600" :
                    i === 1 ? "bg-slate-400/20 text-slate-500" :
                    i === 2 ? "bg-orange-500/20 text-orange-600" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {i === 0 ? <Award className="w-3.5 h-3.5" /> : `#${i + 1}`}
                  </div>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">{c.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      <Briefcase className="w-3 h-3 inline mr-0.5" /> {c.jobs} job{c.jobs !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold">{fmt(c.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
