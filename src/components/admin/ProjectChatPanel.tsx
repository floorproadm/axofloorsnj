import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  project_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface ProjectChatPanelProps {
  projectId: string;
}

export function ProjectChatPanel({ projectId }: ProjectChatPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin-chat-messages", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as ChatMessage[];
    },
    enabled: !!projectId,
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`admin-chat-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-chat-messages", projectId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, queryClient]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!message.trim() || !user) return;
      const { error } = await supabase.from("chat_messages").insert({
        project_id: projectId,
        sender_id: user.id,
        sender_name: "Admin",
        content: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["admin-chat-messages", projectId] });
    },
  });

  return (
    <div className="flex flex-col h-[400px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mb-2 text-muted-foreground/30" />
            <p className="text-sm">Nenhuma mensagem</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Envie uma mensagem para a equipe de campo
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.sender_name === "Admin";
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[75%]",
                  isAdmin ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {!isAdmin && (
                  <span className="text-[10px] text-muted-foreground mb-0.5 px-1">
                    {msg.sender_name}
                  </span>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm",
                    isAdmin
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground/60 mt-0.5 px-1">
                  {format(new Date(msg.created_at), "MMM d, HH:mm")}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2 p-3 border-t border-border">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mensagem para a equipe..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage.mutate();
            }
          }}
        />
        <Button
          size="icon"
          onClick={() => sendMessage.mutate()}
          disabled={!message.trim() || sendMessage.isPending}
        >
          {sendMessage.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
