import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  return data.signedUrl;
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
    if (item.signedUrl && item.path) {
      result[item.path] = item.signedUrl;
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
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("video/")) return "video";
  return "image";
}

// --- Upload mutation ---
export function useUploadMedia() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: UploadMediaParams) => {
      const ext = params.file.name.split(".").pop() || "bin";
      const storagePath = buildStoragePath(params, ext);
      const fileType = detectFileType(params.file);

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(storagePath, params.file);
      if (uploadError) throw uploadError;

      // Insert record
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
          metadata: params.metadata || {},
        })
        .select()
        .single();
      if (dbError) throw dbError;

      return data as MediaFile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-files"] });
      toast({ title: "Arquivo enviado com sucesso" });
    },
    onError: (err: any) => {
      toast({
        title: "Erro no upload",
        description: err.message,
        variant: "destructive",
      });
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
