import { useMemo } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import type { Payment } from "@/hooks/usePayments";

interface PLPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: Payment[];
  periodLabel: string;
}

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function PLPreviewDialog({ open, onOpenChange, payments, periodLabel }: PLPreviewDialogProps) {
  const confirmed = useMemo(() => payments.filter((p) => p.status === "confirmed"), [payments]);

  const data = useMemo(() => {
    const income = confirmed.filter((p) => p.category === "received").reduce((s, p) => s + Number(p.amount), 0);
    const labor = confirmed.filter((p) => p.category === "labor").reduce((s, p) => s + Number(p.amount), 0);
    const material = confirmed.filter((p) => p.category === "material").reduce((s, p) => s + Number(p.amount), 0);
    const other = confirmed.filter((p) => p.category === "other").reduce((s, p) => s + Number(p.amount), 0);
    const totalExp = labor + material + other;
    const net = income - totalExp;
    return { income, labor, material, other, totalExp, net };
  }, [confirmed]);

  const handleDownload = () => {
    const lines = [
      `P&L Report — ${periodLabel}`,
      `Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
      "",
      "SUMMARY",
      `Total Income,$${data.income.toFixed(2)}`,
      `Total Expenses,$${data.totalExp.toFixed(2)}`,
      `  Labor,$${data.labor.toFixed(2)}`,
      `  Material,$${data.material.toFixed(2)}`,
      `  Other,$${data.other.toFixed(2)}`,
      `Net Balance,$${data.net.toFixed(2)}`,
      "",
      "TRANSACTIONS",
      "Date,Description,Category,Amount,Status",
      ...payments.map((p) =>
        `${p.payment_date},"${p.description || ""}",${p.category},$${Number(p.amount).toFixed(2)},${p.status}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PL_${periodLabel.replace(/\s/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onOpenChange(false);
  };

  const marginPct = data.income > 0 ? ((data.net / data.income) * 100).toFixed(1) : "0.0";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">P&L Preview — {periodLabel}</SheetTitle>
        </SheetHeader>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto text-green-600 mb-1" />
            <p className="text-[10px] uppercase text-muted-foreground font-medium">Income</p>
            <p className="text-sm font-bold text-green-600">{fmt(data.income)}</p>
          </div>
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-center">
            <TrendingDown className="w-4 h-4 mx-auto text-destructive mb-1" />
            <p className="text-[10px] uppercase text-muted-foreground font-medium">Expenses</p>
            <p className="text-sm font-bold text-destructive">{fmt(data.totalExp)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${data.net >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
            <DollarSign className={`w-4 h-4 mx-auto mb-1 ${data.net >= 0 ? "text-green-600" : "text-destructive"}`} />
            <p className="text-[10px] uppercase text-muted-foreground font-medium">Net</p>
            <p className={`text-sm font-bold ${data.net >= 0 ? "text-green-600" : "text-destructive"}`}>{fmt(data.net)}</p>
          </div>
        </div>

        {/* Expense breakdown */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expense Breakdown</p>
          {[
            { label: "Labor", value: data.labor, pct: data.totalExp > 0 ? (data.labor / data.totalExp) * 100 : 0 },
            { label: "Material", value: data.material, pct: data.totalExp > 0 ? (data.material / data.totalExp) * 100 : 0 },
            { label: "Other", value: data.other, pct: data.totalExp > 0 ? (data.other / data.totalExp) * 100 : 0 },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-foreground/40" style={{ width: `${row.pct}%` }} />
                </div>
                <span className="font-medium w-20 text-right">{fmt(row.value)}</span>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Margin */}
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-muted-foreground">Profit Margin</span>
          <span className={`font-bold ${data.net >= 0 ? "text-green-600" : "text-destructive"}`}>{marginPct}%</span>
        </div>

        {/* Transactions count */}
        <p className="text-xs text-muted-foreground mb-4">
          {payments.length} transaction{payments.length !== 1 && "s"} · {confirmed.length} confirmed
        </p>

        <Button className="w-full" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download CSV
        </Button>
      </SheetContent>
    </Sheet>
  );
}
