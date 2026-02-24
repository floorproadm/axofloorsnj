import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Share2, Download, MapPin, MoreVertical, Edit, Trash2, Link, Check, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { FeedPost } from "@/hooks/admin/useFeedData";
import { useDeleteFeedPost } from "@/hooks/admin/useFeedData";
import { formatDistanceToNow } from "date-fns";

interface FeedPostCardProps {
  post: FeedPost;
  onClick?: () => void;
}

export function FeedPostCard({ post, onClick }: FeedPostCardProps) {
  const navigate = useNavigate();
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const images = post.images || [];
  const deleteMutation = useDeleteFeedPost();
  const [showStep1, setShowStep1] = useState(false);
  const [showStep2, setShowStep2] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSharing(true);
    try {
      let token = (post as any).share_token;
      if (!token) {
        token = crypto.randomUUID();
        const { error } = await supabase
          .from("feed_posts")
          .update({ share_token: token } as any)
          .eq("id", post.id);
        if (error) throw error;
      }
      const url = `${window.location.origin}/shared/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao gerar link");
    } finally {
      setSharing(false);
    }
  };

  const handleConfirmStep1 = () => {
    setShowStep1(false);
    setShowStep2(true);
  };

  const handleConfirmStep2 = () => {
    setShowStep2(false);
    deleteMutation.mutate(post.id);
  };

  return (
    <>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => navigate(`/admin/feed/${post.id}/edit`)}>
                  <Edit className="w-4 h-4 mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowStep1(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Images */}
          {images.length > 0 ? (
            <div className={`grid gap-1.5 rounded-lg overflow-hidden ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {images.slice(0, 4).map((img) => (
                <div key={img.id} className="aspect-[4/3] bg-muted rounded-md overflow-hidden relative">
                  {img.file_type === "video" ? (
                    <>
                      <video src={img.file_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="bg-black/60 rounded-full p-1.5">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <img src={img.file_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
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
                <MessageSquare className="w-3.5 h-3.5" /> {post.comments_count}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleShare} disabled={sharing}>
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5 text-muted-foreground" />}
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

      {/* Double confirmation dialogs */}
      <AlertDialog open={showStep1} onOpenChange={setShowStep1}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar post</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O post e todas as imagens/comentários associados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStep1} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showStep2} onOpenChange={setShowStep2}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação final</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStep2} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
