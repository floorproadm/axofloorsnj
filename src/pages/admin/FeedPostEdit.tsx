import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { FeedPostForm } from "@/components/admin/feed/FeedPostForm";
import { useFeedPost, useUpdateFeedPost, useCreateFeedPost } from "@/hooks/admin/useFeedData";
import type { FeedPost } from "@/hooks/admin/useFeedData";
import { useState, useEffect } from "react";

export default function FeedPostEdit() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const isNew = postId === "new";
  const [createdId, setCreatedId] = useState<string | null>(null);
  const actualId = createdId || (isNew ? undefined : postId);

  const { data: post, isLoading } = useFeedPost(actualId);
  const updatePost = useUpdateFeedPost();
  const createPost = useCreateFeedPost();

  // For new posts, create a draft immediately so images can be uploaded
  useEffect(() => {
    if (isNew && !createdId) {
      createPost.mutate(
        { title: "Novo Post", status: "draft", visibility: "internal" },
        {
          onSuccess: (data) => setCreatedId(data.id),
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  const handleSave = (updates: Partial<FeedPost>) => {
    const id = actualId;
    if (!id) return;
    updatePost.mutate(
      { id, ...updates },
      { onSuccess: () => navigate(`/admin/feed/${id}`) }
    );
  };

  if ((!isNew && isLoading) || (isNew && !createdId)) {
    return (
      <AdminLayout title="Carregando..." breadcrumbs={[{ label: "Feed", href: "/admin/feed" }, { label: "Editar" }]}>
        <div className="py-16 text-center text-muted-foreground text-sm">Preparando...</div>
      </AdminLayout>
    );
  }

  const defaultPost: FeedPost = {
    id: createdId || "",
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
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => navigate(isNew ? "/admin/feed" : `/admin/feed/${postId}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <FeedPostForm
          post={isNew ? defaultPost : post || defaultPost}
          onSave={handleSave}
          isSaving={updatePost.isPending}
        />
      </div>
    </AdminLayout>
  );
}
