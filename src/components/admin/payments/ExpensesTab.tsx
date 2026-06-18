import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, isWithinInterval } from "date-fns";
import { usePayments } from "@/hooks/usePayments";
import { AddExpenseWizard } from "./AddExpenseWizard";
import {
  PILL_CATEGORIES,
  expenseCategoryBadgeClass,
  extractExpenseCategory,
  extractVendor,
  isReimbursable,
} from "./expenseCategories";

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ExpensesTab() {
  const { data: payments = [] } = usePayments();
  const [filter, setFilter] = useState<string>("All");
  const [wizardOpen, setWizardOpen] = useState(false);

  // Expenses = payments that are not 'received' and not labor entries (those have collaborator_id), and not deposits
  const expenses = useMemo(() => {
    return payments
      .filter((p) =>
        p.category !== "received" &&
        !p.description?.startsWith("[DEPOSIT") &&
        !p.collaborator_id // exclude payroll
      )
      .map((p) => ({
        ...p,
        subcategory: extractExpenseCategory(p.description) || "Other",
        vendor: extractVendor(p.description),
        reimbursable: isReimbursable(p.description),
        cleanDescription: (p.description || "").replace(/^\[[^\]]+\]\s*/, "").replace(/\s*\[REIMBURSABLE\]/, "") || "—",
      }));
  }, [payments]);

  const now = new Date();
  const monthRange = { start: startOfMonth(now), end: endOfMonth(now) };
  const ytdRange = { start: startOfYear(now), end: now };

  const stats = useMemo(() => {
    const thisMonth = expenses.filter((e) =>
      isWithinInterval(parseISO(e.payment_date), monthRange)
    );
    const monthTotal = thisMonth.reduce((s, e) => s + Number(e.amount), 0);
    const ytd = expenses
      .filter((e) => isWithinInterval(parseISO(e.payment_date), ytdRange))
      .reduce((s, e) => s + Number(e.amount), 0);
    const avg = expenses.length > 0
      ? expenses.reduce((s, e) => s + Number(e.amount), 0) / expenses.length
      : 0;
    // Top category
    const byCat = new Map<string, number>();
    expenses.forEach((e) => byCat.set(e.subcategory, (byCat.get(e.subcategory) || 0) + Number(e.amount)));
    const topCat = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    return { monthCount: thisMonth.length, monthTotal, ytd, avg, topCat };
  }, [expenses]);

  const filtered = filter === "All"
    ? expenses
    : expenses.filter((e) => e.subcategory.toLowerCase() === filter.toLowerCase());

  const sortedFiltered = useMemo(
    () => [...filtered].sort((a, b) => b.payment_date.localeCompare(a.payment_date)),
    [filtered]
  );

  const footerTotal = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const footerReimb = filtered.filter((e) => e.reimbursable).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Despesas (mês)", value: `${fmt(stats.monthTotal)} · ${stats.monthCount}`, icon: Calendar, color: "text-primary" },
          { label: "YTD", value: fmt(stats.ytd), icon: TrendingUp, color: "text-foreground" },
          { label: "Média / despesa", value: fmt(stats.avg), icon: BarChart3, color: "text-amber-600" },
          { label: "Top categoria", value: stats.topCat, icon: Receipt, color: "text-green-600" },
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
          {PILL_CATEGORIES.map((c) => {
            const isActive = filter === c;
            return (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
        <Button size="sm" onClick={() => setWizardOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Expense
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {sortedFiltered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No expenses</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr className="text-xs uppercase text-muted-foreground">
                    <th className="text-left px-3 py-2 font-medium">Date</th>
                    <th className="text-left px-3 py-2 font-medium">Description</th>
                    <th className="text-left px-3 py-2 font-medium">Category</th>
                    <th className="text-left px-3 py-2 font-medium">Vendor</th>
                    <th className="text-left px-3 py-2 font-medium">Client</th>
                    <th className="text-left px-3 py-2 font-medium">Job</th>
                    <th className="text-right px-3 py-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFiltered.map((e) => (
                    <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 whitespace-nowrap">{format(parseISO(e.payment_date), "MMM dd")}</td>
                      <td className="px-3 py-2">{e.cleanDescription}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${expenseCategoryBadgeClass(e.subcategory)}`}>
                          {e.subcategory}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{e.vendor || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{e.projects?.customer_name || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{e.projects?.project_type || "—"}</td>
                      <td className="px-3 py-2 text-right font-semibold">{fmt(Number(e.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <span>Expenses: <strong className="text-foreground">{filtered.length}</strong></span>
            <span>Total: <strong className="text-foreground">{fmt(footerTotal)}</strong></span>
            <span>Reimbursable: <strong className="text-primary">{fmt(footerReimb)}</strong></span>
          </div>
        </CardContent>
      </Card>

      <AddExpenseWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
