import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CatalogItemType = "service" | "material";
export type PriceUnit = "sqft" | "unit" | "step" | "linear_ft";

export interface CatalogItem {
  id: string;
  item_type: CatalogItemType;
  name: string;
  description: string | null;
  category: string | null;
  default_material: string | null;
  default_finish: string | null;
  base_price: number;
  price_unit: PriceUnit;
  is_active: boolean;
  display_order: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export type CatalogItemInsert = Omit<CatalogItem, "id" | "created_at" | "updated_at">;
export type CatalogItemUpdate = Partial<CatalogItemInsert> & { id: string };

const QUERY_KEY = "service_catalog";

export function useServiceCatalog(itemType?: CatalogItemType) {
  return useQuery({
    queryKey: [QUERY_KEY, itemType],
    queryFn: async () => {
      let q = supabase
        .from("service_catalog" as any)
        .select("*")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (itemType) {
        q = q.eq("item_type", itemType);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as CatalogItem[];
    },
  });
}

export function useCreateCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: CatalogItemInsert) => {
      const { data, error } = await supabase
        .from("service_catalog" as any)
        .insert(item as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CatalogItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: CatalogItemUpdate) => {
      const { data, error } = await supabase
        .from("service_catalog" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CatalogItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteCatalogItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("service_catalog" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

/** Upload a catalog image and return the storage path */
export async function uploadCatalogImage(itemId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `catalog/${itemId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Delete a catalog image from storage */
export async function deleteCatalogImage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from("media").remove([storagePath]);
  if (error) throw error;
}

/** Get signed URLs for an array of storage paths */
export async function getCatalogSignedUrls(
  paths: string[]
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};

  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUrls(paths, 3600);

  if (error) throw error;

  const map: Record<string, string> = {};
  data?.forEach((item) => {
    if (item.signedUrl && !item.error) {
      map[item.path ?? ""] = item.signedUrl;
    }
  });
  return map;
}
