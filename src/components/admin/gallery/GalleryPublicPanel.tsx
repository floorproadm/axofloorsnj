import { useMemo, useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { ArrowLeft, FolderOpen, Star, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { MediaQuickUpload } from "@/components/admin/gallery/MediaQuickUpload";
import { FolderHubGrid, type FolderHubItem } from "@/components/admin/gallery/FolderHubGrid";
import { QuickFolderDialog } from "@/components/admin/gallery/QuickFolderDialog";

interface GalleryProject {
  id: string;
  title: string;
  category: string;
  location: string;
  image_url: string;
  is_featured: boolean;
  parent_folder_id: string | null;
}

/**
 * Practical Public Gallery view (mirrors Feed UX).
 * Each item = 1 photo/video card on the public site.
 */
export function GalleryPublicPanel() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeFolder, setActiveFolder] = useState<FolderHubItem | "unfiled" | null>(null);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);

  // Folders
  const { data: folders = [] } = useQuery({
    queryKey: ["gallery-folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_folders")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Projects (with image URLs)
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["gallery-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_projects")
        .select("id, title, category, location, image_url, is_featured, parent_folder_id")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as GalleryProject[];
    },
  });

  const folderItems: FolderHubItem[] = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((p) => {
      if (p.parent_folder_id) counts.set(p.parent_folder_id, (counts.get(p.parent_folder_id) ?? 0) + 1);
    });
    return folders.map((f: any) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      cover_image_url: f.cover_image_url,
      item_count: counts.get(f.id) ?? 0,
    }));
  }, [folders, projects]);

  const visibleProjects = useMemo(() => {
    if (activeFolder === "unfiled") return projects.filter((p) => !p.parent_folder_id);
    if (activeFolder) return projects.filter((p) => p.parent_folder_id === (activeFolder as FolderHubItem).id);
    return [];
  }, [projects, activeFolder]);

  /** Upload one media file -> creates a gallery_projects row (1 file = 1 card) */
  const handleUpload = async (file: File, kind: "image" | "video", onProgress: (p: number) => void) => {
    const targetFolderId =
      uploadFolderId ?? (activeFolder && activeFolder !== "unfiled" ? activeFolder.id : null);

    const ext = file.name.split(".").pop();
    const path = `public/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    onProgress(0.2);
    const { error: upErr } = await supabase.storage.from("gallery").upload(path, file);
    if (upErr) throw upErr;

    const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(path);
    onProgress(0.7);

    const folderRow = folders.find((f: any) => f.id === targetFolderId);

    const { error: insErr } = await supabase.from("gallery_projects").insert({
      title: file.name.replace(/\.[^.]+$/, ""),
      description: "",
      category: folderRow?.name || "Hardwood Flooring",
      location: "",
      image_url: urlData.publicUrl,
      is_featured: false,
      parent_folder_id: targetFolderId,
      folder_name: folderRow?.name || null,
      organization_id: AXO_ORG_ID,
      display_order: projects.length,
    });
    if (insErr) throw insErr;

    onProgress(1);
  };

  const handleBatchComplete = () => {
    qc.invalidateQueries({ queryKey: ["gallery-projects"] });
    qc.invalidateQueries({ queryKey: ["gallery-folders"] });
  };

  const handleCreateFolder = async ({ name, description }: { name: string; description?: string }) => {
    const { error } = await supabase.from("gallery_folders").insert({
      name,
      description: description || null,
      organization_id: AXO_ORG_ID,
      display_order: folders.length,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["gallery-folders"] });
    toast({ title: "Pasta criada" });
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Excluir este item da galeria publica?")) return;
    const { error } = await supabase.from("gallery_projects").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["gallery-projects"] });
  };

  const toggleFeatured = async (p: GalleryProject) => {
    await supabase.from("gallery_projects").update({ is_featured: !p.is_featured }).eq("id", p.id);
    qc.invalidateQueries({ queryKey: ["gallery-projects"] });
  };

  // ===== Drilldown =====
  if (activeFolder) {
    const isUnfiled = activeFolder === "unfiled";
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setActiveFolder(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Pastas
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {isUnfiled ? "Sem pasta" : (activeFolder as FolderHubItem).name}
            </p>
            <p className="text-[11px] text-muted-foreground">{visibleProjects.length} item(s)</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => window.open("/gallery", "_blank")}>
            <Eye className="w-3.5 h-3.5 mr-1" /> Ver site
          </Button>
        </div>

        <MediaQuickUpload
          folders={folderItems}
          folderId={isUnfiled ? null : (activeFolder as FolderHubItem).id}
          onFolderChange={setUploadFolderId}
          onCreateFolder={() => setFolderDialogOpen(true)}
          onUpload={handleUpload}
          onBatchComplete={handleBatchComplete}
          compact
          title="Adicionar a esta pasta"
        />

        {visibleProjects.length === 0 ? (
          <div className="py-12 text-center">
            <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Pasta vazia</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {visibleProjects.map((p) => (
              <Card key={p.id} className="overflow-hidden group relative">
                <div className="aspect-square bg-muted/40">
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <CardContent className="p-2">
                  <p className="text-xs font-semibold truncate">{p.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <button
                      onClick={() => toggleFeatured(p)}
                      className="text-[11px] text-muted-foreground hover:text-primary"
                      aria-label="Destacar"
                    >
                      <Star className={`w-3.5 h-3.5 ${p.is_featured ? "fill-primary text-primary" : ""}`} />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="text-[11px] text-muted-foreground hover:text-destructive"
                    >
                      Excluir
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <QuickFolderDialog
          open={folderDialogOpen}
          onOpenChange={setFolderDialogOpen}
          onSubmit={handleCreateFolder}
        />
      </div>
    );
  }

  // ===== Hub =====
  const unfiledCount = projects.filter((p) => !p.parent_folder_id).length;

  return (
    <div className="space-y-4">
      <MediaQuickUpload
        folders={folderItems}
        folderId={uploadFolderId}
        onFolderChange={setUploadFolderId}
        onCreateFolder={() => setFolderDialogOpen(true)}
        onUpload={handleUpload}
        onBatchComplete={handleBatchComplete}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Pastas</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => window.open("/gallery", "_blank")}>
            <Eye className="w-3.5 h-3.5 mr-1" /> Ver site
          </Button>
          <Button size="sm" variant="outline" onClick={() => setFolderDialogOpen(true)}>
            + Nova
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : (
        <FolderHubGrid
          folders={folderItems}
          unfiledCount={unfiledCount}
          onOpenUnfiled={() => setActiveFolder("unfiled")}
          onOpenFolder={(f) => setActiveFolder(f)}
        />
      )}

      <QuickFolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        onSubmit={handleCreateFolder}
      />
    </div>
  );
}
