import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCollaboratorProjects } from "@/hooks/useCollaboratorProjects";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageCircle, Paperclip, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { MessageAttachment } from "@/components/chat/MessageAttachment";
import { useChatAttachmentUpload } from "@/hooks/useChatAttachmentUpload";
import { removeRealtimeChannel, subscribeSafely } from "@/lib/safeRealtime";
import { toast } from "sonner";
import { projectDisplayName } from "@/utils/projectDisplayName";

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

export default function CollaboratorChat() {
  const { user } = useAuth();
  const { data: projects = [], isLoading: loadingProjects } = useCollaboratorProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<{ url: string; type: string; name: string } | null>(null);
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useChatAttachmentUpload("field");

  // Auto-select first project
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].project_id);
    }
  }, [projects, selectedProjectId]);

  // Fetch messages
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["chat-messages", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("project_id", selectedProjectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as ChatMessage[];
    },
    enabled: !!selectedProjectId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!selectedProjectId) return;
    const channel = supabase
      .channel(`chat-${selectedProjectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `project_id=eq.${selectedProjectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat-messages", selectedProjectId] });
        }
      );
    const subscription = subscribeSafely(channel, `collaborator-chat-${selectedProjectId}`);

    return () => { removeRealtimeChannel(subscription ?? channel); };
  }, [selectedProjectId, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message (with optimistic update)
  const sendMessage = useMutation({
    mutationFn: async () => {
      const trimmed = message.trim();
      if ((!trimmed && !pending) || !selectedProjectId || !user) {
        throw new Error("Nada para enviar");
      }
      const att = pending;
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          project_id: selectedProjectId,
          sender_id: user.id,
          sender_name: user.user_metadata?.full_name || user.email || "Colaborador",
          content: trimmed,
          attachment_url: att?.url ?? null,
          attachment_type: att?.type ?? null,
          attachment_name: att?.name ?? null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as ChatMessage;
    },
    onMutate: async () => {
      const trimmed = message.trim();
      if ((!trimmed && !pending) || !selectedProjectId || !user) return;
      const att = pending;
      const key = ["chat-messages", selectedProjectId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ChatMessage[]>(key) || [];
      const optimistic: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        project_id: selectedProjectId,
        sender_id: user.id,
        sender_name: user.user_metadata?.full_name || user.email || "Colaborador",
        content: trimmed,
        read: false,
        created_at: new Date().toISOString(),
        attachment_url: att?.url ?? null,
        attachment_type: att?.type ?? null,
        attachment_name: att?.name ?? null,
      };
      queryClient.setQueryData<ChatMessage[]>(key, [...previous, optimistic]);
      setMessage("");
      setPending(null);
      return { previous, key };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.previous && ctx?.key) {
        queryClient.setQueryData(ctx.key, ctx.previous);
      }
      toast.error(err?.message || "Falha ao enviar mensagem");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", selectedProjectId] });
    },
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const r = await upload(f);
    if (r) setPending(r);
  };

  if (loadingProjects) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <MessageCircle className="h-10 w-10 mb-2 text-muted-foreground/50" />
        <p className="text-sm">Nenhum projeto atribuído</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Project Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
        {projects.map((p) => (
          <button
            key={p.project_id}
            onClick={() => setSelectedProjectId(p.project_id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors shrink-0",
              selectedProjectId === p.project_id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-accent"
            )}
          >
            {projectDisplayName(p.customer_name, p.address)}
          </button>
        ))}
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2 px-1 pb-2"
      >
        {loadingMessages ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mb-2 text-muted-foreground/30" />
            <p className="text-xs">Nenhuma mensagem ainda</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Envie uma mensagem para o admin
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[80%]",
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {!isMe && (
                  <span className="text-[10px] text-muted-foreground mb-0.5 px-1">
                    {msg.sender_name}
                  </span>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm space-y-2",
                    isMe
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
                  {format(new Date(msg.created_at), "HH:mm")}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="pt-2 border-t border-border space-y-2">
        {pending && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/60 text-xs">
            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate flex-1">{pending.name}</span>
            <button onClick={() => setPending(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
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
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva uma mensagem..."
            className="flex-1"
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
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
