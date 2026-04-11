import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useProjectsHub } from "@/hooks/useProjectsHub";
import { useTasks } from "@/hooks/useTasks";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  ChevronDown, ChevronRight, Hammer, Ruler, Package,
  FileText, Users, BarChart3, BookOpen, ArrowRight,
  CheckCircle, AlertTriangle, Truck,
  Zap, CircleDot, Loader2, DollarSign,
  Calendar, Clock, TrendingUp,
} from "lucide-react";

/* ── Status config ── */
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-[hsl(var(--state-risk))]" },
  planning: { label: "Planning", color: "bg-[hsl(var(--state-risk))]" },
  in_production: { label: "Active", color: "bg-blue-500" },
  in_progress: { label: "Active", color: "bg-blue-500" },
  completed: { label: "Done", color: "bg-[hsl(var(--state-success))]" },
  awaiting_payment: { label: "Awaiting $", color: "bg-purple-500" },
  paid: { label: "Paid", color: "bg-[hsl(var(--state-success))]" },
};

function StatusDot({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] || { color: "bg-muted-foreground" };
  return <span className={cn("inline-block w-2 h-2 rounded-full flex-shrink-0", cfg.color)} />;
}

/* ── Margin semaphore ── */
function marginColor(margin: number | null) {
  if (margin === null) return "text-muted-foreground";
  if (margin >= 30) return "text-[hsl(var(--state-success))]";
  if (margin >= 15) return "text-[hsl(var(--state-risk))]";
  return "text-[hsl(var(--state-blocked))]";
}

