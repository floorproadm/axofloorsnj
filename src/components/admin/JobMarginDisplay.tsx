import { useJobCost, useMarginValidation, useUpsertJobCost, JobCostInput } from '@/hooks/useJobCosts';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface JobMarginDisplayProps {
  projectId: string;
}

export function JobMarginDisplay({ projectId }: JobMarginDisplayProps) {
  const { data: jobCost, isLoading } = useJobCost(projectId);
  const { marginMinPercent } = useCompanySettings();
  const validation = useMarginValidation(projectId);
  const upsertMutation = useUpsertJobCost();
  
  const [formData, setFormData] = useState({
    labor_cost: 0,
    material_cost: 0,
    additional_costs: 0,
    estimated_revenue: 0,
  });
  
  useEffect(() => {
    if (jobCost) {
      setFormData({
        labor_cost: jobCost.labor_cost,
        material_cost: jobCost.material_cost,
        additional_costs: jobCost.additional_costs,
        estimated_revenue: jobCost.estimated_revenue,
      });
    }
  }, [jobCost]);
  
  const handleSave = async () => {
    try {
      await upsertMutation.mutateAsync({
        project_id: projectId,
        ...formData,
      });
      toast.success('Custos salvos com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar custos');
    }
  };
  
  const totalCost = formData.labor_cost + formData.material_cost + formData.additional_costs;
  const profit = formData.estimated_revenue - totalCost;
  const marginPercent = formData.estimated_revenue > 0 
    ? ((profit / formData.estimated_revenue) * 100).toFixed(2)
    : '0.00';
  const minMargin = marginMinPercent;
  
  const getStatusIcon = () => {
    if (!jobCost) return <XCircle className="h-5 w-5 text-destructive" />;
    if (validation.status === 'ERROR') return <XCircle className="h-5 w-5 text-destructive" />;
    if (validation.status === 'WARNING') return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };
  
  const getStatusColor = () => {
    if (!jobCost) return 'border-destructive bg-destructive/10';
    if (validation.status === 'ERROR') return 'border-destructive bg-destructive/10';
    if (validation.status === 'WARNING') return 'border-yellow-500 bg-yellow-500/10';
    return 'border-green-500 bg-green-500/10';
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando custos...</div>;
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Margin Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="labor_cost">Custo de Mão de Obra ($)</Label>
            <Input
              id="labor_cost"
              type="number"
              step="0.01"
              value={formData.labor_cost}
              onChange={(e) => setFormData(prev => ({ ...prev, labor_cost: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div>
            <Label htmlFor="material_cost">Custo de Material ($)</Label>
            <Input
              id="material_cost"
              type="number"
              step="0.01"
              value={formData.material_cost}
              onChange={(e) => setFormData(prev => ({ ...prev, material_cost: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div>
            <Label htmlFor="additional_costs">Custos Adicionais ($)</Label>
            <Input
              id="additional_costs"
              type="number"
              step="0.01"
              value={formData.additional_costs}
              onChange={(e) => setFormData(prev => ({ ...prev, additional_costs: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div>
            <Label htmlFor="estimated_revenue">Receita Estimada ($)</Label>
            <Input
              id="estimated_revenue"
              type="number"
              step="0.01"
              value={formData.estimated_revenue}
              onChange={(e) => setFormData(prev => ({ ...prev, estimated_revenue: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        </div>
        
        {/* Calculated Values - Read Only */}
        <div className={`p-4 rounded-lg border-2 ${getStatusColor()}`}>
          <div className="flex items-center gap-2 mb-3">
            {getStatusIcon()}
            <span className="font-medium">
              {!jobCost ? 'Sem dados de margem' : validation.message}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Custo Total:</span>
              <p className="font-bold text-lg">${totalCost.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Lucro:</span>
              <p className={`font-bold text-lg ${profit < 0 ? 'text-destructive' : 'text-green-600'}`}>
                ${profit.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Margem (mín: {minMargin}%):</span>
              <p className={`font-bold text-lg ${parseFloat(marginPercent) < minMargin ? 'text-destructive' : 'text-green-600'}`}>
                {marginPercent}%
              </p>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={upsertMutation.isPending}
          className="w-full"
        >
          {upsertMutation.isPending ? 'Salvando...' : 'Salvar Custos'}
        </Button>
      </CardContent>
    </Card>
  );
}
