import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { applyWatermark, getCurrentPosition, reverseGeocode } from "@/utils/watermark";
import { AXO_ORG_ID } from "@/lib/constants";

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
      const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(nameLower);

      // Convert HEIC/HEIF to JPEG client-side so browsers can display it (and we can watermark)
      let workingFile: File = file;
      if (isHeic) {
        try {
          const heic2any = (await import("heic2any")).default;
          const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
          const blob = Array.isArray(converted) ? converted[0] : converted;
          workingFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
            type: "image/jpeg",
          });
        } catch (e) {
          console.error("HEIC conversion failed", e);
          throw new Error("Não foi possível converter o arquivo HEIC. Tente exportar como JPG.");
        }
      }

      // Canvas/watermark only works on standard browser-decodable images
      const canWatermark = !isVideo;

      // 1. Geolocation (best-effort) + watermark in parallel when applicable
      const [pos, processed] = await Promise.all([
        getCurrentPosition(),
        canWatermark ? applyWatermark(workingFile) : Promise.resolve(workingFile),
      ]);

      let latitude: number | null = null;
      let longitude: number | null = null;
      let location_label: string | null = "Localização não disponível";
      if (pos) {
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
        const label = await reverseGeocode(latitude, longitude);
        location_label = label || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }

      // 2. Upload to bucket — preserve extension/content-type
      const ts = Date.now();
      const rand = Math.random().toString(36).slice(2, 8);
      const extMatch = nameLower.match(/\.([a-z0-9]+)$/);
      const ext = canWatermark ? "jpg" : (extMatch?.[1] ?? (isVideo ? "mp4" : "bin"));
      const path = `${projectId}/${ts}-${rand}.${ext}`;
      const contentType = canWatermark
        ? "image/jpeg"
        : (file.type || (isVideo ? "video/mp4" : "application/octet-stream"));
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, processed, { cacheControl: "3600", upsert: false, contentType });
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
          latitude,
          longitude,
          location_label,
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
