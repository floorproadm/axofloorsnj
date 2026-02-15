import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFeedComments, useAddFeedComment } from "@/hooks/admin/useFeedData";
import { format } from "date-fns";

interface FeedCommentSectionProps {
  postId: string;
}

export function FeedCommentSection({ postId }: FeedCommentSectionProps) {
  const { data: comments = [], isLoading } = useFeedComments(postId);
  const addComment = useAddFeedComment();
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    addComment.mutate({ postId, content: text.trim() }, {
      onSuccess: () => setText(""),
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <MessageCircle className="w-4 h-4" />
        Comentários ({comments.length})
      </h3>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum comentário ainda</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {c.author_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{c.author_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(c.created_at), "dd/MM/yy HH:mm")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment */}
      <div className="flex gap-2 items-end">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Adicionar comentário..."
          className="min-h-[60px] text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!text.trim() || addComment.isPending}
          className="flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
