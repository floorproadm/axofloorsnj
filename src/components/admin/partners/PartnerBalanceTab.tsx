import { usePartnerBalance } from "@/hooks/usePartnerBalance";
import { Loader2, DollarSign, TrendingUp, Briefcase, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const fmt = (v: number) => `$${Math.round(Number(v || 0)).toLocaleString()}`;

export function PartnerBalanceTab({ partnerId }: { partnerId: string }) {
  const { data, isLoading, error } = usePartnerBalance(partnerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  if (error || !data) {
    return <div className="text-center py-8 text-sm text-muted-foreground">No balance data available</div>;
  }

  const { totals, aging, recent_projects, open_invoices } = data;

  return (
    <div className="space-y-4 pt-3">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KPI label="Lifetime Revenue" value={fmt(totals.lifetime_revenue)} icon={<DollarSign className="w-3.5 h-3.5" />} tone="emerald" />
        <KPI label="Received" value={fmt(totals.lifetime_received)} icon={<TrendingUp className="w-3.5 h-3.5" />} tone="blue" />
        <KPI label="Open Balance" value={fmt(totals.open_balance)} icon={<AlertCircle className="w-3.5 h-3.5" />} tone={totals.open_balance > 0 ? "amber" : "muted"} />
        <KPI label="Open Projects" value={String(totals.open_projects)} icon={<Briefcase className="w-3.5 h-3.5" />} tone="muted" />
      </div>

      {/* Aging */}
      <div className="rounded-lg border border-border/40 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Receivables Aging</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Current", value: aging.current, tone: "text-emerald-700" },
            { label: "1-30d", value: aging.days_30, tone: "text-blue-700" },
            { label: "31-60d", value: aging.days_60, tone: "text-amber-700" },
            { label: "60+d", value: aging.days_90_plus, tone: "text-red-700" },
          ].map((b) => (
            <div key={b.label} className="rounded-md bg-muted/40 p-2">
              <p className={`text-sm font-bold tabular-nums ${b.tone}`}>{fmt(b.value)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{b.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Open invoices */}
      {open_invoices.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2">Open Invoices ({open_invoices.length})</p>
          <div className="space-y-1.5">
            {open_invoices.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between rounded-md border border-border/40 p-2.5 text-xs">
                <div>
                  <p className="font-medium">{inv.invoice_number || "—"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Due {inv.due_date ? format(new Date(inv.due_date), "MMM dd") : "—"}
                    {inv.days_overdue > 0 && <span className="text-amber-700 ml-1">· {inv.days_overdue}d overdue</span>}
                  </p>
                </div>
                <p className="font-bold tabular-nums">{fmt(inv.total_amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent projects */}
      {recent_projects.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2">Recent Projects</p>
          <div className="space-y-1.5">
            {recent_projects.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border border-border/40 p-2.5 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{p.address || p.customer_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {p.project_type} · {p.project_status}
                  </p>
                </div>
                <p className="font-semibold tabular-nums ml-2">{fmt(p.estimated_cost || 0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: string }) {
  const toneMap: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-700 border-emerald-200/60",
    blue: "bg-blue-500/10 text-blue-700 border-blue-200/60",
    amber: "bg-amber-500/10 text-amber-700 border-amber-200/60",
    muted: "bg-muted/40 text-foreground border-border/40",
  };
  return (
    <div className={`rounded-lg border p-3 ${toneMap[tone]}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-80">
        {icon} {label}
      </div>
      <p className="text-xl font-bold tabular-nums mt-1">{value}</p>
    </div>
  );
}
