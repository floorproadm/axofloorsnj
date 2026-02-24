import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { FeedPostForm } from "@/components/admin/feed/FeedPostForm";
import { useFeedPost, useUpdateFeedPost, useCreateFeedPost, useUploadFeedImage } from "@/hooks/admin/useFeedData";
import type { FeedPost } from "@/hooks/admin/useFeedData";
import { useState } from "react";

export default function FeedPostEdit() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const isNew = postId === "new";
  const [isSaving, setIsSaving] = useState(false);

  const { data: post, isLoading } = useFeedPost(isNew ? undefined : postId);
  const updatePost = useUpdateFeedPost();
  const createPost = useCreateFeedPost();
  const uploadImage = useUploadFeedImage();

  const handleSave = async (updates: Partial<FeedPost>, pendingFiles?: File[]) => {
    if (isNew) {
      setIsSaving(true);
      try {
        const created = await createPost.mutateAsync({
          title: updates.title || "Novo Post",
          description: updates.description || undefined,
          post_type: updates.post_type || "photo",
          location: updates.location || undefined,
          category: updates.category || undefined,
          tags: updates.tags || [],
          visibility: updates.visibility || "internal",
          status: updates.status || "draft",
          folder_id: updates.folder_id || null,
        });

        // Upload pending images sequentially
        if (pendingFiles && pendingFiles.length > 0) {
          for (let i = 0; i < pendingFiles.length; i++) {
            await uploadImage.mutateAsync({
              postId: created.id,
              file: pendingFiles[i],
              order: i,
            });
          }
        }

        navigate(`/admin/feed/${created.id}`);
      } catch {
        // toast already handled by mutation hooks
      } finally {
        setIsSaving(false);
      }
    } else {
      const id = postId!;
      updatePost.mutate(
        { id, ...updates },
        { onSuccess: () => navigate(`/admin/feed/${id}`) }
      );
    }
  };

  if (!isNew && isLoading) {
    return (
      <AdminLayout title="Carregando..." breadcrumbs={[{ label: "Feed", href: "/admin/feed" }, { label: "Editar" }]}>
        <div className="py-16 text-center text-muted-foreground text-sm">Preparando...</div>
      </AdminLayout>
    );
  }

  const defaultPost: FeedPost = {
    id: "",
    project_id: null,
    post_type: "photo",
    title: "",
    description: null,
    location: null,
    category: null,
    tags: [],
    visibility: "internal",
    status: "draft",
    folder_id: null,
    author_name: "Admin",
    author_id: null,
    likes_count: 0,
    comments_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
  };

  return (
    <AdminLayout
      title={isNew ? "Novo Post" : "Editar Post"}
      breadcrumbs={[
        { label: "Feed", href: "/admin/feed" },
        { label: isNew ? "Novo" : "Editar" },
      ]}
    >
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in pb-24">
        <Button variant="ghost" size="sm" onClick={() => navigate(isNew ? "/admin/feed" : `/admin/feed/${postId}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <FeedPostForm
          post={isNew ? defaultPost : post || defaultPost}
          onSave={handleSave}
          isSaving={isNew ? isSaving : updatePost.isPending}
          isNew={isNew}
        />
      </div>
    </AdminLayout>
  );
}
