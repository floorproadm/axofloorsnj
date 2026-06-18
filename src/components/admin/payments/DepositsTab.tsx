import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { useInvoices } from "@/hooks/useInvoices";
import { usePayments } from "@/hooks/usePayments";
import { RecordDepositDialog } from "./RecordDepositDialog";

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type FilterKey = "all" | "expected" | "owed" | "collected";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "expected", label: "Esperados" },
  { key: "owed", label: "Devidos" },
  { key: "collected", label: "Coletados" },
];

interface Row {
  id: string;
  date: string;
  customer: string;
  type: string;
  source: "Invoice" | "Manual";
  amount: number;
  appliedTo: string;
  bucket: "expected" | "owed" | "collected";
}

export function DepositsTab() {
  const { data: invoices = [] } = useInvoices();
  const { data: payments = [] } = usePayments();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    // Deposit invoices
    invoices.forEach((inv: any) => {
      if (inv.phase !== "deposit") return;
      const paid = inv.status === "paid";
      const overdue = inv.status === "overdue" || inv.status === "draft";
      const bucket: Row["bucket"] = paid ? "collected" : overdue ? "owed" : "expected";
      out.push({
        id: inv.id,
        date: paid && inv.paid_at ? inv.paid_at.slice(0, 10) : inv.due_date,
        customer: inv.projects?.customer_name || inv.customers?.full_name || "—",
        type: "Depósito de Job",
        source: "Invoice",
        amount: Number(inv.total_amount || 0),
        appliedTo: inv.invoice_number,
        bucket,
      });
    });
    // Manual deposits (recorded via RecordDepositDialog)
    payments.forEach((p) => {
      if (!p.description?.startsWith("[DEPOSIT")) return;
      const typeMatch = p.description.match(/\[DEPOSIT:(\w+)\]/);
      const typeKey = typeMatch?.[1] || "job";
      const typeLabel =
        typeKey === "proposal" ? "Depósito de Proposta" :
        typeKey === "retainer" ? "Retainer" : "Depósito de Job";
      out.push({
        id: p.id,
        date: p.payment_date,
        customer: p.projects?.customer_name || p.description.replace(/^\[DEPOSIT:\w+\]\s*/, "") || "—",
        type: typeLabel,
        source: "Manual",
        amount: Number(p.amount),
        appliedTo: "—",
        bucket: "collected",
      });
    });
    return out.sort((a, b) => b.date.localeCompare(a.date));
  }, [invoices, payments]);

  const totals = useMemo(() => {
    const now = new Date();
    const monthRange = { start: startOfMonth(now), end: endOfMonth(now) };
    const collectedRows = rows.filter((r) => r.bucket === "collected");
    const thisMonthCount = collectedRows.filter((r) =>
      isWithinInterval(parseISO(r.date), monthRange)
    ).length;
    const expected = rows.filter((r) => r.bucket === "expected").reduce((s, r) => s + r.amount, 0);
    const owed = rows.filter((r) => r.bucket === "owed").reduce((s, r) => s + r.amount, 0);
    const collected = collectedRows.reduce((s, r) => s + r.amount, 0);
    return { thisMonthCount, expected, owed, collected };
  }, [rows]);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.bucket === filter);

  const footerCollected = filtered.filter((r) => r.bucket === "collected").reduce((s, r) => s + r.amount, 0);
  const footerOwed = filtered.filter((r) => r.bucket === "owed" || r.bucket === "expected").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Este mês", value: String(totals.thisMonthCount), icon: CheckCircle, color: "text-primary" },
          { label: "Esperados", value: fmt(totals.expected), icon: Clock, color: "text-amber-600" },
          { label: "Devidos", value: fmt(totals.owed), icon: AlertTriangle, color: "text-destructive" },
          { label: "Coletados", value: fmt(totals.collected), icon: DollarSign, color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1.5 rounded-lg bg-muted shrink-0 ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase whitespace-nowrap">{s.label}</p>
                  <p className={`text-sm font-bold truncate ${s.color}`}>{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + Action */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Record Deposit
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No deposits</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr className="text-xs uppercase text-muted-foreground">
                    <th className="text-left px-3 py-2 font-medium">Date</th>
                    <th className="text-left px-3 py-2 font-medium">Customer</th>
                    <th className="text-left px-3 py-2 font-medium">Type</th>
                    <th className="text-left px-3 py-2 font-medium">Source</th>
                    <th className="text-right px-3 py-2 font-medium">Amount</th>
                    <th className="text-left px-3 py-2 font-medium">Applied To</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 whitespace-nowrap">{format(parseISO(r.date), "MMM dd, yyyy")}</td>
                      <td className="px-3 py-2">{r.customer}</td>
                      <td className="px-3 py-2">
                        <Badge variant="secondary" className="text-[10px]">{r.type}</Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{r.source}</td>
                      <td className="px-3 py-2 text-right font-semibold">{fmt(r.amount)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.appliedTo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <span>Deposits: <strong className="text-foreground">{filtered.length}</strong></span>
            <span>Collected: <strong className="text-green-600">{fmt(footerCollected)}</strong></span>
            <span>Owed: <strong className="text-destructive">{fmt(footerOwed)}</strong></span>
          </div>
        </CardContent>
      </Card>

      <RecordDepositDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
