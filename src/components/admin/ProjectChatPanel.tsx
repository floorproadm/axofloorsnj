import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, MessageCircle, Paperclip, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { MessageAttachment } from "@/components/chat/MessageAttachment";
import { useChatAttachmentUpload } from "@/hooks/useChatAttachmentUpload";

interface ChatMessage {
  id: string;
  project_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  read: boolean;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
}

interface ProjectChatPanelProps {
  projectId: string;
}

export function ProjectChatPanel({ projectId }: ProjectChatPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<{ url: string; type: string; name: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useChatAttachmentUpload("admin");

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

  useEffect(() => {
    const channel = supabase
      .channel(`admin-chat-${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `project_id=eq.${projectId}` },
        () => queryClient.invalidateQueries({ queryKey: ["admin-chat-messages", projectId] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, queryClient]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if ((!message.trim() && !pending) || !user) return;
      const att = pending;
      const { error } = await supabase.from("chat_messages").insert({
        project_id: projectId,
        sender_id: user.id,
        sender_name: "Admin",
        content: message.trim(),
        attachment_url: att?.url ?? null,
        attachment_type: att?.type ?? null,
        attachment_name: att?.name ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      setPending(null);
      queryClient.invalidateQueries({ queryKey: ["admin-chat-messages", projectId] });
    },
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const r = await upload(f);
    if (r) setPending(r);
  };

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
            <p className="text-xs text-muted-foreground/60 mt-1">Envie uma mensagem para a equipe de campo</p>
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
                  <span className="text-[10px] text-muted-foreground mb-0.5 px-1">{msg.sender_name}</span>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm space-y-2",
                    isAdmin
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  {msg.attachment_url && (
                    <MessageAttachment url={msg.attachment_url} type={msg.attachment_type} name={msg.attachment_name} />
                  )}
                  {msg.content && <div className="whitespace-pre-wrap break-words">{msg.content}</div>}
                </div>
                <span className="text-[10px] text-muted-foreground/60 mt-0.5 px-1">
                  {format(new Date(msg.created_at), "MMM d, HH:mm")}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border p-3 space-y-2">
        {pending && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/60 text-xs">
            <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="truncate flex-1">{pending.name}</span>
            <button onClick={() => setPending(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={handleFile}
          />
          <Button type="button" size="icon" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </Button>
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
            disabled={(!message.trim() && !pending) || sendMessage.isPending || uploading}
          >
            {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
