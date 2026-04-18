import { useCallback, useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Video, Loader2, AlertCircle, FolderPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { isHeicFile, convertHeicToJpeg } from "@/utils/heicConverter";
import { needsTranscoding, supportsWebCodecs, transcodeToMp4 } from "@/utils/videoTranscoder";

const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm,.heic,.heif,.mov,.mp4,.webm";
const MAX_SIZE_MB = 200;

export interface PendingItem {
  id: string;
  file: File;
  kind: "image" | "video";
  status: "pending" | "preparing" | "uploading" | "done" | "error";
  progress: number; // 0-100
  error?: string;
  previewUrl?: string;
}

export interface FolderOption {
  id: string;
  name: string;
}

interface MediaQuickUploadProps {
  /** Folder list shown in the inline picker */
  folders: FolderOption[];
  /** Currently selected folder id (controlled) */
  folderId: string | null;
  onFolderChange: (folderId: string | null) => void;
  /** Open a "New Folder" dialog from inside the uploader */
  onCreateFolder?: () => void;
  /** Called once per file after it has been prepared (HEIC/transcode). Caller does the actual upload. */
  onUpload: (file: File, kind: "image" | "video", onProgress: (p: number) => void) => Promise<void>;
  /** Optional batch hook for "after all done" actions (e.g. invalidate queries) */
  onBatchComplete?: () => void;
  /** Compact variant for tight UI */
  compact?: boolean;
  title?: string;
}

const isVideo = (file: File) =>
  file.type.startsWith("video/") || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);

export function MediaQuickUpload({
  folders,
  folderId,
  onFolderChange,
  onCreateFolder,
  onUpload,
  onBatchComplete,
  compact = false,
  title = "Upload de fotos e videos",
}: MediaQuickUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [items, setItems] = useState<PendingItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const updateItem = (id: string, patch: Partial<PendingItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const validate = (file: File): string | null => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `Arquivo > ${MAX_SIZE_MB}MB`;
    return null;
  };

  const processOne = async (item: PendingItem) => {
    try {
      let workingFile = item.file;

      // HEIC -> JPEG
      if (isHeicFile(workingFile)) {
        updateItem(item.id, { status: "preparing", progress: 5 });
        workingFile = await convertHeicToJpeg(workingFile);
      }

      // .mov / .avi -> .mp4
      if (item.kind === "video" && needsTranscoding(workingFile)) {
        if (!supportsWebCodecs()) {
          throw new Error("Browser nao suporta conversao de video. Use MP4.");
        }
        updateItem(item.id, { status: "preparing", progress: 10 });
        workingFile = await transcodeToMp4(workingFile, (p) => {
          updateItem(item.id, { progress: 10 + Math.round(p * 40) }); // 10-50%
        });
      }

      updateItem(item.id, { status: "uploading", progress: 60 });
      await onUpload(workingFile, item.kind, (p) => {
        updateItem(item.id, { progress: 60 + Math.round(p * 0.4) }); // 60-100%
      });
      updateItem(item.id, { status: "done", progress: 100 });
    } catch (err: any) {
      console.error("Upload error:", err);
      updateItem(item.id, {
        status: "error",
        error: err?.message || "Falha no upload",
      });
    }
  };

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);

      const queued: PendingItem[] = [];
      for (const f of files) {
        const err = validate(f);
        if (err) {
          toast({ title: f.name, description: err, variant: "destructive" });
          continue;
        }
        queued.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file: f,
          kind: isVideo(f) ? "video" : "image",
          status: "pending",
          progress: 0,
          previewUrl: !isVideo(f) ? URL.createObjectURL(f) : undefined,
        });
      }

      if (queued.length === 0) return;
      setItems((prev) => [...prev, ...queued]);
      setIsProcessing(true);

      // sequential to keep memory low (esp. for transcoding)
      for (const it of queued) {
        await processOne(it);
      }

      setIsProcessing(false);
      onBatchComplete?.();

      const okCount = queued.filter((q) => q.status === "done").length;
      toast({
        title: "Upload concluido",
        description: `${okCount} arquivo(s) processados`,
      });
    },
    [folderId, onUpload, onBatchComplete, toast],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const clearDone = () => {
    setItems((prev) => {
      prev.filter((p) => p.status === "done").forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
      return prev.filter((p) => p.status !== "done");
    });
  };

  return (
    <Card className="border-border/60 overflow-hidden">
      <div className="p-3 sm:p-4 space-y-3">
        {/* Folder picker row */}
        <div className="flex items-center gap-2">
          <Select
            value={folderId ?? "_none"}
            onValueChange={(v) => onFolderChange(v === "_none" ? null : v)}
          >
            <SelectTrigger className="h-9 flex-1 text-sm">
              <SelectValue placeholder="Sem pasta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Sem pasta</SelectItem>
              {folders.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onCreateFolder && (
            <Button variant="outline" size="sm" onClick={onCreateFolder} className="flex-shrink-0">
              <FolderPlus className="w-4 h-4 mr-1" /> Nova
            </Button>
          )}
        </div>

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          className={cn(
            "border-2 border-dashed rounded-xl transition-colors text-center",
            compact ? "p-4" : "p-6 sm:p-8",
            isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 bg-muted/20",
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">
                Arraste ou toque para selecionar &middot; HEIC/MOV convertidos automaticamente
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto pt-1">
              <Button
                size="sm"
                variant="default"
                onClick={() => inputRef.current?.click()}
                className="flex-1 sm:flex-none"
              >
                <ImageIcon className="w-4 h-4 mr-1" /> Galeria
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => cameraRef.current?.click()}
                className="flex-1 sm:flex-none"
              >
                <Video className="w-4 h-4 mr-1" /> Camera
              </Button>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {/* Queue */}
        {items.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {items.filter((i) => i.status === "done").length}/{items.length} concluidos
              </p>
              {!isProcessing && items.some((i) => i.status === "done") && (
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={clearDone}>
                  Limpar concluidos
                </Button>
              )}
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/40"
                >
                  {/* Thumb */}
                  <div className="w-10 h-10 rounded-md bg-background flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {it.previewUrl ? (
                      <img src={it.previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : it.kind === "video" ? (
                      <Video className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info + progress */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{it.file.name}</p>
                    {it.status === "error" ? (
                      <p className="text-[11px] text-destructive truncate">{it.error}</p>
                    ) : it.status === "done" ? (
                      <p className="text-[11px] text-muted-foreground">Pronto</p>
                    ) : (
                      <Progress value={it.progress} className="h-1 mt-1" />
                    )}
                  </div>

                  {/* State icon */}
                  <div className="flex-shrink-0">
                    {it.status === "done" ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : it.status === "error" ? (
                      <button onClick={() => removeItem(it.id)} aria-label="Remover">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      </button>
                    ) : it.status === "uploading" || it.status === "preparing" ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <button onClick={() => removeItem(it.id)} aria-label="Remover">
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