/* ── Collapsible Section ── */
function Section({
  title, icon: Icon, count, defaultOpen = true, badge, children, action,
}: {
  title: string;
  icon: React.ElementType;
  count?: number;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border-b border-border/40">
        <div className="flex items-center">
          <CollapsibleTrigger asChild>
            <button className="flex-1 flex items-center gap-2 py-3 px-3 group text-left hover:bg-muted/30 transition-colors">
              {open
                ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              }
              <Icon className="w-4 h-4 text-primary/70" />
              <span className="font-semibold text-[13px] text-foreground tracking-tight">{title}</span>
              {count !== undefined && (
                <span className="text-[11px] text-muted-foreground/70 tabular-nums ml-0.5">{count}</span>
              )}
              {badge}
            </button>
          </CollapsibleTrigger>
          {action && <div className="pr-3">{action}</div>}
        </div>
        <CollapsibleContent>
          <div className="pb-4 px-3">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/* ── Clickable row ── */
function Row({ onClick, children, className }: { onClick?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between py-2 px-2 rounded-md transition-colors",
        onClick && "cursor-pointer hover:bg-muted/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ViewAllLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 mt-2 text-[11px] text-primary/60 hover:text-primary transition-colors font-medium"
    >
      {label} <ArrowRight className="w-3 h-3" />
    </button>
  );
}

/* ── Empty state ── */
function Empty({ text }: { text: string }) {
  return <p className="text-[11px] text-muted-foreground/60 py-3 pl-2 italic">{text}</p>;
}

export default function ProjectsHub() {
  const navigate = useNavigate();
  const hub = useProjectsHub();
  const { tasks } = useTasks(false);
  const activeTasks = tasks.filter(t => t.status !== "done").slice(0, 6);

  if (hub.isLoading) {
    return (
      <AdminLayout title="">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  /* aggregate KPIs */
  const totalRevenue = hub.projects.reduce((sum, p) => sum + (p.job_costs?.estimated_revenue ?? 0), 0);
  const totalCost = hub.projects.reduce((sum, p) => sum + (p.job_costs?.total_cost ?? 0), 0);
  const avgMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0;

  return (
    <AdminLayout title="">
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-0">

        {/* ─── Header + KPI Strip ─── */}
        <div className="mb-5">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Gestão de Projetos</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">Cockpit operacional — ciclo completo em uma tela</p>
            </div>
          </div>

          {/* KPI bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: CircleDot, label: "Active Jobs", value: String(hub.pipeline.in_progress), accent: false },
              { icon: DollarSign, label: "Pipeline Rev.", value: formatCurrency(totalRevenue), accent: false },
              { icon: TrendingUp, label: "Avg Margin", value: `${avgMargin.toFixed(0)}%`, accent: true, color: marginColor(avgMargin) },
              { icon: AlertTriangle, label: "Action Req.", value: String(hub.pendingProposals.length), accent: hub.pendingProposals.length > 0, color: hub.pendingProposals.length > 0 ? "text-[hsl(var(--state-blocked))]" : undefined },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-border/40 bg-card py-3 px-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <kpi.icon className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{kpi.label}</span>
                </div>
                <p className={cn("text-xl font-bold tabular-nums leading-none", kpi.color)}>{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 1. Quick Actions ─── */}
        <Section title="Quick Actions" icon={Zap}>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {[
              { label: "New Job", icon: Hammer, path: "/admin/jobs" },
              { label: "Measurement", icon: Ruler, path: "/admin/measurements" },
              { label: "Materials", icon: Package, path: "/admin/jobs" },
              { label: "Invoice", icon: FileText, path: "/admin/payments" },
              { label: "Partners", icon: Users, path: "/admin/partners" },
              { label: "Crews", icon: Truck, path: "/admin/crews" },
            ].map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border border-border/30 bg-card hover:bg-muted/50 hover:border-primary/20 transition-all text-[11px] text-muted-foreground hover:text-foreground group"
              >
                <a.icon className="w-4 h-4 group-hover:text-primary transition-colors" />
                <span className="font-medium">{a.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* ─── 2. Approved Proposals → Projects ─── */}
        <Section
          title="Approved Proposals → Projects"
          icon={AlertTriangle}
          count={hub.pendingProposals.length}
          defaultOpen={hub.pendingProposals.length > 0}
          badge={hub.pendingProposals.length > 0
            ? <Badge className="ml-auto bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))] border-0 text-[10px] font-medium px-1.5 py-0">Action</Badge>
            : null
          }
          action={<ViewAllLink label="All proposals" onClick={() => navigate("/admin/proposals")} />}
        >
          {hub.pendingProposals.length === 0 ? (
            <Empty text="No approved proposals pending conversion." />
          ) : (
            <div className="space-y-px">
              {hub.pendingProposals.map((p) => {
                const price = p.selected_tier === "best" ? p.best_price : p.selected_tier === "better" ? p.better_price : p.good_price;
                return (
                  <Row key={p.id} onClick={() => navigate("/admin/proposals")}>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {p.projects?.customer_name || p.proposal_number}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {p.projects?.project_type}{p.projects?.address ? ` · ${p.projects.address}` : ""}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-[13px] font-semibold text-[hsl(var(--state-success))] tabular-nums">{formatCurrency(price)}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{p.selected_tier || "good"} tier</p>
                    </div>
                  </Row>
                );
              })}
            </div>
          )}
        </Section>

        {/* ─── 3. Project Pipeline ─── */}
        <Section
          title="Project Pipeline"
          icon={CircleDot}
          count={hub.projects.length}
          action={<ViewAllLink label="Full pipeline" onClick={() => navigate("/admin/jobs")} />}
        >
          {/* Pipeline summary strip */}
          <div className="flex gap-1.5 mb-3">
            {[
              { label: "Pending", count: hub.pipeline.pending, color: "border-l-[hsl(var(--state-risk))]" },
              { label: "Active", count: hub.pipeline.in_progress, color: "border-l-blue-500" },
              { label: "Done", count: hub.pipeline.completed, color: "border-l-[hsl(var(--state-success))]" },
            ].map((s) => (
              <div key={s.label} className={cn("flex-1 rounded-md border border-border/30 bg-card py-2.5 px-3 border-l-[3px]", s.color)}>
                <p className="text-xl font-bold text-foreground tabular-nums leading-none">{s.count}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Recent projects */}
          <div className="space-y-px">
            {hub.projects.slice(0, 8).map((p) => (
              <Row key={p.id} onClick={() => navigate(`/admin/jobs/${p.id}`)}>
                <div className="min-w-0 flex-1 flex items-start gap-2.5">
                  <StatusDot status={p.project_status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-foreground truncate leading-tight">
                      {p.address || p.customer_name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="truncate">{p.customer_name}</span>
                      <span className="text-border">·</span>
                      <span className="truncate">{p.project_type}</span>
                      {p.square_footage && (
                        <>
                          <span className="text-border">·</span>
                          <span className="tabular-nums flex-shrink-0">{p.square_footage} sqft</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  {p.job_costs ? (
                    <>
                      <p className="text-[12px] font-medium tabular-nums">{formatCurrency(p.job_costs.estimated_revenue)}</p>
                      <p className={cn("text-[10px] font-semibold tabular-nums", marginColor(p.job_costs.margin_percent))}>
                        {p.job_costs.margin_percent !== null ? `${p.job_costs.margin_percent.toFixed(0)}%` : "—"}
                      </p>
                    </>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/50 italic">—</span>
                  )}
                </div>
              </Row>
            ))}
          </div>
        </Section>

        {/* ─── 4. Tasks ─── */}
        <Section title="Tasks" icon={CheckCircle} count={activeTasks.length} defaultOpen={activeTasks.length > 0}>
          {activeTasks.length === 0 ? (
            <Empty text="No pending tasks." />
          ) : (
            <div className="space-y-px">
              {activeTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-muted/30 transition-colors">
                  <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", {
                    "bg-[hsl(var(--state-blocked))]": t.priority === "high",
                    "bg-[hsl(var(--state-risk))]": t.priority === "medium",
                    "bg-muted-foreground/40": t.priority === "low",
                  })} />
                  <p className="text-[13px] text-foreground truncate flex-1">{t.title}</p>
                  {t.due_date && (
                    <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
                      {formatDate(t.due_date)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ─── 5. Measurements ─── */}
        <Section title="Measurements" icon={Ruler} count={hub.measurements.length} defaultOpen={false}
          action={<ViewAllLink label="All" onClick={() => navigate("/admin/measurements")} />}
        >
          {hub.measurements.length === 0 ? (
            <Empty text="No recent measurements." />
          ) : (
            <div className="space-y-px">
              {hub.measurements.map((m) => (
                <Row key={m.id}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium truncate">{m.projects?.customer_name || "—"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{m.projects?.address || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0 ml-3">
                    <p className="text-[13px] font-semibold tabular-nums">{m.total_sqft} sqft</p>
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                      m.status === "completed"
                        ? "bg-[hsl(var(--state-success-bg))] text-[hsl(var(--state-success))]"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {m.status}
                    </span>
                  </div>
                </Row>
              ))}
            </div>
          )}
        </Section>

        {/* ─── 6. Materials & Costs ─── */}
        <Section title="Materials & Costs" icon={Package} count={hub.materialCosts.length} defaultOpen={false}>
          {hub.materialCosts.length === 0 ? (
            <Empty text="No costs recorded." />
          ) : (
            <div className="space-y-px">
              {hub.materialCosts.map((mc) => (
                <Row key={mc.id}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] truncate">{mc.description}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {mc.supplier || "—"} · {formatDate(mc.purchase_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <p className="text-[13px] font-semibold tabular-nums">{formatCurrency(mc.amount)}</p>
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      mc.is_paid ? "bg-[hsl(var(--state-success))]" : "bg-[hsl(var(--state-risk))]"
                    )} title={mc.is_paid ? "Paid" : "Unpaid"} />
                  </div>
                </Row>
              ))}
            </div>
          )}
        </Section>

        {/* ─── 7. Workforce & Labor ─── */}
        <Section title="Workforce & Labor" icon={Users} count={hub.laborEntries.length} defaultOpen={false}
          action={<ViewAllLink label="Crews" onClick={() => navigate("/admin/crews")} />}
        >
          {hub.laborEntries.length === 0 ? (
            <Empty text="No labor records." />
          ) : (
            <div className="space-y-px">
              {hub.laborEntries.map((le) => (
                <Row key={le.id}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium truncate">{le.worker_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {le.role || "—"} · {formatDate(le.work_date)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-[13px] font-semibold tabular-nums">{formatCurrency(le.total_cost ?? le.daily_rate * le.days_worked)}</p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">{le.days_worked}d × {formatCurrency(le.daily_rate)}</p>
                  </div>
                </Row>
              ))}
            </div>
          )}
        </Section>

        {/* ─── 8. Weekly Review & KPIs ─── */}
        <Section title="Weekly Review" icon={BarChart3} defaultOpen={false}
          action={<ViewAllLink label="Review" onClick={() => navigate("/admin/weekly-review")} />}
        >
          {hub.weeklyReview ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(hub.weeklyReview.week_start)} — {formatDate(hub.weeklyReview.week_end)}</span>
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full ml-auto",
                  hub.weeklyReview.status === "closed"
                    ? "bg-[hsl(var(--state-success-bg))] text-[hsl(var(--state-success))]"
                    : "bg-muted text-muted-foreground"
                )}>
                  {hub.weeklyReview.status}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: "Revenue", value: formatCurrency(hub.weeklyReview.total_revenue) },
                  { label: "Profit", value: formatCurrency(hub.weeklyReview.total_profit) },
                  { label: "Margin", value: `${hub.weeklyReview.avg_margin?.toFixed(0) ?? 0}%`, color: marginColor(hub.weeklyReview.avg_margin) },
                  { label: "Jobs", value: String(hub.weeklyReview.jobs_completed) },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-md border border-border/30 bg-card py-2 px-2.5 text-center">
                    <p className={cn("text-sm font-bold tabular-nums", kpi.color)}>{kpi.value}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{kpi.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Empty text="No review recorded yet." />
          )}
        </Section>

        {/* ─── 9. Project Flow Guide ─── */}
        <Section title="Project Flow Guide" icon={BookOpen} defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1">
            {[
              { step: "01", text: "Approved Proposal → Create Project" },
              { step: "02", text: "Schedule Measurement" },
              { step: "03", text: "Materials planning" },
              { step: "04", text: "Assign crew" },
              { step: "05", text: "Execute work" },
              { step: "06", text: "Track payments + payroll" },
              { step: "07", text: "QC — before/after photos" },
              { step: "08", text: "Close & review" },
              { step: "09", text: "Request referral" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-2.5 py-1.5">
                <span className="text-[10px] font-mono text-primary/50 w-4 tabular-nums">{item.step}</span>
                <span className="text-[12px] text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AdminLayout>
  );
}
