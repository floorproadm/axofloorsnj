import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useJobCostItems } from "@/hooks/useJobCostItems";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

interface Props {
  jobCostId: string | null;
  revenue: number;
  onDone: () => void;
}

const categories = [
  { key: 'materials' as const, label: 'Materiais' },
  { key: 'labor' as const, label: 'Mão de Obra' },
  { key: 'overhead' as const, label: 'Overhead' },
  { key: 'other' as const, label: 'Outros Custos' },
];

export function ItemizedCostEditor({ jobCostId, revenue, onDone }: Props) {
  const { byCategory, categoryTotals, grandTotal, addItem, removeItem } = useJobCostItems(jobCostId);
  const [newItems, setNewItems] = useState<Record<string, { description: string; amount: string }>>({});

  const handleAdd = async (category: string) => {
    const item = newItems[category];
    if (!item?.description || !item?.amount) return;
    await addItem.mutateAsync({ category, description: item.description, amount: Number(item.amount) });
    setNewItems(prev => ({ ...prev, [category]: { description: '', amount: '' } }));
  };

  const profit = revenue - grandTotal;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return (
    <div className="mt-4 space-y-6">
      <Button variant="ghost" size="sm" onClick={onDone} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
      </Button>

      {categories.map(({ key, label }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground">{label}</h4>
            <span className="text-sm font-medium text-muted-foreground">${categoryTotals[key].toLocaleString()}</span>
          </div>

          <div className="space-y-1">
            {byCategory[key].map(item => (
              <div key={item.id} className="flex items-center gap-2 py-1">
                <span className="text-sm text-foreground flex-1">{item.description}</span>
                <span className="text-sm font-medium text-foreground w-24 text-right">${Number(item.amount).toLocaleString()}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-red-600"
                  onClick={() => removeItem.mutate(item.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add new item row */}
          <div className="flex items-center gap-2 mt-2">
            <Input
              placeholder="Descrição"
              className="text-sm h-8"
              value={newItems[key]?.description ?? ''}
              onChange={(e) => setNewItems(prev => ({ ...prev, [key]: { ...prev[key], description: e.target.value, amount: prev[key]?.amount ?? '' } }))}
            />
            <Input
              placeholder="Valor"
              type="number"
              className="text-sm h-8 w-28"
              value={newItems[key]?.amount ?? ''}
              onChange={(e) => setNewItems(prev => ({ ...prev, [key]: { ...prev[key], amount: e.target.value, description: prev[key]?.description ?? '' } }))}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => handleAdd(key)}
              disabled={addItem.isPending}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Separator className="mt-4" />
        </div>
      ))}

      {/* Grand total */}
      <div className="space-y-2 pt-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Receita</span>
          <span className="text-sm font-semibold text-foreground">${revenue.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Custo Total</span>
          <span className="text-sm font-semibold text-red-600">-${grandTotal.toLocaleString()}</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-sm font-medium text-foreground">Lucro</span>
          <span className={`text-sm font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ${profit.toLocaleString()} ({margin.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
