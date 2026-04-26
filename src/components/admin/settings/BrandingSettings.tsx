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
import { Save, Loader2, Palette, Upload, X, Clock, Paintbrush, Phone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BrandingSettings() {
  const { settings, isLoading, refetch } = useCompanySettings();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [tradeName, setTradeName] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#d97706");
  const [secondaryColor, setSecondaryColor] = useState("#1e3a5f");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [logoPath, setLogoPath] = useState("");
  const [logoDisplayUrl, setLogoDisplayUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const generateSignedUrl = async (path: string) => {
    if (!path) { setLogoDisplayUrl(""); return; }
    const { data, error } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60);
    if (!error && data) setLogoDisplayUrl(data.signedUrl);
  };

  useEffect(() => {
    if (!isLoading && settings) {
      setTradeName((settings as any).trade_name ?? "AXO Floors");
      setTagline((settings as any).tagline ?? "");
      setPrimaryColor((settings as any).primary_color ?? "#d97706");
      setSecondaryColor((settings as any).secondary_color ?? "#1e3a5f");
      setPhone((settings as any).phone ?? "");
      setEmail((settings as any).email ?? "");
      setWebsite((settings as any).website ?? "");
      const storedPath = (settings as any).logo_url ?? "";
      setLogoPath(storedPath);
      generateSignedUrl(storedPath);
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

      setLogoPath(fileName);
      await generateSignedUrl(fileName);
      toast({ title: "Logo enviado" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleClearLogo = () => {
    setLogoPath("");
    setLogoDisplayUrl("");
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
          tagline: tagline.trim() || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          phone: phone.trim() || null,
          email: email.trim() || null,
          website: website.trim() || null,
          logo_url: logoPath || null,
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

  const updatedAtRelative = settings?.updated_at
    ? formatDistanceToNow(new Date(settings.updated_at), { addSuffix: true, locale: ptBR })
    : null;

  return (
    <div className="space-y-6">
      {/* Card 1: Identidade Visual */}
      <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="w-5 h-5 text-primary" />
              Identidade Visual
            </CardTitle>
            {updatedAtRelative && (
              <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground font-normal">
                <Clock className="w-3 h-3" />
                {updatedAtRelative}
              </Badge>
            )}
          </div>
          <CardDescription>Nome fantasia e logo da empresa.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-6 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="trade_name">Nome Fantasia</Label>
            <Input id="trade_name" value={tradeName} onChange={(e) => setTradeName(e.target.value)} placeholder="AXO Floors" />
            <p className="text-xs text-muted-foreground">Nome público exibido para clientes.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline / Slogan</Label>
            <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Professional Flooring Services" />
            <p className="text-xs text-muted-foreground">Frase curta exibida abaixo do nome em propostas e materiais.</p>
          </div>

          <div className="space-y-2">
            <Label>Logo da Empresa</Label>
            <div className="flex items-center gap-4">
              {logoDisplayUrl ? (
                <div className="relative w-20 h-20 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                  <img src={logoDisplayUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  <button
                    onClick={handleClearLogo}
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
                    {logoDisplayUrl ? "Trocar" : "Enviar"} Logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </Button>
                <p className="text-xs text-muted-foreground mt-1">PNG ou JPG, máximo 2MB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Informações de Contato */}
      <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="w-5 h-5 text-emerald-500" />
            Informações de Contato
          </CardTitle>
          <CardDescription>Exibido em propostas, faturas e materiais públicos.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(732) 351-8653" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@empresa.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="www.empresa.com" />
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Paleta de Cores */}
      <Card className="border-l-4 border-l-[hsl(var(--gold-warm))] shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Paintbrush className="w-5 h-5 text-[hsl(var(--gold-warm))]" />
            Paleta de Cores
          </CardTitle>
          <CardDescription>Cores primária e secundária aplicadas no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-6 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Cor Primária</Label>
              <div className="flex items-center gap-2">
                <input type="color" id="primary_color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_color">Cor Secundária</Label>
              <div className="flex items-center gap-2">
                <input type="color" id="secondary_color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="font-mono text-sm" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-[hsl(var(--navy-primary))] text-white">
              {logoDisplayUrl && <img src={logoDisplayUrl} alt="Preview" className="w-10 h-10 object-contain" />}
              <span className="font-bold text-lg" style={{ color: primaryColor }}>{tradeName || "AXO Floors"}</span>
              <div className="ml-auto flex gap-2">
                <div className="w-8 h-8 rounded-full border border-white/20" style={{ backgroundColor: primaryColor }} title="Primária" />
                <div className="w-8 h-8 rounded-full border border-white/20" style={{ backgroundColor: secondaryColor }} title="Secundária" />
              </div>
            </div>
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="pt-4 flex items-center gap-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Branding
          </Button>
          {updatedAtRelative && (
            <span className="text-xs text-muted-foreground">Atualizado {updatedAtRelative}</span>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
