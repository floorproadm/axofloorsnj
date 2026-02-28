import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProjectWithCosts } from "@/hooks/usePerformanceData";
import { useJobCostItems } from "@/hooks/useJobCostItems";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { ItemizedCostEditor } from "./ItemizedCostEditor";

interface Props {
  project: ProjectWithCosts | null;
  open: boolean;
  onClose: () => void;
}

const categoryLabels: Record<string, string> = {
  materials: "Materiais",
  labor: "Mão de Obra",
  overhead: "Overhead",
  other: "Outros",
};

const categoryColors: Record<string, string> = {
  materials: "bg-blue-500",
  labor: "bg-emerald-500",
  overhead: "bg-amber-500",
  other: "bg-purple-500",
};

export function JobCostDetailsSheet({ project, open, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const jc = project?.job_costs;
  const { byCategory, categoryTotals, grandTotal, isLoading, addItem, removeItem } = useJobCostItems(jc?.id ?? null);

  if (!project) return null;

  const revenue = jc?.estimated_revenue ?? 0;
  const totalCost = jc?.total_cost ?? 0;
  const profit = jc?.profit_amount ?? 0;
  const margin = jc?.margin_percent ?? 0;

  // For stacked bar
  const total = grandTotal || totalCost || 1;
  const segments = (['materials', 'labor', 'overhead', 'other'] as const).map(cat => ({
    category: cat,
    label: categoryLabels[cat],
    color: categoryColors[cat],
    amount: categoryTotals[cat] || (cat === 'materials' ? Number(jc?.material_cost ?? 0) : cat === 'labor' ? Number(jc?.labor_cost ?? 0) : cat === 'overhead' || cat === 'other' ? Number(jc?.additional_costs ?? 0) / 2 : 0),
    pct: 0,
  }));
  const segTotal = segments.reduce((s, sg) => s + sg.amount, 0) || 1;
  segments.forEach(s => { s.pct = Math.round((s.amount / segTotal) * 100); });

  if (editing) {
    return (
      <Sheet open={open} onOpenChange={(o) => { if (!o) { setEditing(false); onClose(); } }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Custos — {project.customer_name}</SheetTitle>
          </SheetHeader>
          <ItemizedCostEditor
            jobCostId={jc?.id ?? null}
            revenue={revenue}
            onDone={() => setEditing(false)}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{project.customer_name}</SheetTitle>
          <p className="text-sm text-muted-foreground">{project.project_type}</p>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Financial Summary */}
          <Card className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Receita</span>
              <span className="text-lg font-bold text-foreground">${revenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Custos Totais</span>
              <span className="text-lg font-bold text-red-600">-${Number(totalCost).toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Lucro</span>
              <div className="text-right">
                <span className={cn("text-lg font-bold", profit >= 0 ? "text-emerald-600" : "text-red-600")}>
                  ${Number(profit).toLocaleString()}
                </span>
                <Badge variant="secondary" className={cn("ml-2 text-xs", margin >= 30 ? "bg-emerald-100 text-emerald-700" : margin >= 15 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                  {Number(margin).toFixed(1)}%
                </Badge>
              </div>
            </div>
          </Card>

          {/* Cost Breakdown */}
          <Card className="p-5 space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Breakdown de Custos</h4>

            {/* Stacked bar */}
            <div className="flex h-3 rounded-full overflow-hidden">
              {segments.filter(s => s.amount > 0).map(s => (
                <div key={s.category} className={cn("h-full", s.color)} style={{ width: `${s.pct}%` }} />
              ))}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2">
              {segments.map(s => (
                <div key={s.category} className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-sm", s.color)} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <span className="text-xs font-medium text-foreground ml-auto">{s.pct}%</span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Line items per category */}
            {(['materials', 'labor', 'overhead', 'other'] as const).map(cat => {
              const items = byCategory[cat];
              const fallbackAmount = cat === 'materials' ? jc?.material_cost : cat === 'labor' ? jc?.labor_cost : jc?.additional_costs;
              if (items.length === 0 && !fallbackAmount) return null;
              return (
                <div key={cat}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{categoryLabels[cat]}</p>
                  {items.length > 0 ? items.map(item => (
                    <div key={item.id} className="flex justify-between py-1">
                      <span className="text-sm text-foreground">{item.description || categoryLabels[cat]}</span>
                      <span className="text-sm font-medium text-foreground">${Number(item.amount).toLocaleString()}</span>
                    </div>
                  )) : (
                    <div className="flex justify-between py-1">
                      <span className="text-sm text-muted-foreground italic">Valor agregado</span>
                      <span className="text-sm font-medium text-foreground">${Number(fallbackAmount).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </Card>

          <Button onClick={() => setEditing(true)} className="w-full" variant="outline">
            <Pencil className="w-4 h-4 mr-2" />
            Editar Detalhes de Custo
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
