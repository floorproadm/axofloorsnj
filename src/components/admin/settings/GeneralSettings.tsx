import { useState, useEffect } from "react";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, Building2, TrendingUp, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { LaborPricingModel } from "@/hooks/useCompanySettings";

export default function GeneralSettings() {
  const { settings, isLoading, refetch, companyName, marginMinPercent, laborPricingModel, laborRate } = useCompanySettings();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState("");
  const [formMargin, setFormMargin] = useState("");
  const [formModel, setFormModel] = useState<LaborPricingModel>("sqft");
  const [formRate, setFormRate] = useState("");

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
        const { error } = await supabase
          .from("company_settings")
          .update(payload)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_settings")
          .insert(payload);
        if (error) throw error;
      }

      await refetch();
      toast({ title: "✓ Salvo", description: "Configurações atualizadas com sucesso." });
    } catch (err: any) {
      console.error("Settings save error:", err);
      toast({ title: "Erro ao salvar", description: err.message || "Tente novamente", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const updatedAtRelative = settings?.updated_at
    ? formatDistanceToNow(new Date(settings.updated_at), { addSuffix: true, locale: ptBR })
    : null;
  const updatedAtAbsolute = settings?.updated_at
    ? format(new Date(settings.updated_at), "dd/MM/yyyy 'às' HH:mm")
    : null;

  return (
    <div className="space-y-6">
      {/* Identidade */}
      <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-5 h-5 text-primary" />
              Identidade
            </CardTitle>
            {updatedAtRelative && (
              <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground font-normal" title={updatedAtAbsolute ?? ""}>
                <Clock className="w-3 h-3" />
                {updatedAtRelative}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="company_name">Razão Social</Label>
              <Input id="company_name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="AXO Floors LLC" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regras de Negócio */}
      <Card className="border-l-4 border-l-[hsl(var(--gold-warm))] shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-[hsl(var(--gold-warm))]" />
            Regras de Negócio
          </CardTitle>
          <CardDescription>
            Triggers e RPCs consultam estes valores antes de permitir transições no pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="margin">Margem Mínima Obrigatória (%)</Label>
              <Input id="margin" type="number" min={0} max={100} step={1} value={formMargin} onChange={(e) => setFormMargin(e.target.value)} />
              <p className="text-xs text-muted-foreground">Nenhum projeto avança para Proposta com margem abaixo deste valor.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricing_model">Modelo de Precificação</Label>
              <Select value={formModel} onValueChange={(v) => setFormModel(v as LaborPricingModel)}>
                <SelectTrigger id="pricing_model"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">Por Sq Ft</SelectItem>
                  <SelectItem value="daily">Diária</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="labor_rate">Labor Rate Padrão ({formModel === "sqft" ? "$/sq ft" : "$/dia"})</Label>
              <Input id="labor_rate" type="number" min={0} step={0.25} value={formRate} onChange={(e) => setFormRate(e.target.value)} />
            </div>
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="pt-4 flex items-center gap-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Configurações
          </Button>
          {updatedAtAbsolute && (
            <span className="text-xs text-muted-foreground">
              Última atualização: {updatedAtAbsolute}
            </span>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
