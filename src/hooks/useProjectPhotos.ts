import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import { convertHeicToJpeg, isHeicFile } from "@/utils/heicConverter";

export interface ProjectPhoto {
  id: string;
  project_id: string;
  organization_id: string;
  photo_url: string;
  thumbnail_url: string | null;
  annotated_url: string | null;
  taken_at: string;
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  uploaded_by: string | null;
  created_at: string;
}

const BUCKET = "project-photos";

export function useProjectPhotos(projectId?: string) {
  return useQuery({
    queryKey: ["project_photos", projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<ProjectPhoto[]> => {
      const { data, error } = await supabase
        .from("project_photos" as any)
        .select("*")
        .eq("project_id", projectId!)
        .order("taken_at", { ascending: false });
      if (error) throw error;
      return (data as any) || [];
    },
  });
}

export function useAllOrgPhotos() {
  return useQuery({
    queryKey: ["project_photos", "all-org"],
    queryFn: async (): Promise<(ProjectPhoto & { project_name?: string })[]> => {
      const { data, error } = await supabase
        .from("project_photos" as any)
        .select("*, projects(customer_name, address)")
        .order("taken_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return ((data as any) || []).map((r: any) => ({
        ...r,
        project_name: r.projects?.customer_name || r.projects?.address || "Projeto",
      }));
    },
  });
}

export function useUploadProjectPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, projectId }: { file: File; projectId: string }) => {
      const nameLower = file.name.toLowerCase();
      const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(nameLower);
      const isHeic = isHeicFile(file);

      // Fast path: skip watermark, GPS, and reverse geocoding during upload.
      // HEIC still needs conversion here because project_photos renders public image URLs.
      const workingFile = isHeic && !isVideo ? await convertHeicToJpeg(file) : file;
      if (isHeic && isHeicFile(workingFile)) {
        throw new Error("HEIC não foi convertido para JPG. Tente novamente ou envie JPG/PNG.");
      }

      // 2. Upload to bucket — preserve extension/content-type
      const ts = Date.now();
      const rand = Math.random().toString(36).slice(2, 8);
      const workingNameLower = workingFile.name.toLowerCase();
      const extMatch = workingNameLower.match(/\.([a-z0-9]+)$/);
      const rawExt = extMatch?.[1] ?? (isVideo ? "mp4" : "bin");
      const ext = rawExt.replace(/^hei[cf]$/i, "jpg");
      const path = `${projectId}/${ts}-${rand}.${ext}`;
      const contentType = workingFile.type || file.type || (isVideo ? "video/mp4" : "image/jpeg");
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, workingFile, { cacheControl: "3600", upsert: false, contentType });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const photo_url = pub.publicUrl;

      const { data: user } = await supabase.auth.getUser();

      // 3. Insert row
      const { data, error } = await supabase
        .from("project_photos" as any)
        .insert({
          project_id: projectId,
          organization_id: AXO_ORG_ID,
          photo_url,
          taken_at: new Date().toISOString(),
          latitude: null,
          longitude: null,
          location_label: "Localização não disponível",
          uploaded_by: user?.user?.id ?? null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["project_photos", vars.projectId] });
      qc.invalidateQueries({ queryKey: ["project_photos", "all-org"] });
    },
  });
}

export function useDeleteProjectPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photo: ProjectPhoto) => {
      // Best-effort: also try to delete the storage object
      try {
        const url = new URL(photo.photo_url);
        const idx = url.pathname.indexOf(`/${BUCKET}/`);
        if (idx >= 0) {
          const path = url.pathname.slice(idx + BUCKET.length + 2);
          await supabase.storage.from(BUCKET).remove([path]);
        }
      } catch {}
      const { error } = await supabase
        .from("project_photos" as any)
        .delete()
        .eq("id", photo.id);
      if (error) throw error;
    },
    onSuccess: (_, photo) => {
      qc.invalidateQueries({ queryKey: ["project_photos", photo.project_id] });
      qc.invalidateQueries({ queryKey: ["project_photos", "all-org"] });
    },
  });
}
