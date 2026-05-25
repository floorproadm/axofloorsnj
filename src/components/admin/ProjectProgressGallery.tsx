import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Upload, Video, Trash2, Image as ImageIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useMediaFiles,
  useUploadMedia,
  useDeleteMedia,
  getMediaSignedUrls,
  type MediaFile,
} from "@/hooks/useMediaFiles";
import { format, isToday, isYesterday } from "date-fns";

interface Props {
  projectId: string;
}

/**
 * Progress Gallery — unified timeline of photos/videos uploaded during the job.
 * No "before/after" categories. Multi-upload, drag-to-reorder by date,
 * grouped by day. Reads/writes media_files with folder_type="job_progress".
 */
export function ProjectProgressGallery({ projectId }: Props) {
  const { data: media = [], isLoading } = useMediaFiles({
    projectId,
    folderType: "job_progress",
  });
  const upload = useUploadMedia();
  const del = useDeleteMedia();
  const inputRef = useRef<HTMLInputElement>(null);
  const [urlMap, setUrlMap] = useState<Record<string, string>>({});
  const [previewing, setPreviewing] = useState<MediaFile | null>(null);

  // Resolve signed URLs for all items
  useEffect(() => {
    if (media.length === 0) return;
    const paths = media.map((m) => m.storage_path);
    getMediaSignedUrls(paths, 3600).then(setUrlMap);
  }, [media]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    // Upload sequentially to keep order stable
    for (const f of list) {
      await upload.mutateAsync({
        file: f,
        projectId,
        folderType: "job_progress",
        visibility: "internal",
      });
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  // Group by day for timeline view
  const grouped = useMemo(() => {
    const map = new Map<string, MediaFile[]>();
    [...media]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .forEach((m) => {
        const day = format(new Date(m.created_at), "yyyy-MM-dd");
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(m);
      });
    return Array.from(map.entries());
  }, [media]);

  const totalPhotos = media.filter((m) => m.file_type === "image").length;
  const totalVideos = media.filter((m) => m.file_type === "video").length;

  function labelDay(day: string) {
    const d = new Date(day);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "EEE, MMM d");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Progress Gallery
            <span className="text-xs font-normal text-muted-foreground">
              {totalPhotos} photo{totalPhotos === 1 ? "" : "s"} · {totalVideos} video{totalVideos === 1 ? "" : "s"}
            </span>
          </CardTitle>
          <Button
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {upload.isPending ? "Uploading…" : "Add media"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Empty state */}
        {!isLoading && media.length === 0 && (
          <label className="flex flex-col items-center justify-center gap-2 p-10 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/40 transition-colors">
            <Camera className="h-7 w-7 text-muted-foreground" />
            <div className="text-sm font-medium">No media yet</div>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Document the job as it happens — site shots, materials, work in progress, finals.
              Drop multiple files at once.
            </p>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}

        {/* Timeline */}
        {grouped.map(([day, items]) => (
          <div key={day} className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {labelDay(day)}
              </h4>
              <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                · {items.length}
              </span>
              <div className="flex-1 h-px bg-border/60" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {items.map((m) => {
                const url = urlMap[m.storage_path];
                const isVideo = m.file_type === "video";
                return (
                  <div
                    key={m.id}
                    className="group relative aspect-square bg-muted rounded-md overflow-hidden border border-border/60 cursor-pointer"
                    onClick={() => setPreviewing(m)}
                  >
                    {url ? (
                      isVideo ? (
                        <>
                          <video
                            src={url}
                            className="w-full h-full object-cover"
                            preload="metadata"
                            muted
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play className="h-6 w-6 text-white drop-shadow" />
                          </div>
                          <Badge className="absolute top-1 left-1 text-[9px] bg-background/90 text-foreground border-0 gap-0.5 px-1.5 py-0">
                            <Video className="h-2.5 w-2.5" /> Video
                          </Badge>
                        </>
                      ) : (
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full animate-pulse bg-muted" />
                    )}

                    <button
                      type="button"
                      title="Remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Remove this file?")) del.mutate(m);
                      }}
                      className="absolute top-1 right-1 h-6 w-6 rounded bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>

                    <div className="absolute bottom-0 inset-x-0 px-1.5 py-1 bg-gradient-to-t from-black/70 to-transparent">
                      <span className="text-[10px] text-white/90 tabular-nums">
                        {format(new Date(m.created_at), "HH:mm")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>

      {/* Lightbox */}
      {previewing && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4"
          onClick={() => setPreviewing(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-sm px-3 py-1.5 rounded bg-card border"
            onClick={() => setPreviewing(null)}
          >
            Close
          </button>
          <div className="max-w-5xl max-h-[90vh] w-full flex items-center justify-center">
            {previewing.file_type === "video" ? (
              <video
                src={urlMap[previewing.storage_path]}
                controls
                autoPlay
                className="max-h-[90vh] max-w-full rounded"
              />
            ) : (
              <img
                src={urlMap[previewing.storage_path]}
                alt=""
                className="max-h-[90vh] max-w-full object-contain rounded"
              />
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
