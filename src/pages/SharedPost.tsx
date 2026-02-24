import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import SEOHead from "@/components/shared/SEOHead";

export default function SharedPost() {
  const { token } = useParams<{ token: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["shared-post", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_posts")
        .select("*, images:feed_post_images(id, file_url, file_type, display_order)")
        .eq("share_token", token!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <h1 className="text-2xl font-bold text-foreground">Post não encontrado</h1>
        <p className="text-muted-foreground">Este link pode ter expirado ou ser inválido.</p>
      </div>
    );
  }

  const images = (post.images || []).sort((a: any, b: any) => a.display_order - b.display_order);
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <>
      <SEOHead
        title={post.title || "Post compartilhado"}
        description={post.description || "Veja este post compartilhado"}
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{post.title || "Sem título"}</h1>
            {post.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {post.location}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {timeAgo} por {post.author_name}
            </p>
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div className="space-y-3">
              {images.map((img: any) => (
                <div key={img.id} className="rounded-lg overflow-hidden">
                  <img
                    src={img.file_url}
                    alt=""
                    className="w-full object-cover rounded-lg"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          {post.description && (
            <p className="text-foreground whitespace-pre-wrap">{post.description}</p>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 text-muted-foreground text-sm border-t border-border pt-4">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" /> {post.comments_count} comentários
            </span>
            {post.category && (
              <Badge variant="outline">{post.category}</Badge>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
