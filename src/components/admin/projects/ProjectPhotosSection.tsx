import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, MapPin, Clock, Trash2, Plus, Share2, Loader2, Pencil, Play, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isYesterday } from "date-fns";
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
import {
  useMediaFiles,
  useDeleteMedia,
  getMediaSignedUrls,
  type MediaFile,
} from "@/hooks/useMediaFiles";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { NewBeforeAfterDialog } from "./NewBeforeAfterDialog";
import { PhotoAnnotator } from "./PhotoAnnotator";
import { useToast } from "@/hooks/use-toast";

interface Props {
  projectId: string;
}

type TimelineItem =
  | { kind: "photo"; at: string; data: ProjectPhoto }
  | { kind: "media"; at: string; data: MediaFile };

export function ProjectPhotosSection({ projectId }: Props) {
  const { data: photos = [], isLoading: loadingPhotos } = useProjectPhotos(projectId);
  const { data: mediaList = [], isLoading: loadingMedia } = useMediaFiles({
    projectId,
    folderType: "job_progress",
  });
  const { data: pairs = [] } = useBeforeAfterPairs(projectId);
  const upload = useUploadProjectPhoto();
  const del = useDeleteProjectPhoto();
  const delMedia = useDeleteMedia();
  const delPair = useDeleteBeforeAfterPair();
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [preview, setPreview] = useState<ProjectPhoto | null>(null);
  const [mediaPreview, setMediaPreview] = useState<MediaFile | null>(null);
  const [annotating, setAnnotating] = useState<ProjectPhoto | null>(null);
  const [newPairOpen, setNewPairOpen] = useState(false);
  
  const [urlMap, setUrlMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mediaList.length === 0) return;
    getMediaSignedUrls(mediaList.map((m) => m.storage_path), 3600).then(setUrlMap);
  }, [mediaList]);

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
    toast({ title: `${files.length} arquivo(s) adicionado(s)` });
    if (inputRef.current) inputRef.current.value = "";
  }

  function shareLink(token: string) {
    const url = `${window.location.origin}/share/before-after/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado", description: url });
  }

  // Unified chronological timeline grouped by day
  const grouped = useMemo(() => {
    const items: TimelineItem[] = [
      ...photos.map((p) => ({ kind: "photo" as const, at: p.taken_at || p.created_at, data: p })),
      ...mediaList.map((m) => ({ kind: "media" as const, at: m.created_at, data: m })),
    ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

    const map = new Map<string, TimelineItem[]>();
    items.forEach((it) => {
      const day = format(new Date(it.at), "yyyy-MM-dd");
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(it);
    });
    return Array.from(map.entries());
  }, [photos, mediaList]);

  function labelDay(day: string) {
    const d = new Date(day);
    if (isToday(d)) return "Hoje";
    if (isYesterday(d)) return "Ontem";
    return format(d, "EEE, dd MMM");
  }

  const totalItems = photos.length + mediaList.length;
  const loading = loadingPhotos || loadingMedia;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Mídia do Job
          <span className="text-xs font-normal text-muted-foreground tabular-nums">
            {totalItems} item{totalItems === 1 ? "" : "s"} · {pairs.length} before/after
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="bg-navy/40 border border-gold/20">
            <TabsTrigger value="progress" className="data-[state=active]:bg-gold data-[state=active]:text-navy">Progresso</TabsTrigger>
            <TabsTrigger value="ba" className="data-[state=active]:bg-gold data-[state=active]:text-navy">Before &amp; After</TabsTrigger>
          </TabsList>

          {/* ============ PROGRESSO (project_photos + media_files timeline) ============ */}
          <TabsContent value="progress" className="space-y-3 pt-3">
            <div className="rounded-lg border border-gold/20 bg-navy/30 p-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
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
                  Adicionar mídia
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*,image/heic,image/heif,video/*,.heic,.heif,.mov,.mp4,.m4v,.webm"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Aceita fotos (JPG, PNG, HEIC) e vídeos (MP4, MOV, WebM). Watermark, localização e timestamp aplicados em fotos conforme <span className="text-white font-medium">Settings → Watermark</span>. Vídeos e HEIC são enviados sem watermark.
              </p>
            </div>

            {loading ? (
              <div className="text-sm text-muted-foreground py-8 text-center">Carregando…</div>
            ) : totalItems === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-10 text-center text-sm text-muted-foreground">
                Nenhum registro ainda. Documente o job cronologicamente com fotos do campo.
              </div>
            ) : (
              <div className="space-y-5">
                {grouped.map(([day, items]) => (
                  <div key={day} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {labelDay(day)}
                      </h4>
                      <span className="text-[10px] text-muted-foreground/60 tabular-nums">· {items.length}</span>
                      <div className="flex-1 h-px bg-border/60" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {items.map((it) =>
                        it.kind === "photo" ? (
                          <PhotoCard
                            key={`p-${it.data.id}`}
                            photo={it.data}
                            onOpen={() => setPreview(it.data)}
                            onDelete={() => {
                              if (confirm("Excluir esta foto?")) del.mutate(it.data);
                            }}
                          />
                        ) : (
                          <MediaCard
                            key={`m-${it.data.id}`}
                            media={it.data}
                            url={urlMap[it.data.storage_path]}
                            onOpen={() => setMediaPreview(it.data)}
                            onDelete={() => {
                              if (confirm("Excluir este arquivo?")) delMedia.mutate(it.data);
                            }}
                          />
                        )
                      )}
                    </div>
                  </div>
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

      {/* Lightbox - project_photos */}
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

      {/* Lightbox - media_files */}
      {mediaPreview && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4"
          onClick={() => setMediaPreview(null)}
        >
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            {mediaPreview.file_type === "video" ? (
              <video
                src={urlMap[mediaPreview.storage_path]}
                controls
                autoPlay
                className="max-h-[85vh] max-w-full mx-auto rounded"
              />
            ) : (
              <img
                src={urlMap[mediaPreview.storage_path]}
                alt=""
                className="max-h-[85vh] max-w-full mx-auto object-contain rounded"
              />
            )}
            <div className="text-center mt-3">
              <Button variant="outline" size="sm" onClick={() => setMediaPreview(null)}>Fechar</Button>
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
        src={photo.annotated_url || photo.photo_url}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {photo.annotated_url && (
        <Badge className="absolute top-1 left-1 h-5 text-[9px] px-1.5 bg-primary/90 backdrop-blur">
          Anotada
        </Badge>
      )}
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

function MediaCard({
  media,
  url,
  onOpen,
  onDelete,
}: {
  media: MediaFile;
  url?: string;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const isVideo = media.file_type === "video";
  return (
    <div
      className="group relative aspect-square rounded-md overflow-hidden bg-muted border border-border/60 cursor-pointer"
      onClick={onOpen}
    >
      {url ? (
        isVideo ? (
          <>
            <video src={url} className="w-full h-full object-cover" preload="metadata" muted />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Play className="h-6 w-6 text-white drop-shadow" />
            </div>
            <Badge className="absolute top-1 left-1 h-5 text-[9px] px-1.5 gap-0.5 bg-background/90 text-foreground border-0">
              <VideoIcon className="h-2.5 w-2.5" /> Vídeo
            </Badge>
          </>
        ) : (
          <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
        )
      ) : (
        <div className="w-full h-full animate-pulse bg-muted" />
      )}
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
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pt-6 pb-1">
        <p className="text-[10px] text-white tabular-nums flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          {format(new Date(media.created_at), "dd/MM HH:mm")}
        </p>
      </div>
    </div>
  );
}
