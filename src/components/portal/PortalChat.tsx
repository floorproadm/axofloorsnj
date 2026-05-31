import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Send, MessageCircle, Paperclip, X } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { MessageAttachment } from "@/components/chat/MessageAttachment";
import { useChatAttachmentUpload } from "@/hooks/useChatAttachmentUpload";

interface PortalMsg {
  id: string;
  project_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  read: boolean;
  created_at: string;
  is_customer: boolean;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
}

interface Props {
  token: string;
  customerName: string;
}

const dayLabel = (d: Date) =>
  isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMM d");

export function PortalChat({ token, customerName }: Props) {
  const [messages, setMessages] = useState<PortalMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<{ url: string; type: string; name: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useChatAttachmentUpload("portal");

  const load = async () => {
    const { data, error } = await supabase.rpc("get_portal_messages" as any, { p_token: token });
    if (error) {
      setLoading(false);
      return;
    }
    const payload = data as any;
    if (payload?.ok) {
      setMessages((payload.messages as PortalMsg[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text && !pending) return;
    setSending(true);
    setInput("");
    const att = pending;
    setPending(null);
    const { data } = await supabase.rpc("send_portal_message" as any, {
      p_token: token,
      p_content: text,
      p_sender_name: customerName,
      p_attachment_url: att?.url ?? null,
      p_attachment_type: att?.type ?? null,
      p_attachment_name: att?.name ?? null,
    });
    setSending(false);
    if ((data as any)?.ok) {
      await load();
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const r = await upload(f);
    if (r) setPending(r);
  };

  const grouped: { day: string; items: PortalMsg[] }[] = [];
  for (const m of messages) {
    const d = dayLabel(new Date(m.created_at));
    const last = grouped[grouped.length - 1];
    if (last && last.day === d) last.items.push(m);
    else grouped.push({ day: d, items: [m] });
  }

  return (
    <div className="bg-white border rounded-lg flex flex-col h-[60vh] min-h-[400px] overflow-hidden">
      <div className="px-4 py-3 border-b bg-[#0f1b3d] text-white">
        <div className="text-sm font-semibold">Messages</div>
        <div className="text-[11px] text-white/70">Direct line to our team — we typically reply within the hour.</div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-slate-50">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <MessageCircle className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Send a note to start the conversation</p>
          </div>
        ) : (
          grouped.map((g) => (
            <div key={g.day} className="space-y-2">
              <div className="flex items-center gap-2 my-2">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] uppercase tracking-wider text-slate-400">{g.day}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              {g.items.map((m) => {
                const mine = m.is_customer;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[80%] ${mine ? "ml-auto items-end" : "mr-auto items-start"}`}
                  >
                    {!mine && (
                      <span className="text-[10px] text-slate-500 mb-0.5 px-1">{m.sender_name}</span>
                    )}
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm leading-snug space-y-2 ${
                        mine
                          ? "bg-[#0f1b3d] text-white rounded-br-md"
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
                      }`}
                    >
                      {m.attachment_url && (
                        <MessageAttachment url={m.attachment_url} type={m.attachment_type} name={m.attachment_name} />
                      )}
                      {m.content && <div className="whitespace-pre-wrap break-words">{m.content}</div>}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 px-1 tabular-nums">
                      {format(new Date(m.created_at), "HH:mm")}
                    </span>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t bg-white space-y-2">
        {pending && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-slate-100 text-xs">
            <Paperclip className="w-3.5 h-3.5 text-slate-500" />
            <span className="truncate flex-1">{pending.name}</span>
            <button onClick={() => setPending(null)} className="text-slate-500 hover:text-slate-800">
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
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || sending}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={sending}
          />
          <Button
            onClick={send}
            disabled={(!input.trim() && !pending) || sending || uploading}
            className="bg-[#0f1b3d] hover:bg-[#0f1b3d]/90"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
