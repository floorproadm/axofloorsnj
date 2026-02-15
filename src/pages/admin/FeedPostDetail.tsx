import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Calendar, MapPin, Tag } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FeedImageCarousel } from "@/components/admin/feed/FeedImageCarousel";
import { FeedCommentSection } from "@/components/admin/feed/FeedCommentSection";
import { useFeedPost } from "@/hooks/admin/useFeedData";
import { format } from "date-fns";

export default function FeedPostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { data: post, isLoading } = useFeedPost(postId);

  if (isLoading) {
    return (
      <AdminLayout title="Carregando..." breadcrumbs={[{ label: "Feed", href: "/admin/feed" }, { label: "Post" }]}>
        <div className="py-16 text-center text-muted-foreground text-sm">Carregando post...</div>
      </AdminLayout>
    );
  }

  if (!post) {
    return (
      <AdminLayout title="Post não encontrado" breadcrumbs={[{ label: "Feed", href: "/admin/feed" }, { label: "Post" }]}>
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">Post não encontrado</p>
          <Button variant="outline" onClick={() => navigate("/admin/feed")} className="mt-4">
            Voltar ao Feed
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={post.title || "Post"}
      breadcrumbs={[{ label: "Feed", href: "/admin/feed" }, { label: post.title || "Post" }]}
    >
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        {/* Top actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/feed")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/feed/${postId}/edit`)}>
            <Edit className="w-4 h-4 mr-1" /> Editar
          </Button>
        </div>

        {/* Image Carousel */}
        <FeedImageCarousel images={post.images || []} />

        {/* Post details */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <h2 className="text-lg font-semibold">{post.title}</h2>
              {post.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {post.location}
                </p>
              )}
            </div>

            {post.description && (
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{post.description}</p>
            )}

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" /> {tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Tipo</span>
                <p className="font-medium capitalize">{post.post_type.replace("_", " ")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Categoria</span>
                <p className="font-medium">{post.category || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <Badge variant={post.status === "published" ? "default" : "secondary"} className="text-xs mt-0.5">
                  {post.status}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Visibilidade</span>
                <Badge variant={post.visibility === "public" ? "default" : "outline"} className="text-xs mt-0.5">
                  {post.visibility}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Autor</span>
                <p className="font-medium">{post.author_name}</p>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs">{format(new Date(post.created_at), "dd/MM/yyyy HH:mm")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardContent className="p-4">
            <FeedCommentSection postId={post.id} />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
