import { useRef, useState } from "react";
import { Camera, MapPin, Clock, Trash2, Plus, Share2, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  useProjectPhotos,
  useUploadProjectPhoto,
  useDeleteProjectPhoto,
  type ProjectPhoto,
} from "@/hooks/useProjectPhotos";
import {
  useBeforeAfterPairs,
  useDeleteBeforeAfterPair,
} from "@/hooks/useBeforeAfter";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { NewBeforeAfterDialog } from "./NewBeforeAfterDialog";
import { PhotoAnnotator } from "./PhotoAnnotator";
import { useToast } from "@/hooks/use-toast";

interface Props {
  projectId: string;
}

export function ProjectPhotosSection({ projectId }: Props) {
  const { data: photos = [], isLoading } = useProjectPhotos(projectId);
  const { data: pairs = [] } = useBeforeAfterPairs(projectId);
  const upload = useUploadProjectPhoto();
  const del = useDeleteProjectPhoto();
  const delPair = useDeleteBeforeAfterPair();
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [preview, setPreview] = useState<ProjectPhoto | null>(null);
  const [annotating, setAnnotating] = useState<ProjectPhoto | null>(null);
  const [newPairOpen, setNewPairOpen] = useState(false);

  async function handleFiles(list: FileList | null) {
    if (!list) return;
    const files = Array.from(list);
    for (const f of files) {
      try {
        await upload.mutateAsync({ file: f, projectId });
      } catch (e: any) {
        toast({ title: "Falha no upload", description: e.message, variant: "destructive" });
      }
    }
    toast({ title: `${files.length} foto(s) adicionada(s)` });
    if (inputRef.current) inputRef.current.value = "";
  }

  function shareLink(token: string) {
    const url = `${window.location.origin}/share/before-after/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado", description: url });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Fotos do Job
          <span className="text-xs font-normal text-muted-foreground tabular-nums">
            {photos.length} foto{photos.length === 1 ? "" : "s"} · {pairs.length} before/after
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todas as Fotos</TabsTrigger>
            <TabsTrigger value="ba">Before &amp; After</TabsTrigger>
          </TabsList>

          {/* ============ ALL PHOTOS ============ */}
          <TabsContent value="all" className="space-y-3 pt-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={upload.isPending}
              >
                {upload.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                )}
                Adicionar Foto
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <p className="text-[11px] text-muted-foreground">
                Watermark Axo Floors aplicado automaticamente. Localização e timestamp capturados.
              </p>
            </div>

            {isLoading ? (
              <div className="text-sm text-muted-foreground py-8 text-center">Carregando…</div>
            ) : photos.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-10 text-center text-sm text-muted-foreground">
                Nenhuma foto ainda. Documente o job com fotos timestampadas e geolocalizadas.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {photos.map((p) => (
                  <PhotoCard
                    key={p.id}
                    photo={p}
                    onOpen={() => setPreview(p)}
                    onDelete={() => {
                      if (confirm("Excluir esta foto?")) del.mutate(p);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ============ BEFORE / AFTER ============ */}
          <TabsContent value="ba" className="space-y-3 pt-3">
            <Button size="sm" onClick={() => setNewPairOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Novo par Before/After
            </Button>

            {pairs.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-10 text-center text-sm text-muted-foreground">
                Nenhum par criado. Crie comparações lado a lado para compartilhar.
              </div>
            ) : (
              <div className="space-y-4">
                {pairs.map((pair) => (
                  <div key={pair.id} className="border rounded-lg overflow-hidden bg-card">
                    <div className="px-3 py-2 border-b flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{pair.title}</p>
                        {pair.completed_date && (
                          <p className="text-[11px] text-muted-foreground tabular-nums">
                            {format(new Date(pair.completed_date), "dd MMM yyyy")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => shareLink(pair.share_token)}
                          className="h-8 gap-1.5"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          Compartilhar
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (confirm("Excluir este par?")) delPair.mutate(pair);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <BeforeAfterSlider
                      beforeUrl={pair.before_url}
                      afterUrl={pair.after_url}
                    />
                  </div>
                ))}
              </div>
            )}

            <NewBeforeAfterDialog
              open={newPairOpen}
              onOpenChange={setNewPairOpen}
              projectId={projectId}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Lightbox */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="max-w-5xl w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <img
              src={preview.annotated_url || preview.photo_url}
              alt=""
              className="max-h-[80vh] mx-auto object-contain rounded"
            />
            <div className="text-center text-sm space-y-1">
              <p className="flex items-center justify-center gap-1.5 text-muted-foreground tabular-nums">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(preview.taken_at), "dd MMM yyyy 'às' HH:mm")}
              </p>
              <p className="flex items-center justify-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {preview.location_label || "Localização não disponível"}
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => { setAnnotating(preview); setPreview(null); }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Anotar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPreview(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {annotating && (
        <PhotoAnnotator
          photo={annotating}
          imageUrl={annotating.photo_url}
          onClose={() => setAnnotating(null)}
        />
      )}
    </Card>
  );
}

function PhotoCard({
  photo,
  onOpen,
  onDelete,
}: {
  photo: ProjectPhoto;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="group relative aspect-square rounded-md overflow-hidden bg-muted border border-border/60 cursor-pointer"
      onClick={onOpen}
    >
      <img
        src={photo.photo_url}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-1 right-1 h-6 w-6 rounded bg-background/85 backdrop-blur opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-all"
      >
        <Trash2 className="h-3 w-3" />
      </button>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pt-6 pb-1 space-y-0.5">
        <p className="text-[10px] text-white tabular-nums flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          {format(new Date(photo.taken_at), "dd/MM HH:mm")}
        </p>
        {photo.location_label && (
          <p className="text-[10px] text-white/85 truncate flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{photo.location_label}</span>
          </p>
        )}
      </div>
    </div>
  );
}
