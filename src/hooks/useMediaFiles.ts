import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { convertHeicToJpeg } from "@/utils/heicConverter";

export interface MediaFile {
  id: string;
  project_id: string | null;
  feed_post_id: string | null;
  uploaded_by: string | null;
  uploaded_by_role: string;
  source_type: string;
  visibility: string;
  folder_type: string;
  file_type: string;
  storage_path: string;
  thumbnail_path: string | null;
  display_order: number;
  metadata: Record<string, any>;
  quality_checked: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaFilters {
  projectId?: string;
  feedPostId?: string;
  sourceType?: string;
  visibility?: string;
  folderType?: string;
  fileType?: string;
}

export interface UploadMediaParams {
  file: File;
  projectId?: string;
  feedPostId?: string;
  sourceType?: string;
  visibility?: string;
  folderType?: string;
  displayOrder?: number;
  metadata?: Record<string, any>;
  silent?: boolean;
  deferInvalidate?: boolean;
}

const STORAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1`;

function normalizeSignedUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${STORAGE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

// --- Query hook ---
export function useMediaFiles(filters: MediaFilters = {}) {
  return useQuery({
    queryKey: ["media-files", filters],
    queryFn: async () => {
      let query = supabase
        .from("media_files")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (filters.projectId) query = query.eq("project_id", filters.projectId);
      if (filters.feedPostId) query = query.eq("feed_post_id", filters.feedPostId);
      if (filters.sourceType) query = query.eq("source_type", filters.sourceType);
      if (filters.visibility) query = query.eq("visibility", filters.visibility);
      if (filters.folderType) query = query.eq("folder_type", filters.folderType);
      if (filters.fileType) query = query.eq("file_type", filters.fileType);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as MediaFile[];
    },
  });
}

// --- Signed URL helper ---
export async function getMediaSignedUrl(storagePath: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUrl(storagePath, expiresIn);
  if (error) {
    console.error("Error creating signed URL:", error);
    return null;
  }
  return normalizeSignedUrl(data.signedUrl || (data as any).signedURL);
}

// --- Batch signed URLs ---
export async function getMediaSignedUrls(paths: string[], expiresIn = 3600): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUrls(paths, expiresIn);
  if (error) {
    console.error("Error creating signed URLs:", error);
    return {};
  }
  const result: Record<string, string> = {};
  (data || []).forEach((item) => {
    const signedUrl = normalizeSignedUrl(item.signedUrl || (item as any).signedURL);
    if (signedUrl && item.path) {
      result[item.path] = signedUrl;
    }
  });
  return result;
}

// --- Build storage path ---
function buildStoragePath(params: UploadMediaParams, ext: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const fileName = `${timestamp}-${random}.${ext}`;

  if (params.projectId) {
    const folder = params.folderType || "job_progress";
    return `projects/${params.projectId}/${folder}/${fileName}`;
  }
  if (params.feedPostId) {
    return `feed/${params.feedPostId}/${fileName}`;
  }
  if (params.sourceType === "marketing") {
    return `marketing/${fileName}`;
  }
  return `temp/${fileName}`;
}

// --- Detect file type ---
function detectFileType(file: File): "image" | "video" | "pdf" {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm|avi|mkv)$/.test(name)) return "video";
  return "image";
}

function getUploadContentType(file: File): string {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (/\.hei[cf]$/.test(name)) return "image/heic";
  if (/\.mov$/.test(name)) return "video/quicktime";
  if (/\.mp4$/.test(name)) return "video/mp4";
  if (/\.jpe?g$/.test(name)) return "image/jpeg";
  if (/\.png$/.test(name)) return "image/png";
  if (/\.webp$/.test(name)) return "image/webp";
  return "application/octet-stream";
}

function getFileExtension(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext || "bin";
}

function isHeicPath(path: string): boolean {
  return /\.hei[cf]$/i.test(path);
}

function jpegPathFor(path: string): string {
  return path.replace(/\.[^/.]+$/i, ".jpg");
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => window.clearTimeout(timer));
  });
}

async function replaceHeicWithJpeg(media: MediaFile, file: File) {
  const jpg = await convertHeicToJpeg(file);
  const jpgPath = jpegPathFor(media.storage_path);

  const { error: uploadError } = await supabase.storage.from("media").upload(jpgPath, jpg, {
    cacheControl: "3600",
    upsert: true,
    contentType: "image/jpeg",
  });
  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from("media_files")
    .update({
      storage_path: jpgPath,
      metadata: {
        ...(media.metadata || {}),
        original_storage_path: media.storage_path,
        converted_from_heic: true,
      },
    })
    .eq("id", media.id);
  if (updateError) throw updateError;

  await supabase.storage.from("media").remove([media.storage_path]);
}

export async function convertUploadedHeicMediaFile(media: MediaFile, file: File): Promise<boolean> {
  if (!isHeicPath(media.storage_path)) return false;
  await replaceHeicWithJpeg(media, file);
  return true;
}

export async function repairHeicMediaFile(media: MediaFile): Promise<boolean> {
  if (!isHeicPath(media.storage_path)) return false;
  const signedUrl = await getMediaSignedUrl(media.storage_path, 600);
  if (!signedUrl) return false;
  const response = await fetch(signedUrl);
  if (!response.ok) return false;
  const blob = await response.blob();
  const file = new File([blob], media.metadata?.original_name || "upload.heic", {
    type: blob.type || "image/heic",
  });
  await replaceHeicWithJpeg(media, file);
  return true;
}

// --- Upload mutation ---
export function useUploadMedia() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: UploadMediaParams) => {
      // Upload must stay instant. Never run HEIC/video/image processing in this path.
      // Browser-incompatible formats can be repaired after the row exists, but upload cannot block on it.
      const uploadFile = params.file;
      const ext = getFileExtension(uploadFile);
      const storagePath = buildStoragePath(params, ext);
      const fileType = detectFileType(uploadFile);

      const { data: userData } = await supabase.auth.getUser();

      const uploadPromise = supabase.storage.from("media").upload(storagePath, uploadFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: getUploadContentType(uploadFile),
      });

      const { error: uploadError } = await withTimeout(
        uploadPromise,
        45000,
        "Upload demorou demais. Tente novamente com sinal melhor."
      );
      if (uploadError) throw uploadError;

      const { data, error: dbError } = await supabase
        .from("media_files")
        .insert({
          project_id: params.projectId || null,
          feed_post_id: params.feedPostId || null,
          source_type: params.sourceType || "admin_upload",
          visibility: params.visibility || "internal",
          folder_type: params.folderType || "job_progress",
          file_type: fileType,
          storage_path: storagePath,
          display_order: params.displayOrder || 0,
          metadata: { ...(params.metadata || {}), original_name: params.file.name },
          uploaded_by: userData.user?.id || null,
        })
        .select()
        .single();
      if (dbError) throw dbError;

      return data as MediaFile;
    },
    onSuccess: (_, vars) => {
      if (!vars.deferInvalidate) queryClient.invalidateQueries({ queryKey: ["media-files"] });
      if (!vars.silent) toast({ title: "Arquivo enviado com sucesso" });
    },
    onError: (err: any, vars) => {
      if (!vars?.silent) {
        toast({
          title: "Erro no upload",
          description: err.message,
          variant: "destructive",
        });
      }
    },
  });
}

// --- Delete mutation ---
export function useDeleteMedia() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (media: MediaFile) => {
      // Remove from storage
      const { error: storageError } = await supabase.storage
        .from("media")
        .remove([media.storage_path]);
      if (storageError) {
        console.error("Storage delete error:", storageError);
      }

      // Remove record
      const { error: dbError } = await supabase
        .from("media_files")
        .delete()
        .eq("id", media.id);
      if (dbError) throw dbError;

      return media.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-files"] });
      toast({ title: "Arquivo removido" });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao remover",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}
