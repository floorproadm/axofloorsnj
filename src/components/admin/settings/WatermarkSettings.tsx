import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Trash2, Image as ImageIcon, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { invalidateWatermarkConfig } from "@/utils/watermark";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Position = "bottom-left" | "bottom-center" | "bottom-right";

const POSITIONS: { value: Position; label: string }[] = [
  { value: "bottom-left", label: "Inferior esquerdo" },
  { value: "bottom-center", label: "Inferior centro" },
  { value: "bottom-right", label: "Inferior direito" },
];

const BUCKET = "watermark-images";

export default function WatermarkSettings() {
  const { settings, isLoading, refetch } = useCompanySettings();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [enabled, setEnabled] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [position, setPosition] = useState<Position>("bottom-right");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!settings) return;
    const s = settings as any;
    setEnabled(s.watermark_enabled ?? true);
    setImageUrl(s.watermark_image_url ?? null);
    setPosition((s.watermark_position as Position) ?? "bottom-right");
  }, [settings]);

  async function save(patch: Partial<{ watermark_enabled: boolean; watermark_image_url: string | null; watermark_position: Position }>) {
    if (!settings?.id) {
      toast({ title: "Configurações não carregadas", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("company_settings")
      .update(patch as any)
      .eq("id", settings.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    invalidateWatermarkConfig();
    refetch();
    toast({ title: "Configuração salva" });
  }

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `watermark-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = pub.publicUrl;
      setImageUrl(url);
      await save({ watermark_image_url: url });
    } catch (e: any) {
      toast({ title: "Falha no upload", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeImage() {
    if (!confirm("Remover imagem de watermark? O sistema voltará a usar o texto AXO FLOORS.")) return;
    setImageUrl(null);
    save({ watermark_image_url: null });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-[hsl(var(--gold-warm))] p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-[hsl(var(--gold-warm))]" />
          <h3 className="text-base font-semibold">Watermark</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Configuração global aplicada em todas as fotos de progresso enviadas pelo campo.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-between gap-4 py-3 border-b border-border/60">
          <div className="min-w-0">
            <Label htmlFor="wm-enabled" className="text-sm font-medium cursor-pointer">
              Aplicar watermark nas fotos
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quando desligado, fotos são salvas sem marca d'água.
            </p>
          </div>
          <Switch
            id="wm-enabled"
            checked={enabled}
            disabled={saving}
            onCheckedChange={(v) => {
              setEnabled(v);
              save({ watermark_enabled: v });
            }}
          />
        </div>

        {/* Image upload */}
        <div className="py-4 border-b border-border/60 space-y-3">
          <div>
            <Label className="text-sm font-medium">Imagem do watermark</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              PNG com fundo transparente recomendado. Sem imagem, usa texto <span className="text-[hsl(var(--gold-warm))] font-semibold">AXO FLOORS</span>.
            </p>
          </div>

          {imageUrl ? (
            <div className="flex items-center gap-3">
              <div className="h-16 w-32 rounded-md border border-border bg-[hsl(var(--navy))] flex items-center justify-center p-2">
                <img src={imageUrl} alt="watermark" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                  Substituir
                </Button>
                <Button size="sm" variant="ghost" onClick={removeImage} disabled={uploading} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Remover
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5 mr-1.5" />}
              Enviar imagem
            </Button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        {/* Position */}
        <div className="py-4 border-b border-border/60 space-y-3">
          <Label className="text-sm font-medium">Posição</Label>
          <div className="grid grid-cols-3 gap-2">
            {POSITIONS.map((p) => {
              const active = position === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setPosition(p.value);
                    save({ watermark_position: p.value });
                  }}
                  className={cn(
                    "relative rounded-md border-2 p-2 transition-all text-left",
                    active
                      ? "border-[hsl(var(--gold-warm))] bg-[hsl(var(--gold-warm)/0.08)]"
                      : "border-border hover:border-border/80 bg-card"
                  )}
                >
                  <div className="aspect-[4/3] w-full rounded bg-[hsl(var(--navy))] relative overflow-hidden">
                    <div
                      className={cn(
                        "absolute h-3 rounded-sm bg-[hsl(var(--gold-warm))]",
                        p.value === "bottom-left" && "bottom-1.5 left-1.5 w-8",
                        p.value === "bottom-center" && "bottom-1.5 left-1/2 -translate-x-1/2 w-8",
                        p.value === "bottom-right" && "bottom-1.5 right-1.5 w-8"
                      )}
                    />
                  </div>
                  <p className="text-[11px] text-center mt-1.5 font-medium leading-tight">{p.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        <div className="pt-4 space-y-2">
          <Label className="text-sm font-medium">Preview</Label>
          <div className="aspect-video w-full max-w-md rounded-lg bg-gradient-to-br from-[hsl(var(--navy))] to-[hsl(var(--navy)/0.6)] relative overflow-hidden border border-border">
            <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-widest text-muted-foreground/40">
              Foto do job
            </div>
            {enabled && (
              <div
                className={cn(
                  "absolute",
                  position === "bottom-left" && "bottom-3 left-3",
                  position === "bottom-center" && "bottom-3 left-1/2 -translate-x-1/2",
                  position === "bottom-right" && "bottom-3 right-3"
                )}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="h-10 max-w-[120px] object-contain" />
                ) : (
                  <div className="bg-[hsl(var(--navy))]/85 px-2.5 py-1 rounded text-[hsl(var(--gold-warm))] font-bold text-xs tracking-wide">
                    AXO FLOORS
                  </div>
                )}
              </div>
            )}
          </div>
          {!enabled && (
            <p className="text-xs text-muted-foreground">Watermark desligado — preview ilustrativo.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
