import { Heart, MessageSquare, Share2, Download, MapPin, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FeedPost } from "@/hooks/admin/useFeedData";
import { formatDistanceToNow } from "date-fns";

interface FeedPostCardProps {
  post: FeedPost;
  onClick?: () => void;
}

export function FeedPostCard({ post, onClick }: FeedPostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const images = post.images || [];

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-border/60"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{post.title || "Sem título"}</h3>
            {post.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{post.location}</span>
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Images */}
        {images.length > 0 ? (
          <div className={`grid gap-1.5 rounded-lg overflow-hidden ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {images.slice(0, 4).map((img) => (
              <div key={img.id} className="aspect-[4/3] bg-muted rounded-md overflow-hidden">
                <img src={img.file_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        ) : (
          <div className="aspect-[4/3] bg-muted/50 rounded-lg flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Sem imagens</p>
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] font-medium px-2 py-0.5">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1 text-xs">
              <Heart className="w-3.5 h-3.5" /> {post.likes_count}
            </span>
            <span className="flex items-center gap-1 text-xs">
              <MessageSquare className="w-3.5 h-3.5" /> {post.comments_count}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
              <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{timeAgo} by {post.author_name}</span>
          {post.category && (
            <span className="text-primary font-medium">{post.category}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
