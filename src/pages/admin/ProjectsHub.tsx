import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useProjectsHub } from "@/hooks/useProjectsHub";
import { useTasks } from "@/hooks/useTasks";
import { formatCurrency, cn } from "@/lib/utils";
import {
  ChevronDown, ChevronRight, Hammer, Ruler, Package,
  FileText, Users, BarChart3, BookOpen, ArrowRight,
  CheckCircle, AlertTriangle, Truck,
  Zap, MapPin, CircleDot, Loader2,
} from "lucide-react";

/* ── Status dot ── */
function StatusDot({ status }: { status: string }) {
  const color = {
    pending: "bg-amber-400",
    in_production: "bg-blue-400",
    in_progress: "bg-blue-400",
    completed: "bg-emerald-400",
  }[status] || "bg-muted-foreground";
  return <span className={cn("inline-block w-2 h-2 rounded-full flex-shrink-0", color)} />;
}

/* ── Collapsible Section ── */
function Section({
  title, icon: Icon, count, defaultOpen = true, badge, children, noPad,
}: {
  title: string;
  icon: React.ElementType;
  count?: number;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
  noPad?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/40 last:border-b-0">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-2.5 py-3 px-1 group text-left hover:bg-muted/30 rounded-md transition-colors -mx-1 px-2">
            {open
              ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform" />
              : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground transition-transform" />
            }
            <Icon className="w-4 h-4 text-primary/80" />
            <span className="font-semibold text-[13px] text-foreground tracking-tight">{title}</span>
            {count !== undefined && (
              <span className="text-[11px] text-muted-foreground tabular-nums">{count}</span>
            )}
            {badge && <div className="ml-auto">{badge}</div>}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className={cn("pb-4", noPad ? "" : "pl-2")}>
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/* ── Margin color ── */
function marginColor(margin: number | null) {
  if (margin === null) return "text-muted-foreground";
  if (margin >= 30) return "text-emerald-500";
  if (margin >= 15) return "text-amber-500";
  return "text-red-500";
}

/* ── Row component ── */
function Row({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between py-2 px-2.5 rounded-md transition-colors",
        onClick && "cursor-pointer hover:bg-muted/40"
      )}
    >
      {children}
    </div>
  );
}

function ViewAllButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-1 py-2 text-[11px] text-primary/70 hover:text-primary transition-colors font-medium"
    >
      {label} <ArrowRight className="w-3 h-3" />
    </button>
  );
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

  return (
    <AdminLayout title="">
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-5 space-y-0">

        {/* ─── Header ─── */}
        <div className="mb-6">
          <h1 className="text-lg font-bold text-foreground tracking-tight">Gestão de Projetos</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Cockpit operacional — visão unificada de todo o ciclo</p>
        </div>

        {/* ─── 1. Quick Actions ─── */}
        <Section title="Quick Actions" icon={Zap} defaultOpen={true} noPad>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 px-2">
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
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border border-border/30 bg-card/50 hover:bg-primary/5 hover:border-primary/20 transition-all text-[11px] text-muted-foreground hover:text-foreground group"
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
            ? <Badge className="bg-red-500/10 text-red-500 border-0 text-[10px] font-medium px-1.5">Action Required</Badge>
            : null
          }
        >
          {hub.pendingProposals.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-2">Nenhuma proposta aprovada pendente.</p>
          ) : (
            <div className="space-y-0.5">
              {hub.pendingProposals.map((p) => {
                const price = p.selected_tier === "best" ? p.best_price : p.selected_tier === "better" ? p.better_price : p.good_price;
                return (
                  <Row key={p.id} onClick={() => navigate("/admin/proposals")}>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {p.projects?.customer_name || p.proposal_number}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {p.projects?.project_type} · {p.projects?.address || "—"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-[13px] font-semibold text-emerald-500 tabular-nums">{formatCurrency(price)}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{p.selected_tier || "good"}</p>
                    </div>
                  </Row>
                );
              })}
              <ViewAllButton label="View all proposals" onClick={() => navigate("/admin/proposals")} />
            </div>
          )}
        </Section>

        {/* ─── 3. Project Pipeline ─── */}
        <Section title="Project Pipeline" icon={CircleDot} count={hub.projects.length}>
          {/* Pipeline summary strip */}
          <div className="flex gap-1 mb-3">
            {[
              { label: "Pending", count: hub.pipeline.pending, dot: "bg-amber-400" },
              { label: "Active", count: hub.pipeline.in_progress, dot: "bg-blue-400" },
              { label: "Done", count: hub.pipeline.completed, dot: "bg-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="flex-1 rounded-md border border-border/30 bg-card/50 py-2.5 px-3 flex items-center gap-2">
                <span className={cn("w-2.5 h-2.5 rounded-full", s.dot)} />
                <div>
                  <p className="text-lg font-bold text-foreground tabular-nums leading-none">{s.count}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Project rows */}
          <div className="space-y-0.5">
            {hub.projects.slice(0, 6).map((p) => (
              <Row key={p.id} onClick={() => navigate(`/admin/jobs/${p.id}`)}>
                <div className="min-w-0 flex-1 flex items-start gap-2">
                  <StatusDot status={p.project_status} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate leading-tight">
                      {p.address || p.customer_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {p.customer_name} · {p.project_type}
                      {p.square_footage ? ` · ${p.square_footage} sqft` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  {p.job_costs ? (
                    <>
                      <p className="text-[12px] font-medium tabular-nums">{formatCurrency(p.job_costs.estimated_revenue)}</p>
                      <p className={cn("text-[10px] font-semibold tabular-nums", marginColor(p.job_costs.margin_percent))}>
                        {p.job_costs.margin_percent !== null ? `${p.job_costs.margin_percent.toFixed(0)}% margin` : "—"}
                      </p>
                    </>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">No costs</span>
                  )}
                </div>
              </Row>
            ))}
          </div>
          <ViewAllButton label="Open full pipeline" onClick={() => navigate("/admin/jobs")} />
        </Section>

        {/* ─── 4. Tasks ─── */}
        <Section title="Tasks" icon={CheckCircle} count={activeTasks.length} defaultOpen={activeTasks.length > 0}>
          {activeTasks.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-2">Nenhuma task pendente.</p>
          ) : (
            <div className="space-y-0.5">
              {activeTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2.5 py-1.5 px-2.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", {
                    "bg-red-500": t.priority === "high",
                    "bg-amber-400": t.priority === "medium",
                    "bg-muted-foreground/50": t.priority === "low",
                  })} />
                  <p className="text-[13px] text-foreground truncate flex-1">{t.title}</p>
                  {t.due_date && (
                    <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
                      {new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ─── 5. Measurements ─── */}
        <Section title="Measurements & Site Data" icon={Ruler} count={hub.measurements.length} defaultOpen={false}>
          {hub.measurements.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-2">Sem medições recentes.</p>
          ) : (
            <div className="space-y-0.5">
              {hub.measurements.map((m) => (
                <Row key={m.id}>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate">{m.projects?.customer_name || "—"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{m.projects?.address || "—"}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-[13px] font-semibold tabular-nums">{m.total_sqft} sqft</p>
                    <Badge
                      variant={m.status === "completed" ? "default" : "secondary"}
                      className="text-[9px] px-1.5 py-0"
                    >
                      {m.status}
                    </Badge>
                  </div>
                </Row>
              ))}
              <ViewAllButton label="View all measurements" onClick={() => navigate("/admin/measurements")} />
            </div>
          )}
        </Section>

        {/* ─── 6. Materials & Costs ─── */}
        <Section title="Materials & Costs" icon={Package} count={hub.materialCosts.length} defaultOpen={false}>
          {hub.materialCosts.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-2">Sem custos registrados.</p>
          ) : (
            <div className="space-y-0.5">
              {hub.materialCosts.map((mc) => (
                <Row key={mc.id}>
                  <div className="min-w-0">
                    <p className="text-[13px] truncate">{mc.description}</p>
                    <p className="text-[11px] text-muted-foreground">{mc.supplier || "—"} · {mc.purchase_date}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3 flex items-center gap-2">
                    <p className="text-[13px] font-semibold tabular-nums">{formatCurrency(mc.amount)}</p>
                    {mc.is_paid
                      ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Paid" />
                      : <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Unpaid" />
                    }
                  </div>
                </Row>
              ))}
            </div>
          )}
        </Section>

        {/* ─── 7. Workforce ─── */}
        <Section title="Workforce & Labor" icon={Users} count={hub.laborEntries.length} defaultOpen={false}>
          {hub.laborEntries.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-2">Sem registros de mão de obra.</p>
          ) : (
            <div className="space-y-0.5">
              {hub.laborEntries.map((le) => (
                <Row key={le.id}>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate">{le.worker_name}</p>
                    <p className="text-[11px] text-muted-foreground">{le.role} · {le.work_date}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-[13px] font-semibold tabular-nums">{formatCurrency(le.total_cost ?? le.daily_rate * le.days_worked)}</p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">{le.days_worked}d × {formatCurrency(le.daily_rate)}</p>
                  </div>
                </Row>
              ))}
              <ViewAllButton label="Crews & Fleet" onClick={() => navigate("/admin/crews")} />
            </div>
          )}
        </Section>

        {/* ─── 8. Weekly Review ─── */}
        <Section title="Weekly Review & KPIs" icon={BarChart3} defaultOpen={false}>
          {hub.weeklyReview ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { label: "Revenue", value: formatCurrency(hub.weeklyReview.total_revenue) },
                { label: "Profit", value: formatCurrency(hub.weeklyReview.total_profit) },
                { label: "Margin", value: `${hub.weeklyReview.avg_margin?.toFixed(0) ?? 0}%`, color: marginColor(hub.weeklyReview.avg_margin) },
                { label: "Jobs Done", value: String(hub.weeklyReview.jobs_completed) },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-md border border-border/30 bg-card/50 py-2.5 px-3 text-center">
                  <p className={cn("text-base font-bold tabular-nums", kpi.color)}>{kpi.value}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{kpi.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground py-2">Nenhum review registrado.</p>
          )}
          <ViewAllButton label="Open Weekly Review" onClick={() => navigate("/admin/weekly-review")} />
        </Section>

        {/* ─── 9. Project Flow Guide ─── */}
        <Section title="Project Flow Guide" icon={BookOpen} defaultOpen={false}>
          <div className="space-y-0">
            {[
              { step: "01", text: "Approved Proposal → Create Project" },
              { step: "02", text: "Schedule Measurement" },
              { step: "03", text: "Materials planning" },
              { step: "04", text: "Assign crew" },
              { step: "05", text: "Execute work" },
              { step: "06", text: "Track payments + payroll" },
              { step: "07", text: "Quality check (before/after photos)" },
              { step: "08", text: "Close & review" },
              { step: "09", text: "Request referral" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3 py-1.5 px-2">
                <span className="text-[10px] font-mono text-primary/60 w-4">{item.step}</span>
                <span className="text-[12px] text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AdminLayout>
  );
}
