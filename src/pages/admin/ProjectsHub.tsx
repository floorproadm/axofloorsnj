import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useProjectsHub } from "@/hooks/useProjectsHub";
import { useTasks } from "@/hooks/useTasks";
import { formatCurrency } from "@/lib/utils";
import {
  Plus, ChevronDown, ChevronRight, Hammer, Ruler, Package,
  FileText, Users, BarChart3, Camera, BookOpen, ArrowRight,
  Clock, CheckCircle, AlertTriangle, DollarSign, Truck,
  Zap, MapPin, CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Collapsible Section wrapper ── */
function Section({
  title, icon: Icon, count, defaultOpen = true, badge, children,
}: {
  title: string;
  icon: React.ElementType;
  count?: number;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-2 py-3 px-1 group text-left">
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          <Icon className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">{title}</span>
          {count !== undefined && (
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{count}</Badge>
          )}
          {badge}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ── Margin color helper ── */
function marginColor(margin: number | null) {
  if (margin === null) return "text-muted-foreground";
  if (margin >= 30) return "text-emerald-500";
  if (margin >= 15) return "text-amber-500";
  return "text-red-500";
}

export default function ProjectsHub() {
  const navigate = useNavigate();
  const hub = useProjectsHub();
  const { tasks } = useTasks(false);

  const activeTasks = tasks.filter(t => t.status !== "done").slice(0, 6);

  return (
    <AdminLayout title="">
      <div className="max-w-4xl mx-auto space-y-1 px-2 sm:px-4 py-4">
        {/* Page header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-foreground">Gestão de Projetos</h1>
          <p className="text-xs text-muted-foreground">Cockpit operacional — tudo num único lugar</p>
        </div>

        {/* ─── 1. Quick Actions ─── */}
        <Section title="Quick Actions" icon={Zap} defaultOpen={true}>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { label: "New Job", icon: Hammer, onClick: () => navigate("/admin/jobs") },
              { label: "Measurement", icon: Ruler, onClick: () => navigate("/admin/measurements") },
              { label: "Materials", icon: Package, onClick: () => navigate("/admin/jobs") },
              { label: "Invoice", icon: FileText, onClick: () => navigate("/admin/payments") },
              { label: "Partners", icon: Users, onClick: () => navigate("/admin/partners") },
              { label: "Crews", icon: Truck, onClick: () => navigate("/admin/crews") },
            ].map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors text-xs text-muted-foreground hover:text-foreground"
              >
                <a.icon className="w-5 h-5" />
                {a.label}
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
          badge={hub.pendingProposals.length > 0 ? <Badge variant="destructive" className="text-[10px] ml-auto">Action Required</Badge> : null}
        >
          {hub.pendingProposals.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-6">Nenhuma proposta aprovada pendente.</p>
          ) : (
            <div className="space-y-1.5 pl-2">
              {hub.pendingProposals.map((p) => {
                const price = p.selected_tier === "best" ? p.best_price : p.selected_tier === "better" ? p.better_price : p.good_price;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/proposals`)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p.projects?.customer_name || p.proposal_number}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {p.projects?.project_type} · {p.projects?.address || "—"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-semibold text-emerald-500">{formatCurrency(price)}</p>
                      <p className="text-[10px] text-muted-foreground">{p.selected_tier || "good"}</p>
                    </div>
                  </div>
                );
              })}
              <Button variant="ghost" size="sm" className="text-xs w-full" onClick={() => navigate("/admin/proposals")}>
                View all proposals <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}
        </Section>

        {/* ─── 3. Project Stage Pipeline ─── */}
        <Section title="Project Pipeline" icon={CircleDot} count={hub.projects.length}>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: "Pending", count: hub.pipeline.pending, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "Active", count: hub.pipeline.in_progress, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Done", count: hub.pipeline.completed, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            ].map((s) => (
              <div key={s.label} className={cn("rounded-lg p-3 text-center", s.bg)}>
                <p className={cn("text-2xl font-bold", s.color)}>{s.count}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Mini project list — recent 6 */}
          <div className="space-y-1">
            {hub.projects.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => navigate(`/admin/jobs/${p.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm font-medium text-foreground truncate">{p.address || p.customer_name}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-4 truncate">
                    {p.customer_name} · {p.project_type} {p.square_footage ? `· ${p.square_footage} sqft` : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  {p.job_costs ? (
                    <>
                      <p className="text-xs font-medium">{formatCurrency(p.job_costs.estimated_revenue)}</p>
                      <p className={cn("text-[10px] font-medium", marginColor(p.job_costs.margin_percent))}>
                        {p.job_costs.margin_percent !== null ? `${p.job_costs.margin_percent.toFixed(0)}%` : "—"}
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">No costs</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="text-xs w-full mt-1" onClick={() => navigate("/admin/jobs")}>
            Open full pipeline <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Section>

        {/* ─── 4. Tasks ─── */}
        <Section title="Tasks" icon={CheckCircle} count={activeTasks.length} defaultOpen={activeTasks.length > 0}>
          {activeTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-6">Nenhuma task pendente.</p>
          ) : (
            <div className="space-y-1">
              {activeTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/50">
                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0", {
                    "bg-red-500": t.priority === "high",
                    "bg-amber-500": t.priority === "medium",
                    "bg-muted-foreground": t.priority === "low",
                  })} />
                  <p className="text-sm text-foreground truncate flex-1">{t.title}</p>
                  {t.due_date && <span className="text-[10px] text-muted-foreground">{new Date(t.due_date).toLocaleDateString()}</span>}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ─── 5. Measurements ─── */}
        <Section title="Measurements & Site Data" icon={Ruler} count={hub.measurements.length} defaultOpen={false}>
          <div className="space-y-1">
            {hub.measurements.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.projects?.customer_name || "—"}</p>
                  <p className="text-[11px] text-muted-foreground">{m.projects?.address || "—"}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold">{m.total_sqft} sqft</p>
                  <Badge variant={m.status === "completed" ? "default" : "secondary"} className="text-[9px]">{m.status}</Badge>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="text-xs w-full mt-1" onClick={() => navigate("/admin/measurements")}>
            View all <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Section>

        {/* ─── 6. Materials & Costs ─── */}
        <Section title="Materials & Costs" icon={Package} count={hub.materialCosts.length} defaultOpen={false}>
          <div className="space-y-1">
            {hub.materialCosts.map((mc) => (
              <div key={mc.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                <div className="min-w-0">
                  <p className="text-sm truncate">{mc.description}</p>
                  <p className="text-[11px] text-muted-foreground">{mc.supplier || "—"} · {mc.purchase_date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold">{formatCurrency(mc.amount)}</p>
                  {mc.is_paid ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500 text-[9px]">Paid</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[9px]">Unpaid</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ─── 7. Workforce ─── */}
        <Section title="Workforce & Labor" icon={Users} count={hub.laborEntries.length} defaultOpen={false}>
          <div className="space-y-1">
            {hub.laborEntries.map((le) => (
              <div key={le.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{le.worker_name}</p>
                  <p className="text-[11px] text-muted-foreground">{le.role} · {le.work_date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold">{formatCurrency(le.total_cost ?? le.daily_rate * le.days_worked)}</p>
                  <p className="text-[10px] text-muted-foreground">{le.days_worked}d × {formatCurrency(le.daily_rate)}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="text-xs w-full mt-1" onClick={() => navigate("/admin/crews")}>
            Crews & Fleet <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Section>

        {/* ─── 8. Weekly Review ─── */}
        <Section title="Weekly Review & KPIs" icon={BarChart3} defaultOpen={false}>
          {hub.weeklyReview ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Revenue", value: formatCurrency(hub.weeklyReview.total_revenue) },
                { label: "Profit", value: formatCurrency(hub.weeklyReview.total_profit) },
                { label: "Margin", value: `${hub.weeklyReview.avg_margin?.toFixed(0) ?? 0}%`, color: marginColor(hub.weeklyReview.avg_margin) },
                { label: "Jobs Done", value: String(hub.weeklyReview.jobs_completed) },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-lg border border-border/50 p-3 text-center">
                  <p className={cn("text-lg font-bold", kpi.color)}>{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{kpi.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground pl-6">Nenhum review registrado.</p>
          )}
          <Button variant="ghost" size="sm" className="text-xs w-full mt-1" onClick={() => navigate("/admin/weekly-review")}>
            Open Weekly Review <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Section>

        {/* ─── 9. Project Flow Guide ─── */}
        <Section title="Project Flow Guide" icon={BookOpen} defaultOpen={false}>
          <div className="pl-2 space-y-1.5">
            {[
              "1. Approved Proposal → Create Project",
              "2. Schedule Measurement",
              "3. Materials planning",
              "4. Assign crew",
              "5. Execute work",
              "6. Track payments + payroll",
              "7. Quality check (before/after photos)",
              "8. Close & review",
              "9. Request referral",
            ].map((step) => (
              <p key={step} className="text-xs text-muted-foreground">{step}</p>
            ))}
          </div>
        </Section>
      </div>
    </AdminLayout>
  );
}
