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
    mutationFn: async ({ file, projectId, skipWatermark = false }: { file: File; projectId: string; skipWatermark?: boolean }) => {
      // 1. Geolocation (best-effort, parallel with watermark)
      const [pos, watermarked] = await Promise.all([
        getCurrentPosition(),
        skipWatermark ? Promise.resolve(file) : applyWatermark(file),
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

      // 2. Upload to bucket
      const ts = Date.now();
      const path = `${projectId}/${ts}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, watermarked, { cacheControl: "3600", upsert: false });
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
