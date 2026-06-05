import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useJobCost, useUpsertJobCost, usePendingLaborCost } from '@/hooks/useJobCosts';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useMaterialCosts } from '@/hooks/useMaterialCosts';
import { useLaborEntries } from '@/hooks/useLaborEntries';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save, AlertTriangle, CheckCircle2, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface JobCostEditorProps {
  projectId: string;
  onSaved?: () => void;
}

export function JobCostEditor({ projectId, onSaved }: JobCostEditorProps) {
  const queryClient = useQueryClient();
  const { data: jobCost, isLoading } = useJobCost(projectId);
  const { mutateAsync: upsert, isPending: isSaving } = useUpsertJobCost();
  const { marginMinPercent } = useCompanySettings();
  const { data: materialCosts = [] } = useMaterialCosts(projectId);
  const { data: laborEntries = [] } = useLaborEntries(projectId);
  const { data: pendingLaborCost = 0 } = usePendingLaborCost(projectId);
  const { toast } = useToast();

  // Project sqft (lives on projects.square_footage)
  const { data: projectRow } = useQuery({
    queryKey: ['project-sqft', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('square_footage')
        .eq('id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const [sqft, setSqft] = useState('0');
  const [additional, setAdditional] = useState('0');
  const [revenue, setRevenue] = useState('0');
  const [desiredMargin, setDesiredMargin] = useState(String(marginMinPercent || 30));

  useEffect(() => {
    if (jobCost) {
      setAdditional(String(jobCost.additional_costs || 0));
      setRevenue(String(jobCost.estimated_revenue || 0));
    }
  }, [jobCost]);

  useEffect(() => {
    if (projectRow?.square_footage != null) {
      setSqft(String(projectRow.square_footage));
    }
  }, [projectRow]);

  const materialTotal = jobCost?.material_cost ?? 0;
  const laborTotal = jobCost?.labor_cost ?? 0;
  const additionalCost = parseFloat(additional) || 0;
  const totalCost = materialTotal + laborTotal + additionalCost;
  const estimatedRevenue = parseFloat(revenue) || 0;
  const sqftNum = parseFloat(sqft) || 0;
  const liveMargin = estimatedRevenue > 0
    ? ((estimatedRevenue - totalCost) / estimatedRevenue) * 100
    : 0;
  const liveProfit = estimatedRevenue - totalCost;
  const marginOk = liveMargin >= marginMinPercent && estimatedRevenue > 0;

  const desiredMarginNum = Math.min(99, Math.max(0, parseFloat(desiredMargin) || 0));
  const suggestedPrice = desiredMarginNum < 99 && totalCost > 0
    ? totalCost / (1 - desiredMarginNum / 100)
    : 0;

  const applySuggestedPrice = () => {
    if (suggestedPrice > 0) {
      setRevenue(suggestedPrice.toFixed(2));
      toast({ title: 'Price applied', description: `Revenue set to hit ${desiredMarginNum}% margin` });
    }
  };

  const handleSave = async () => {
    try {
      // Save sqft on projects table
      if (sqftNum !== (projectRow?.square_footage ?? 0)) {
        const { error: sqftErr } = await supabase
          .from('projects')
          .update({ square_footage: sqftNum })
          .eq('id', projectId);
        if (sqftErr) throw sqftErr;
        queryClient.invalidateQueries({ queryKey: ['project-sqft', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects-hub'] });
      }

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
        variant: 'destructive',
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

  const costPerSqft = sqftNum > 0 ? totalCost / sqftNum : 0;
  const pricePerSqft = sqftNum > 0 ? estimatedRevenue / sqftNum : 0;

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
                : `Min: ${marginMinPercent}% — Proposal blocked below this threshold`
              }
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total Cost</p>
          <p className="text-sm font-bold">${totalCost.toFixed(0)}</p>
        </div>
      </div>

      {/* Total Area */}
      <div>
        <Label className="text-xs text-muted-foreground">Total Area (sqft) *</Label>
        <Input
          type="number"
          min="0"
          step="1"
          value={sqft}
          onChange={(e) => setSqft(e.target.value)}
          className="mt-1"
          placeholder="e.g. 850"
        />
        {sqftNum > 0 && totalCost > 0 && (
          <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">
            Cost/sqft: ${costPerSqft.toFixed(2)} · Price/sqft: ${pricePerSqft.toFixed(2)}
          </p>
        )}
      </div>

      {/* Auto-calculated summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2.5 rounded-lg bg-muted/30">
          <p className="text-[11px] text-muted-foreground uppercase">Material</p>
          <p className="text-sm font-bold">${materialTotal.toFixed(0)}</p>
          {materialCosts.length > 0 && <p className="text-[10px] text-muted-foreground">{materialCosts.length} entries (auto)</p>}
        </div>
        <div className="p-2.5 rounded-lg bg-muted/30">
          <p className="text-[11px] text-muted-foreground uppercase">Labor</p>
          <p className="text-sm font-bold">${laborTotal.toFixed(0)}</p>
          {laborEntries.length > 0 && <p className="text-[10px] text-muted-foreground">{laborEntries.length} entries (auto)</p>}
          {pendingLaborCost > 0 && (
            <p className="text-[10px] italic text-amber-600 dark:text-amber-500 mt-0.5">
              ⚠ ${pendingLaborCost.toFixed(0)} pending approval (not included)
            </p>
          )}
        </div>
      </div>

      {/* Editable: Additional + Revenue */}
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
          <Label className="text-xs text-muted-foreground">Final Price / Revenue ($)</Label>
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

      {/* Desired margin → suggested price */}
      <div className="p-3 rounded-lg border border-dashed border-border bg-muted/20 space-y-2">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Desired Margin (%)</Label>
            <Input
              type="number"
              min="0"
              max="99"
              step="1"
              value={desiredMargin}
              onChange={(e) => setDesiredMargin(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Suggested Price</Label>
            <div className="mt-1 h-10 px-3 rounded-md border bg-background flex items-center text-sm font-mono font-semibold tabular-nums">
              {suggestedPrice > 0 ? `$${suggestedPrice.toFixed(0)}` : '—'}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={applySuggestedPrice}
            disabled={suggestedPrice <= 0}
            className="h-10"
          >
            <Wand2 className="w-3.5 h-3.5 mr-1" />
            Apply
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Formula: total cost ÷ (1 − desired margin). Click Apply to fill the price.
        </p>
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
