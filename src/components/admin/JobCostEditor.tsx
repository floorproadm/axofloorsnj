import { useState, useEffect } from 'react';
import { useJobCost, useUpsertJobCost, validateMargin, type JobCost } from '@/hooks/useJobCosts';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save, DollarSign, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface JobCostEditorProps {
  projectId: string;
  onSaved?: () => void;
}

export function JobCostEditor({ projectId, onSaved }: JobCostEditorProps) {
  const { data: jobCost, isLoading } = useJobCost(projectId);
  const { mutateAsync: upsert, isPending: isSaving } = useUpsertJobCost();
  const { marginMinPercent } = useCompanySettings();
  const { toast } = useToast();

  const [labor, setLabor] = useState('0');
  const [material, setMaterial] = useState('0');
  const [additional, setAdditional] = useState('0');
  const [revenue, setRevenue] = useState('0');

  // Sync form when data loads
  useEffect(() => {
    if (jobCost) {
      setLabor(String(jobCost.labor_cost || 0));
      setMaterial(String(jobCost.material_cost || 0));
      setAdditional(String(jobCost.additional_costs || 0));
      setRevenue(String(jobCost.estimated_revenue || 0));
    }
  }, [jobCost]);

  // Live margin calculation
  const totalCost = (parseFloat(labor) || 0) + (parseFloat(material) || 0) + (parseFloat(additional) || 0);
  const estimatedRevenue = parseFloat(revenue) || 0;
  const liveMargin = estimatedRevenue > 0 
    ? ((estimatedRevenue - totalCost) / estimatedRevenue) * 100 
    : 0;
  const liveProfit = estimatedRevenue - totalCost;
  const marginOk = liveMargin >= marginMinPercent && estimatedRevenue > 0;

  const handleSave = async () => {
    try {
      await upsert({
        project_id: projectId,
        labor_cost: parseFloat(labor) || 0,
        material_cost: parseFloat(material) || 0,
        additional_costs: parseFloat(additional) || 0,
        estimated_revenue: estimatedRevenue,
      });
      toast({ title: '✓ Custos salvos', description: 'Margem atualizada' });
      onSaved?.();
    } catch (err) {
      toast({ 
        title: 'Erro ao salvar', 
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive' 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Margin Display - Always Visible */}
      <div className={cn(
        "p-3 rounded-lg border-2 flex items-center justify-between",
        marginOk 
          ? "bg-emerald-50 border-emerald-400" 
          : "bg-red-50 border-red-400"
      )}>
        <div className="flex items-center gap-2">
          {marginOk ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
          <div>
            <p className={cn("text-sm font-bold", marginOk ? "text-emerald-700" : "text-red-700")}>
              Margem: {liveMargin.toFixed(1)}%
            </p>
            <p className={cn("text-xs", marginOk ? "text-emerald-600" : "text-red-600")}>
              {marginOk 
                ? `Lucro: $${liveProfit.toFixed(0)}` 
                : `Mínimo: ${marginMinPercent}% — Ajuste os valores`
              }
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Custo Total</p>
          <p className="text-sm font-bold">${totalCost.toFixed(0)}</p>
        </div>
      </div>

      {/* Cost Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Mão de Obra ($)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={labor}
            onChange={(e) => setLabor(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Material ($)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Custos Adicionais ($)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={additional}
            onChange={(e) => setAdditional(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Receita Estimada ($)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            className="mt-1 border-primary/50"
          />
        </div>
      </div>

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={isSaving || totalCost === 0}
        className="w-full"
        variant={marginOk ? "default" : "outline"}
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-1.5" />
        )}
        Salvar Custos
      </Button>
    </div>
  );
}
