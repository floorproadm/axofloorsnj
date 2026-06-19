import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const TAGS = ["Before", "After", "During", "Final"] as const;

interface Photo {
  id: string;
  title: string;
  image_url: string;
  tag?: string | null;
  service_category?: string | null;
  paired_before_id?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photo: Photo | null;
  onSaved?: () => void;
}

export function GalleryPhotoEditDialog({ open, onOpenChange, photo, onSaved }: Props) {
  const [tag, setTag] = useState<string>("none");
  const [serviceCategory, setServiceCategory] = useState<string>("none");
  const [pairedBeforeId, setPairedBeforeId] = useState<string>("none");
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<{ id: string; name: string; category: string | null }[]>([]);
  const [beforePhotos, setBeforePhotos] = useState<Photo[]>([]);

  useEffect(() => {
    if (!open) return;
    setTag(photo?.tag || "none");
    setServiceCategory(photo?.service_category || "none");
    setPairedBeforeId(photo?.paired_before_id || "none");
  }, [open, photo]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: svc } = await supabase
        .from("service_catalog")
        .select("id, name, category")
        .eq("is_active", true)
        .order("category");
      setServices((svc as any) || []);

      const { data: before } = await supabase
        .from("gallery_projects")
        .select("id, title, image_url, tag")
        .eq("tag", "Before")
        .order("created_at", { ascending: false })
        .limit(100);
      setBeforePhotos(((before as any) || []) as Photo[]);
    })();
  }, [open]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => s.category && set.add(s.category));
    services.forEach((s) => set.add(s.name));
    return Array.from(set).filter(Boolean).sort();
  }, [services]);

  const handleSave = async () => {
    if (!photo) return;
    setSaving(true);
    const { error } = await supabase
      .from("gallery_projects")
      .update({
        tag: tag === "none" ? null : tag,
        service_category: serviceCategory === "none" ? null : serviceCategory,
        paired_before_id: tag === "After" && pairedBeforeId !== "none" ? pairedBeforeId : null,
      } as any)
      .eq("id", photo.id);
    setSaving(false);
    if (error) {
      toast.error("Falha ao salvar: " + error.message);
      return;
    }
    toast.success("Foto atualizada");
    onSaved?.();
    onOpenChange(false);
  };

  if (!photo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Editar foto</DialogTitle>
        </DialogHeader>

        <div className="flex gap-3">
          <img
            src={photo.image_url}
            alt={photo.title}
            className="w-24 h-24 object-cover rounded-md border"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{photo.title}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tag</Label>
            <Select value={tag} onValueChange={setTag}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sem tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem tag</SelectItem>
                {TAGS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Serviço relacionado</Label>
            <Select value={serviceCategory} onValueChange={setServiceCategory}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tag === "After" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Vincular com foto Before</Label>
              <Select value={pairedBeforeId} onValueChange={setPairedBeforeId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione a foto Before" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {beforePhotos.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
