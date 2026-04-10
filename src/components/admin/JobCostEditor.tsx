import { useState, useEffect } from 'react';
import { useJobCost, useUpsertJobCost, type JobCost } from '@/hooks/useJobCosts';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useMaterialCosts } from '@/hooks/useMaterialCosts';
import { useLaborEntries } from '@/hooks/useLaborEntries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save, AlertTriangle, CheckCircle2, Pencil } from 'lucide-react';
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
  const { data: materialCosts = [] } = useMaterialCosts(projectId);
  const { data: laborEntries = [] } = useLaborEntries(projectId);
  const { toast } = useToast();

  const [manualMode, setManualMode] = useState(false);
  const [additional, setAdditional] = useState('0');
  const [revenue, setRevenue] = useState('0');

  const hasMaterialEntries = materialCosts.length > 0;
  const hasLaborEntries = laborEntries.length > 0;

  // Sync form when data loads
  useEffect(() => {
    if (jobCost) {
      setAdditional(String(jobCost.additional_costs || 0));
      setRevenue(String(jobCost.estimated_revenue || 0));
    }
  }, [jobCost]);

  // Costs — auto-calculated from entries or from job_costs record
  const materialTotal = jobCost?.material_cost ?? 0;
  const laborTotal = jobCost?.labor_cost ?? 0;
  const additionalCost = parseFloat(additional) || 0;
  const totalCost = materialTotal + laborTotal + additionalCost;
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
        labor_cost: laborTotal,
        material_cost: materialTotal,
        additional_costs: additionalCost,
        estimated_revenue: estimatedRevenue,
      });
      toast({ title: '✓ Costs saved', description: 'Margin updated' });
      onSaved?.();
    } catch (err) {
      toast({ 
        title: 'Error saving', 
        description: err instanceof Error ? err.message : 'Unknown error',
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
      {/* Margin Display */}
      <div className={cn(
        "p-3 rounded-lg border-2 flex items-center justify-between",
        marginOk 
          ? "bg-emerald-50 border-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-700" 
          : "bg-red-50 border-red-400 dark:bg-red-950/30 dark:border-red-700"
      )}>
        <div className="flex items-center gap-2">
          {marginOk ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
          <div>
            <p className={cn("text-sm font-bold", marginOk ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400")}>
              Margin: {liveMargin.toFixed(1)}%
            </p>
            <p className={cn("text-xs", marginOk ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500")}>
              {marginOk 
                ? `Profit: $${liveProfit.toFixed(0)}` 
                : `Min: ${marginMinPercent}% — Adjust values`
              }
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total Cost</p>
          <p className="text-sm font-bold">${totalCost.toFixed(0)}</p>
        </div>
      </div>

      {/* Auto-calculated summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2.5 rounded-lg bg-muted/30">
          <p className="text-[11px] text-muted-foreground uppercase">Material</p>
          <p className="text-sm font-bold">${materialTotal.toFixed(0)}</p>
          {hasMaterialEntries && <p className="text-[10px] text-muted-foreground">{materialCosts.length} entries (auto)</p>}
        </div>
        <div className="p-2.5 rounded-lg bg-muted/30">
          <p className="text-[11px] text-muted-foreground uppercase">Labor</p>
          <p className="text-sm font-bold">${laborTotal.toFixed(0)}</p>
          {hasLaborEntries && <p className="text-[10px] text-muted-foreground">{laborEntries.length} entries (auto)</p>}
        </div>
      </div>

      {/* Editable fields: Additional + Revenue */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Additional Costs ($)</Label>
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
          <Label className="text-xs text-muted-foreground">Estimated Revenue ($)</Label>
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
        disabled={isSaving}
        className="w-full"
        variant={marginOk ? "default" : "outline"}
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-1.5" />
        )}
        Save Costs
      </Button>
    </div>
  );
}
