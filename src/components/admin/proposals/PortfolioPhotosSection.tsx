import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Image as ImageIcon, Loader2, Check, Search } from "lucide-react";
import { toast } from "sonner";

const MAX_PHOTOS = 6;

interface Props {
  proposalId: string;
  projectType?: string | null;
}

interface GalleryPhoto {
  id: string;
  title: string;
  image_url: string;
  category: string | null;
  location: string | null;
  service_category: string | null;
  tag: string | null;
}

export function PortfolioPhotosSection({ proposalId, projectType }: Props) {
  const [ids, setIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [pickerSelected, setPickerSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filterRelevant, setFilterRelevant] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load current selection
  useEffect(() => {
    if (!proposalId) return;
    (async () => {
      const { data } = await supabase
        .from("proposals")
        .select("portfolio_photo_ids")
        .eq("id", proposalId)
        .maybeSingle();
      const arr = ((data as any)?.portfolio_photo_ids as string[]) || [];
      setIds(arr);
    })();
  }, [proposalId]);

  // Load gallery photos (cached when modal opens)
  const loadPhotos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("gallery_projects")
      .select("id, title, image_url, category, location, service_category, tag")
      .order("display_order", { ascending: true });
    setPhotos(((data as any) || []) as GalleryPhoto[]);
    setLoading(false);
  };

  const openPicker = () => {
    setPickerSelected(ids);
    setSearch("");
    setOpen(true);
    if (photos.length === 0) loadPhotos();
  };

  const selectedPhotos = useMemo(
    () => ids.map((id) => photos.find((p) => p.id === id)).filter(Boolean) as GalleryPhoto[],
    [ids, photos]
  );

  // For removed thumbnails: if photos haven't loaded yet, load them so we can show
  useEffect(() => {
    if (ids.length > 0 && photos.length === 0) loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  const filteredPickerPhotos = useMemo(() => {
    let list = photos;
    if (filterRelevant && projectType) {
      const t = projectType.toLowerCase();
      list = list.filter(
        (p) =>
          (p.service_category && p.service_category.toLowerCase().includes(t)) ||
          (p.category && p.category.toLowerCase().includes(t))
      );
      if (list.length === 0) list = photos; // fallback to all
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.location || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [photos, filterRelevant, projectType, search]);

  const togglePick = (id: string) => {
    setPickerSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_PHOTOS) {
        toast.warning(`Máximo de ${MAX_PHOTOS} fotos.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const persist = async (next: string[]) => {
    setSaving(true);
    const { error } = await supabase
      .from("proposals")
      .update({ portfolio_photo_ids: next } as any)
      .eq("id", proposalId);
    setSaving(false);
    if (error) {
      toast.error("Falha ao salvar: " + error.message);
      return false;
    }
    return true;
  };

  const handleConfirm = async () => {
    const ok = await persist(pickerSelected);
    if (ok) {
      setIds(pickerSelected);
      setOpen(false);
      toast.success("Fotos do portfólio atualizadas");
    }
  };

  const handleRemove = async (id: string) => {
    const next = ids.filter((x) => x !== id);
    const ok = await persist(next);
    if (ok) setIds(next);
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Fotos do Portfólio (opcional)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Inclua trabalhos anteriores na proposta — até {MAX_PHOTOS} fotos da sua Galeria.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={openPicker}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar fotos do portfólio
        </Button>
      </CardHeader>
      <CardContent>
        {ids.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Nenhuma foto selecionada. Adicione fotos da Galeria para mostrar seus trabalhos anteriores ao cliente.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {selectedPhotos.map((p) => (
              <div key={p.id} className="relative group aspect-square rounded-md overflow-hidden border">
                <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                <button
                  type="button"
                  onClick={() => handleRemove(p.id)}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  aria-label="Remover"
                >
                  <X className="h-3 w-3" />
                </button>
                {p.tag && (
                  <Badge className="absolute bottom-1 left-1 h-4 text-[9px] bg-white/90 text-black">
                    {p.tag}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Selecione fotos do portfólio (máx. {MAX_PHOTOS})</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, local ou categoria..."
                className="pl-8 h-8 text-sm"
              />
            </div>
            {projectType && (
              <Button
                size="sm"
                variant={filterRelevant ? "default" : "outline"}
                onClick={() => setFilterRelevant((v) => !v)}
                className="h-8"
              >
                {filterRelevant ? "Filtrando por: " + projectType : "Mostrar todas"}
              </Button>
            )}
            <Badge variant="outline">{pickerSelected.length}/{MAX_PHOTOS}</Badge>
          </div>

          <div className="flex-1 overflow-y-auto border rounded-md p-3">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando...
              </div>
            ) : filteredPickerPhotos.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">
                Nenhuma foto encontrada.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {filteredPickerPhotos.map((p) => {
                  const selected = pickerSelected.includes(p.id);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => togglePick(p.id)}
                      className={`relative aspect-square rounded-md overflow-hidden border-2 transition ${
                        selected ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-muted-foreground/30"
                      }`}
                    >
                      <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                      {selected && (
                        <div className="absolute top-1 right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                        <p className="text-[10px] text-white font-medium truncate">{p.title}</p>
                        {(p.tag || p.location) && (
                          <p className="text-[9px] text-white/80 truncate">
                            {[p.tag, p.location].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Salvar seleção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
