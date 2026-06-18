import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, ArrowUpDown, Info } from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";
import { usePayments } from "@/hooks/usePayments";
import { PeriodSelector, getPeriodRange, type PeriodType } from "./PeriodSelector";
import { extractExpenseCategory } from "./expenseCategories";

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtSigned = (v: number) =>
  `${v < 0 ? "-" : ""}$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type SortKey = "job" | "date" | "revenue" | "expenses" | "marginAmount" | "marginPct";
type SortDir = "asc" | "desc";

interface JobRow {
  projectId: string;
  job: string;
  address: string;
  date: string;
  revenue: number;
  expenses: number;
  marginAmount: number;
  marginPct: number;
}

export function PLTab() {
  const navigate = useNavigate();
  const { data: payments = [] } = usePayments();
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [sortKey, setSortKey] = useState<SortKey>("marginAmount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const range = useMemo(() => getPeriodRange(anchor, periodType), [anchor, periodType]);

  const periodPayments = useMemo(
    () =>
      payments.filter((p) => {
        if (p.status !== "confirmed") return false;
        return isWithinInterval(parseISO(p.payment_date), { start: range.start, end: range.end });
      }),
    [payments, range]
  );

  // Revenue = confirmed payments, category 'received' (cash basis)
  const incomePayments = periodPayments.filter((p) => p.category === "received");
  // Expenses = everything else, exclude deposits (those are revenue tags)
  const expensePayments = periodPayments.filter(
    (p) => p.category !== "received" && !p.description?.startsWith("[DEPOSIT")
  );

  const totalRevenue = incomePayments.reduce((s, p) => s + Number(p.amount), 0);

  // Group expenses by bucket: Materials | Payroll | Fuel | Other
  const expenseBuckets = useMemo(() => {
    const buckets: Record<string, { total: number; count: number }> = {
      Materials: { total: 0, count: 0 },
      Payroll: { total: 0, count: 0 },
      Fuel: { total: 0, count: 0 },
      Other: { total: 0, count: 0 },
    };
    expensePayments.forEach((p) => {
      const sub = extractExpenseCategory(p.description);
      let key: string;
      if (p.collaborator_id || p.category === "labor") key = "Payroll";
      else if (sub === "Fuel") key = "Fuel";
      else if (sub === "Materials" || sub === "Supplies" || p.category === "material") key = "Materials";
      else key = "Other";
      buckets[key].total += Number(p.amount);
      buckets[key].count += 1;
    });
    return buckets;
  }, [expensePayments]);

  const totalExpenses = Object.values(expenseBuckets).reduce((s, b) => s + b.total, 0);
  const netProfit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Per-project breakdown
  const jobRows = useMemo<JobRow[]>(() => {
    const byProject = new Map<string, { revenue: number; expenses: number; job: string; address: string; lastDate: string }>();
    [...incomePayments, ...expensePayments].forEach((p) => {
      if (!p.project_id) return;
      const key = p.project_id;
      const existing = byProject.get(key) || {
        revenue: 0,
        expenses: 0,
        job: p.projects?.customer_name || "—",
        address: p.projects?.project_type || "",
        lastDate: p.payment_date,
      };
      if (p.category === "received") existing.revenue += Number(p.amount);
      else existing.expenses += Number(p.amount);
      if (p.payment_date > existing.lastDate) existing.lastDate = p.payment_date;
      byProject.set(key, existing);
    });
    return Array.from(byProject.entries()).map(([projectId, v]) => {
      const marginAmount = v.revenue - v.expenses;
      const marginPct = v.revenue > 0 ? (marginAmount / v.revenue) * 100 : 0;
      return {
        projectId,
        job: v.job,
        address: v.address,
        date: v.lastDate,
        revenue: v.revenue,
        expenses: v.expenses,
        marginAmount,
        marginPct,
      };
    });
  }, [incomePayments, expensePayments]);

  const sortedJobRows = useMemo(() => {
    const arr = [...jobRows];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
    return arr;
  }, [jobRows, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("desc"); }
  };

  const exportCsv = () => {
    const lines: string[] = [];
    lines.push(`P&L Report,${range.label}`);
    lines.push("");
    lines.push("RECEITA");
    lines.push(`Pagamentos recebidos (${incomePayments.length}),${totalRevenue.toFixed(2)}`);
    lines.push(`Total Receita,${totalRevenue.toFixed(2)}`);
    lines.push("");
    lines.push("DESPESAS");
    Object.entries(expenseBuckets).forEach(([k, v]) => {
      lines.push(`${k} (${v.count}),-${v.total.toFixed(2)}`);
    });
    lines.push(`Total Despesas,-${totalExpenses.toFixed(2)}`);
    lines.push("");
    lines.push(`Lucro Líquido,${netProfit.toFixed(2)},${margin.toFixed(1)}%`);
    lines.push("");
    lines.push("Rentabilidade por Projeto");
    lines.push("Job,Date,Revenue,Expenses,Margin ($),Margin (%)");
    sortedJobRows.forEach((r) => {
      lines.push(`"${r.job}",${r.date},${r.revenue.toFixed(2)},${r.expenses.toFixed(2)},${r.marginAmount.toFixed(2)},${r.marginPct.toFixed(1)}%`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pl-${range.label.replace(/[^\w]+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortHeader = ({ k, label, align = "left" }: { k: SortKey; label: string; align?: "left" | "right" }) => (
    <th className={`px-3 py-2 font-medium text-${align}`}>
      <button
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 hover:text-foreground ${sortKey === k ? "text-foreground" : ""}`}
      >
        {label}
        <ArrowUpDown className="w-3 h-3" />
      </button>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Period selector + Export */}
      <div className="relative flex flex-col items-center gap-2">
        <PeriodSelector
          periodType={periodType}
          onPeriodTypeChange={setPeriodType}
          anchor={anchor}
          onAnchorChange={setAnchor}
        />
        <Button
          variant="outline"
          size="sm"
          className="absolute right-0 top-0"
          onClick={exportCsv}
        >
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Section 1 — Header KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Receita</p>
            <p className="text-2xl font-bold text-[hsl(142,71%,35%)] mt-1">{fmt(totalRevenue)}</p>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              base caixa — pagamentos recebidos, não faturados
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Despesas</p>
            <p className="text-2xl font-bold text-[hsl(0,72%,45%)] mt-1">-{fmt(totalExpenses)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {Object.values(expenseBuckets).reduce((s, b) => s + b.count, 0)} lançamentos
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Lucro Líquido</p>
            <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? "text-[hsl(142,71%,35%)]" : "text-[hsl(0,72%,45%)]"}`}>
              {fmtSigned(netProfit)}
            </p>
            <p className={`text-[11px] mt-1 font-medium ${netProfit >= 0 ? "text-[hsl(142,71%,35%)]" : "text-[hsl(0,72%,45%)]"}`}>
              {margin.toFixed(1)}% margem
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section 2 — P&L Statement */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <tbody>
              <tr className="bg-muted/50 border-b border-border">
                <td className="px-4 py-2 text-xs uppercase font-semibold tracking-wide text-muted-foreground" colSpan={2}>
                  Receita
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2 text-muted-foreground">
                  Pagamentos recebidos ({incomePayments.length})
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-[hsl(142,71%,35%)]">
                  {fmt(totalRevenue)}
                </td>
              </tr>
              <tr className="border-b-2 border-border font-semibold">
                <td className="px-4 py-2">Total Receita</td>
                <td className="px-4 py-2 text-right tabular-nums text-[hsl(142,71%,35%)]">
                  {fmt(totalRevenue)}
                </td>
              </tr>

              <tr className="bg-muted/50 border-b border-border">
                <td className="px-4 py-2 text-xs uppercase font-semibold tracking-wide text-muted-foreground" colSpan={2}>
                  Despesas
                </td>
              </tr>
              {Object.entries(expenseBuckets).map(([k, v]) => (
                <tr key={k} className="border-b border-border odd:bg-muted/10">
                  <td className="px-4 py-2 text-muted-foreground">
                    {k} ({v.count})
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-[hsl(0,72%,45%)]">
                    -{fmt(v.total)}
                  </td>
                </tr>
              ))}
              <tr className="border-b-2 border-border font-semibold">
                <td className="px-4 py-2">Total Despesas</td>
                <td className="px-4 py-2 text-right tabular-nums text-[hsl(0,72%,45%)]">
                  -{fmt(totalExpenses)}
                </td>
              </tr>

              <tr className="bg-primary/5">
                <td className="px-4 py-3">
                  <div className="font-bold">Lucro Líquido</div>
                  <div className={`text-xs font-medium ${netProfit >= 0 ? "text-[hsl(142,71%,35%)]" : "text-[hsl(0,72%,45%)]"}`}>
                    {margin.toFixed(1)}% margem
                  </div>
                </td>
                <td className={`px-4 py-3 text-right tabular-nums text-xl font-bold ${netProfit >= 0 ? "text-[hsl(142,71%,35%)]" : "text-[hsl(0,72%,45%)]"}`}>
                  {fmtSigned(netProfit)}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            Receita calculada por pagamentos coletados, não pelo valor faturado.
          </div>
        </CardContent>
      </Card>

      {/* Section 3 — Per-project profitability */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">Rentabilidade por Projeto</h3>
            <p className="text-[11px] text-muted-foreground">Jobs com movimentação no período</p>
          </div>
          {sortedJobRows.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No project activity in this period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <SortHeader k="job" label="Job" />
                    <SortHeader k="date" label="Date" />
                    <SortHeader k="revenue" label="Revenue" align="right" />
                    <SortHeader k="expenses" label="Expenses" align="right" />
                    <SortHeader k="marginAmount" label="Margin ($)" align="right" />
                    <SortHeader k="marginPct" label="Margin (%)" align="right" />
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {sortedJobRows.map((r) => (
                    <tr
                      key={r.projectId}
                      onClick={() => navigate(`/admin/jobs/${r.projectId}`)}
                      className="border-b border-border last:border-0 even:bg-muted/10 hover:bg-accent/40 cursor-pointer"
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium">{r.job}</div>
                        {r.address && <div className="text-[11px] text-muted-foreground">{r.address}</div>}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {format(parseISO(r.date), "MMM dd")}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-[hsl(142,71%,35%)]">
                        {fmt(r.revenue)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-[hsl(0,72%,45%)]">
                        -{fmt(r.expenses)}
                      </td>
                      <td className={`px-3 py-2 text-right tabular-nums font-semibold ${r.marginAmount >= 0 ? "text-[hsl(142,71%,35%)]" : "text-[hsl(0,72%,45%)]"}`}>
                        {fmtSigned(r.marginAmount)}
                      </td>
                      <td className={`px-3 py-2 text-right tabular-nums font-semibold ${r.marginPct >= 0 ? "text-[hsl(142,71%,35%)]" : "text-[hsl(0,72%,45%)]"}`}>
                        {r.marginPct.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-right">
                        {r.marginAmount >= 0
                          ? <TrendingUp className="w-4 h-4 text-[hsl(142,71%,35%)] inline" />
                          : <TrendingDown className="w-4 h-4 text-[hsl(0,72%,45%)] inline" />
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
