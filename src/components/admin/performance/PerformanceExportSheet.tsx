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
import type { ProjectWithCosts } from "@/hooks/usePerformanceData";

interface PerformanceExportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectWithCosts[];
  periodLabel: string;
}

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export function PerformanceExportSheet({ open, onOpenChange, projects, periodLabel }: PerformanceExportSheetProps) {
  const completed = useMemo(() => projects.filter(p => p.project_status === "completed"), [projects]);

  const data = useMemo(() => {
    const revenue = completed.reduce((s, p) => s + (p.job_costs?.estimated_revenue ?? 0), 0);
    const labor = completed.reduce((s, p) => s + (p.job_costs?.labor_cost ?? 0), 0);
    const material = completed.reduce((s, p) => s + (p.job_costs?.material_cost ?? 0), 0);
    const additional = completed.reduce((s, p) => s + (p.job_costs?.additional_costs ?? 0), 0);
    const totalCost = labor + material + additional;
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { revenue, labor, material, additional, totalCost, profit, margin };
  }, [completed]);

  const handleDownload = () => {
    const lines = [
      `Performance Report — ${periodLabel}`,
      `Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
      `Completed Jobs: ${completed.length}`,
      "",
      "SUMMARY",
      `Total Revenue,$${data.revenue.toFixed(2)}`,
      `Total Costs,$${data.totalCost.toFixed(2)}`,
      `  Labor,$${data.labor.toFixed(2)}`,
      `  Material,$${data.material.toFixed(2)}`,
      `  Additional,$${data.additional.toFixed(2)}`,
      `Net Profit,$${data.profit.toFixed(2)}`,
      `Margin,${data.margin.toFixed(1)}%`,
      "",
      "PROJECTS",
      "Customer,Type,Revenue,Labor,Material,Profit,Margin%,Status",
      ...completed.map(p => {
        const rev = p.job_costs?.estimated_revenue ?? 0;
        const lab = p.job_costs?.labor_cost ?? 0;
        const mat = p.job_costs?.material_cost ?? 0;
        const prof = p.job_costs?.profit_amount ?? 0;
        const mar = p.job_costs?.margin_percent ?? 0;
        return `"${p.customer_name}","${p.project_type}",$${rev.toFixed(2)},$${lab.toFixed(2)},$${mat.toFixed(2)},$${prof.toFixed(2)},${mar.toFixed(1)}%,${p.project_status}`;
      }),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Performance_${periodLabel.replace(/\s/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">Performance Preview — {periodLabel}</SheetTitle>
        </SheetHeader>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto text-green-600 mb-1" />
            <p className="text-[10px] uppercase text-muted-foreground font-medium">Revenue</p>
            <p className="text-sm font-bold text-green-600">{fmt(data.revenue)}</p>
          </div>
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-center">
            <TrendingDown className="w-4 h-4 mx-auto text-destructive mb-1" />
            <p className="text-[10px] uppercase text-muted-foreground font-medium">Costs</p>
            <p className="text-sm font-bold text-destructive">{fmt(data.totalCost)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${data.profit >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
            <DollarSign className={`w-4 h-4 mx-auto mb-1 ${data.profit >= 0 ? "text-green-600" : "text-destructive"}`} />
            <p className="text-[10px] uppercase text-muted-foreground font-medium">Profit</p>
            <p className={`text-sm font-bold ${data.profit >= 0 ? "text-green-600" : "text-destructive"}`}>{fmt(data.profit)}</p>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cost Breakdown</p>
          {[
            { label: "Labor", value: data.labor, pct: data.totalCost > 0 ? (data.labor / data.totalCost) * 100 : 0 },
            { label: "Material", value: data.material, pct: data.totalCost > 0 ? (data.material / data.totalCost) * 100 : 0 },
            { label: "Additional", value: data.additional, pct: data.totalCost > 0 ? (data.additional / data.totalCost) * 100 : 0 },
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
          <span className={`font-bold ${data.profit >= 0 ? "text-green-600" : "text-destructive"}`}>{data.margin.toFixed(1)}%</span>
        </div>

        {/* Count */}
        <p className="text-xs text-muted-foreground mb-4">
          {completed.length} completed job{completed.length !== 1 && "s"} · {projects.length} total
        </p>

        <Button className="w-full" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download CSV
        </Button>
      </SheetContent>
    </Sheet>
  );
}
