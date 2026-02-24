import { useState, useEffect } from "react";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Palette, Upload, X } from "lucide-react";

export default function BrandingSettings() {
  const { settings, isLoading, refetch } = useCompanySettings();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [tradeName, setTradeName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#d97706");
  const [secondaryColor, setSecondaryColor] = useState("#1e3a5f");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isLoading && settings) {
      setTradeName((settings as any).trade_name ?? "AXO Floors");
      setPrimaryColor((settings as any).primary_color ?? "#d97706");
      setSecondaryColor((settings as any).secondary_color ?? "#1e3a5f");
      setLogoUrl((settings as any).logo_url ?? "");
    }
  }, [isLoading, settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 2MB para logo", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `branding/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("media").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
      setLogoUrl(urlData.publicUrl);
      toast({ title: "Logo enviado" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!settings?.id) {
      toast({ title: "Erro", description: "Salve as configurações gerais primeiro", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("company_settings")
        .update({
          trade_name: tradeName.trim(),
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          logo_url: logoUrl || null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", settings.id);
      if (error) throw error;

      await refetch();
      toast({ title: "✓ Branding salvo" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="w-5 h-5 text-primary" />
            Identidade Visual
          </CardTitle>
          <CardDescription>Logo, cores e nome fantasia da empresa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 max-w-lg">
          {/* Trade Name */}
          <div className="space-y-2">
            <Label htmlFor="trade_name">Nome Fantasia</Label>
            <Input id="trade_name" value={tradeName} onChange={(e) => setTradeName(e.target.value)} placeholder="AXO Floors" />
            <p className="text-xs text-muted-foreground">Nome público exibido para clientes.</p>
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo da Empresa</Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative w-20 h-20 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  <button
                    onClick={() => setLogoUrl("")}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <Button variant="outline" size="sm" disabled={uploading} asChild>
                  <label className="cursor-pointer">
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {logoUrl ? "Trocar" : "Enviar"} Logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </Button>
                <p className="text-xs text-muted-foreground mt-1">PNG ou JPG, máximo 2MB</p>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Cor Primária</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="primary_color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_color">Cor Secundária</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="secondary_color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="font-mono text-sm" />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
              {logoUrl && <img src={logoUrl} alt="Preview" className="w-10 h-10 object-contain" />}
              <span className="font-bold text-lg" style={{ color: primaryColor }}>{tradeName || "AXO Floors"}</span>
              <div className="ml-auto flex gap-2">
                <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: primaryColor }} title="Primária" />
                <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: secondaryColor }} title="Secundária" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Salvar Branding
      </Button>
    </div>
  );
}
