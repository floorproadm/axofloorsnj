import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";

export interface ChecklistItem {
  id: string;
  project_id: string;
  organization_id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const CHECKLIST_TEMPLATES: Record<string, string[]> = {
  "Sanding & Finish": [
    "Remover móveis", "Proteger rodapés", "Lixar (36)", "Lixar (60)", "Lixar (80)",
    "Aspirar", "Aplicar stain", "1ª demão finish", "Aguardar cura",
    "2ª demão finish", "Aguardar cura", "Inspeção final", "Fotos after",
  ],
  "New Installation": [
    "Medir e comprar material", "Aclimatar madeira", "Preparar subfloor",
    "Instalar underlayment", "Instalar piso", "Finalizar bordas",
    "Instalar rodapés", "Limpar", "Fotos after",
  ],
  "Vinyl Plank": [
    "Medir", "Preparar subfloor", "Instalar vinyl", "Finalizar bordas",
    "Instalar rodapés", "Limpar", "Fotos after",
  ],
  "Staircase": [
    "Medir", "Preparar superfície", "Instalar degraus", "Instalar espelhos",
    "Finalizar", "Limpar", "Fotos after",
  ],
};

export function useProjectChecklist(projectId?: string) {
  return useQuery({
    queryKey: ["project_checklists", projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<ChecklistItem[]> => {
      const { data, error } = await supabase
        .from("project_checklists" as any)
        .select("*")
        .eq("project_id", projectId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as any) || [];
    },
  });
}

export function useAddChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, title, sort_order }: { projectId: string; title: string; sort_order: number }) => {
      const { error } = await supabase.from("project_checklists" as any).insert({
        project_id: projectId,
        organization_id: AXO_ORG_ID,
        title,
        sort_order,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["project_checklists", v.projectId] }),
  });
}

export function useAddChecklistTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, items, startOrder }: { projectId: string; items: string[]; startOrder: number }) => {
      const rows = items.map((title, i) => ({
        project_id: projectId,
        organization_id: AXO_ORG_ID,
        title,
        sort_order: startOrder + i,
      }));
      const { error } = await supabase.from("project_checklists" as any).insert(rows as any);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["project_checklists", v.projectId] }),
  });
}

export function useUpdateChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ChecklistItem> }) => {
      const { error } = await supabase.from("project_checklists" as any).update(patch as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project_checklists"] }),
  });
}

export function useDeleteChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_checklists" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project_checklists"] }),
  });
}

export function useReorderChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      await Promise.all(
        items.map((it) =>
          supabase.from("project_checklists" as any).update({ sort_order: it.sort_order } as any).eq("id", it.id)
        )
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project_checklists"] }),
  });
}
