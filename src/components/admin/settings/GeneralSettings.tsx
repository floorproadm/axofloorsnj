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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, Building2, TrendingUp, Clock, FileText } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import type { LaborPricingModel } from "@/hooks/useCompanySettings";

export default function GeneralSettings() {
  const { settings, isLoading, refetch, companyName, marginMinPercent, laborPricingModel, laborRate } = useCompanySettings();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCheckAddress, setFormCheckAddress] = useState("");
  const [formMargin, setFormMargin] = useState("");
  const [formModel, setFormModel] = useState<LaborPricingModel>("sqft");
  const [formRate, setFormRate] = useState("");
  // Proposal document defaults
  const [formPaymentTerms, setFormPaymentTerms] = useState("");
  const [formTaxRate, setFormTaxRate] = useState("0");
  const [formTermsText, setFormTermsText] = useState("");
  const [formDepositPercent, setFormDepositPercent] = useState("50");

  useEffect(() => {
    if (!isLoading) {
      setFormName(companyName);
      setFormMargin(String(marginMinPercent));
      setFormModel(laborPricingModel);
      setFormRate(String(laborRate));
      const s: any = settings || {};
      setFormPhone(s.phone ?? "");
      setFormEmail(s.email ?? "");
      setFormCheckAddress(s.check_mailing_address ?? "");
      setFormPaymentTerms(s.default_payment_terms ?? "50% deposit due upon signing. Balance due upon completion.");
      setFormTaxRate(String(s.default_tax_rate ?? 0));
      setFormTermsText(s.default_terms_text ?? "");
      setFormDepositPercent(String(s.deposit_percentage ?? 50));
    }
  }, [isLoading, companyName, marginMinPercent, laborPricingModel, laborRate, settings]);

  const handleSave = async () => {
    const marginNum = parseFloat(formMargin);
    const rateNum = parseFloat(formRate);
    const taxNum = parseFloat(formTaxRate);
    const depositNum = parseFloat(formDepositPercent);

    if (isNaN(marginNum) || marginNum < 0 || marginNum > 100) {
      toast({ title: t("general.erro"), description: t("general.margemErro"), variant: "destructive" });
      return;
    }
    if (isNaN(rateNum) || rateNum < 0) {
      toast({ title: t("general.erro"), description: t("general.laborRateErro"), variant: "destructive" });
      return;
    }
    if (isNaN(taxNum) || taxNum < 0 || taxNum > 100) {
      toast({ title: t("general.erro"), description: "Tax rate must be between 0 and 100.", variant: "destructive" });
      return;
    }
    if (isNaN(depositNum) || depositNum < 1 || depositNum > 100) {
      toast({ title: t("general.erro"), description: "Deposit percentage must be between 1 and 100.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        company_name: formName.trim(),
        phone: formPhone.trim() || null,
        email: formEmail.trim() || null,
        check_mailing_address: formCheckAddress.trim() || null,
        default_margin_min_percent: marginNum,
        labor_pricing_model: formModel,
        default_labor_rate: rateNum,
        default_payment_terms: formPaymentTerms.trim() || null,
        default_tax_rate: taxNum,
        default_terms_text: formTermsText.trim() || null,
        deposit_percentage: depositNum,
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
      toast({ title: t("general.salvo"), description: t("general.salvoDesc") });
    } catch (err: any) {
      console.error("Settings save error:", err);
      toast({ title: t("general.erroSalvar"), description: err.message || t("general.tenteNovamente"), variant: "destructive" });
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

  const dateLocale = language === "en" ? enUS : ptBR;
  const updatedAtRelative = settings?.updated_at
    ? formatDistanceToNow(new Date(settings.updated_at), { addSuffix: true, locale: dateLocale })
    : null;
  const updatedAtAbsolute = settings?.updated_at
    ? format(new Date(settings.updated_at), language === "en" ? "MM/dd/yyyy 'at' HH:mm" : "dd/MM/yyyy 'às' HH:mm")
    : null;

  return (
    <div className="space-y-6">
      {/* Identity */}
      <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-5 h-5 text-primary" />
              {t("general.identidade")}
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
              <Label htmlFor="company_name">{t("general.razaoSocial")}</Label>
              <Input id="company_name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="AXO Floors LLC" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_phone">Phone</Label>
              <Input id="company_phone" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="(732) 351-8653" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_email">Email</Label>
              <Input id="company_email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="axofloorsnj@gmail.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_mailing_address">Check Mailing Address</Label>
              <Textarea
                id="check_mailing_address"
                value={formCheckAddress}
                onChange={(e) => setFormCheckAddress(e.target.value)}
                placeholder="e.g. AXO Floors LLC, 123 Main St, City, NJ 07000"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">Shown on the public deposit invoice under the check payment instructions. Leave empty to keep the default pickup coordination message.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_timezone">Time Zone</Label>
              <Input id="company_timezone" value="Central Standard Time" readOnly placeholder="Central Standard Time" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Rules */}
      <Card className="border-l-4 border-l-[hsl(var(--gold-warm))] shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-[hsl(var(--gold-warm))]" />
            {t("general.regrasNegocio")}
          </CardTitle>
          <CardDescription>
            {t("general.regrasDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="margin">{t("general.margemMinima")}</Label>
              <Input id="margin" type="number" min={0} max={100} step={1} value={formMargin} onChange={(e) => setFormMargin(e.target.value)} />
              <p className="text-xs text-muted-foreground">{t("general.margemDesc")}</p>
              <p className="text-xs text-muted-foreground">Jobs below this margin will be flagged with an alert.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricing_model">{t("general.modeloPrecificacao")}</Label>
              <Select value={formModel} onValueChange={(v) => setFormModel(v as LaborPricingModel)}>
                <SelectTrigger id="pricing_model"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">{t("general.porSqFt")}</SelectItem>
                  <SelectItem value="daily">{t("general.diaria")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="labor_rate">{t("general.laborRatePadrao")} ({formModel === "sqft" ? "$/sq ft" : "$/dia"})</Label>
              <Input id="labor_rate" type="number" min={0} step={0.25} value={formRate} onChange={(e) => setFormRate(e.target.value)} />
            </div>
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="pt-4 flex items-center gap-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {t("general.salvarConfiguracoes")}
          </Button>
          {updatedAtAbsolute && (
            <span className="text-xs text-muted-foreground">
              {t("general.ultimaAtualizacao")}: {updatedAtAbsolute}
            </span>
          )}
        </CardFooter>
      </Card>

      {/* Proposal Document Defaults */}
      <Card className="border-l-4 border-l-[hsl(var(--gold-warm))] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-[hsl(var(--gold-warm))]" />
            Proposal Defaults
          </CardTitle>
          <CardDescription>
            Default payment terms, tax rate and conditions pre-populated on every new proposal. Each proposal can override these.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="default_payment_terms">Default Payment Terms</Label>
              <Textarea
                id="default_payment_terms"
                value={formPaymentTerms}
                onChange={(e) => setFormPaymentTerms(e.target.value)}
                placeholder="50% deposit due upon signing. Balance due upon completion."
                rows={2}
              />
            </div>
            <div className="space-y-2 max-w-[200px]">
              <Label htmlFor="default_tax_rate">Default Tax Rate (%)</Label>
              <Input
                id="default_tax_rate"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={formTaxRate}
                onChange={(e) => setFormTaxRate(e.target.value)}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-2 max-w-[200px]">
              <Label htmlFor="deposit_percentage">Deposit Percentage (%)</Label>
              <Input
                id="deposit_percentage"
                type="number"
                min={1}
                max={100}
                step="1"
                value={formDepositPercent}
                onChange={(e) => setFormDepositPercent(e.target.value)}
                className="tabular-nums"
              />
              <p className="text-xs text-muted-foreground">Default deposit % applied to new proposals and deposit invoices.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_terms_text">Default Terms &amp; Conditions</Label>
              <Textarea
                id="default_terms_text"
                value={formTermsText}
                onChange={(e) => setFormTermsText(e.target.value)}
                placeholder="Warranty notes, scope exclusions, change-order policy, etc."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">Shown at the bottom of every proposal document.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
