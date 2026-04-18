import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AXO_ORG_ID } from "@/lib/constants";
import { MediaQuickUpload } from "@/components/admin/gallery/MediaQuickUpload";
import { FolderHubGrid, type FolderHubItem } from "@/components/admin/gallery/FolderHubGrid";
import { QuickFolderDialog } from "@/components/admin/gallery/QuickFolderDialog";
import {
  useFeedFolders,
  useFeedPosts,
  useCreateFeedFolder,
} from "@/hooks/admin/useFeedData";
import { FeedPostCard } from "@/components/admin/feed/FeedPostCard";

/**
 * Practical Feed view: folder-first hub + universal upload.
 * - Folders shown as visual cards (cover + count) — primary entry point.
 * - Drilldown shows posts inside a folder.
 * - Upload area on top: HEIC + .mov auto-converted; creates a draft post per upload session.
 */
export function GalleryFeedPanel() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [activeFolder, setActiveFolder] = useState<FolderHubItem | "unfiled" | null>(null);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);

  const { data: folders = [], isLoading: foldersLoading } = useFeedFolders();
  const createFolder = useCreateFeedFolder();

  const folderItems: FolderHubItem[] = useMemo(
    () =>
      folders.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        cover_image_url: f.cover_image_url,
        item_count: f.item_count,
      })),
    [folders],
  );

  // Posts inside the active folder (or unfiled / all)
  const filterFolderId =
    activeFolder === "unfiled" ? "_null" : activeFolder ? activeFolder.id : undefined;

  const { data: feedData } = useFeedPosts(
    undefined,
    0,
    50,
    filterFolderId === "_null"
      ? undefined
      : filterFolderId
        ? { folder_id: filterFolderId }
        : undefined,
  );
  const allPosts = feedData?.posts ?? [];
  const posts =
    activeFolder === "unfiled"
      ? allPosts.filter((p) => !p.folder_id)
      : allPosts;

  // Hoisted to top to keep hook order stable across early returns
  const unfiledCount = useMemo(() => allPosts.filter((p) => !p.folder_id).length, [allPosts]);

  /** Create a draft post + upload media into it under the current folder selection */
  const handleUpload = async (file: File, kind: "image" | "video", onProgress: (p: number) => void) => {
    // Use the folder selected in upload picker, OR active folder if drilled in
    const targetFolderId =
      uploadFolderId ?? (activeFolder && activeFolder !== "unfiled" ? activeFolder.id : null);

    // 1. Create a draft post (one per file = simple model)
    onProgress(0.1);
    const { data: post, error: postErr } = await supabase
      .from("feed_posts")
      .insert({
        title: file.name.replace(/\.[^.]+$/, ""),
        post_type: kind === "video" ? "video" : "photo",
        visibility: "internal",
        status: "draft",
        folder_id: targetFolderId,
        organization_id: AXO_ORG_ID,
      })
      .select()
      .single();
    if (postErr) throw postErr;

    // 2. Upload to feed-media bucket
    const ext = file.name.split(".").pop();
    const path = `${post.id}/${Date.now()}.${ext}`;
    onProgress(0.4);
    const { error: upErr } = await supabase.storage.from("feed-media").upload(path, file);
    if (upErr) throw upErr;
    const { data: urlData } = supabase.storage.from("feed-media").getPublicUrl(path);

    // 3. Link image record
    onProgress(0.85);
    await supabase.from("feed_post_images").insert({
      feed_post_id: post.id,
      file_url: urlData.publicUrl,
      file_type: kind,
      display_order: 0,
    });

    onProgress(1);
  };

  const handleBatchComplete = () => {
    qc.invalidateQueries({ queryKey: ["feed-posts"] });
    qc.invalidateQueries({ queryKey: ["feed-folders"] });
  };

  const handleCreateFolder = async (data: { name: string; description?: string }) => {
    await createFolder.mutateAsync(data);
  };

  // ===== Drilldown view =====
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
            <p className="text-[11px] text-muted-foreground">{posts.length} item(s)</p>
          </div>
        </div>

        <MediaQuickUpload
          folders={folderItems}
          folderId={isUnfiled ? null : (activeFolder as FolderHubItem).id}
          onFolderChange={(fid) => {
            // Allow moving target on the fly; if user picks another folder we leave drilldown alone
            setUploadFolderId(fid);
          }}
          onCreateFolder={() => setFolderDialogOpen(true)}
          onUpload={handleUpload}
          onBatchComplete={handleBatchComplete}
          compact
          title="Adicionar a esta pasta"
        />

        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Pasta vazia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <FeedPostCard key={p.id} post={p} onClick={() => navigate(`/admin/feed/${p.id}`)} />
            ))}
          </div>
        )}

        <QuickFolderDialog
          open={folderDialogOpen}
          onOpenChange={setFolderDialogOpen}
          onSubmit={handleCreateFolder}
          isSaving={createFolder.isPending}
        />
      </div>
    );
  }

  // ===== Folder hub (default) =====
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
        <Button size="sm" variant="outline" onClick={() => setFolderDialogOpen(true)}>
          + Nova
        </Button>
      </div>

      {foldersLoading ? (
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
        isSaving={createFolder.isPending}
      />
    </div>
  );
}
