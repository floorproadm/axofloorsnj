import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, Settings as SettingsIcon } from "lucide-react";
import type { LaborPricingModel } from "@/hooks/useCompanySettings";

export default function Settings() {
  const { settings, isLoading, refetch, companyName, marginMinPercent, laborPricingModel, laborRate } = useCompanySettings();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Form state — initialized from hook defaults/DB
  const [formName, setFormName] = useState("");
  const [formMargin, setFormMargin] = useState("");
  const [formModel, setFormModel] = useState<LaborPricingModel>("sqft");
  const [formRate, setFormRate] = useState("");

  // Sync form when settings load
  useEffect(() => {
    if (!isLoading) {
      setFormName(companyName);
      setFormMargin(String(marginMinPercent));
      setFormModel(laborPricingModel);
      setFormRate(String(laborRate));
    }
  }, [isLoading, companyName, marginMinPercent, laborPricingModel, laborRate]);

  const handleSave = async () => {
    const marginNum = parseFloat(formMargin);
    const rateNum = parseFloat(formRate);

    if (isNaN(marginNum) || marginNum < 0 || marginNum > 100) {
      toast({ title: "Erro", description: "Margem deve ser entre 0 e 100%", variant: "destructive" });
      return;
    }
    if (isNaN(rateNum) || rateNum < 0) {
      toast({ title: "Erro", description: "Labor rate inválido", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        company_name: formName.trim(),
        default_margin_min_percent: marginNum,
        labor_pricing_model: formModel,
        default_labor_rate: rateNum,
        updated_at: new Date().toISOString(),
      };

      if (settings?.id) {
        // Update existing
        const { error } = await supabase
          .from("company_settings")
          .update(payload)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        // Insert first row
        const { error } = await supabase
          .from("company_settings")
          .insert(payload);
        if (error) throw error;
      }

      await refetch();
      console.log('[AdminSettings] Saved', payload);
      toast({ title: "✓ Salvo", description: "Configurações atualizadas com sucesso." });
    } catch (err: any) {
      console.error("Settings save error:", err);
      toast({ title: "Erro ao salvar", description: err.message || "Tente novamente", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Configurações">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Configurações da Empresa
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Parâmetros globais que afetam margens, custos e validações do sistema.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Parâmetros Operacionais</CardTitle>
            <CardDescription>
              Estas configurações são usadas como regra pelo kernel — triggers e RPCs consultam estes valores antes de permitir transições.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-6 max-w-lg">
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da Empresa</Label>
                  <Input
                    id="company_name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="AXO Floors"
                  />
                </div>

                {/* Margin */}
                <div className="space-y-2">
                  <Label htmlFor="margin">Margem Mínima Obrigatória (%)</Label>
                  <Input
                    id="margin"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={formMargin}
                    onChange={(e) => setFormMargin(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nenhum projeto pode avançar para Proposta com margem abaixo deste valor. Enforced por trigger.
                  </p>
                </div>

                {/* Labor Pricing Model */}
                <div className="space-y-2">
                  <Label htmlFor="pricing_model">Modelo de Precificação de Mão de Obra</Label>
                  <Select value={formModel} onValueChange={(v) => setFormModel(v as LaborPricingModel)}>
                    <SelectTrigger id="pricing_model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sqft">Por Sq Ft</SelectItem>
                      <SelectItem value="daily">Diária</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Labor Rate */}
                <div className="space-y-2">
                  <Label htmlFor="labor_rate">
                    Labor Rate Padrão ({formModel === "sqft" ? "$/sq ft" : "$/dia"})
                  </Label>
                  <Input
                    id="labor_rate"
                    type="number"
                    min={0}
                    step={0.25}
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                  />
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-fit">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Configurações
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
