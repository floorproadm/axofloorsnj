import { useEffect, useMemo, useRef, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Loader2,
  Send,
  MessageCircle,
  ArrowLeft,
  Search,
  Users,
  UserCircle2,
  Paperclip,
  X,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { MessageAttachment } from "@/components/chat/MessageAttachment";
import { useChatAttachmentUpload } from "@/hooks/useChatAttachmentUpload";
import { useRef as useReactRef } from "react";
import { removeRealtimeChannel, subscribeSafely } from "@/lib/safeRealtime";

type Tab = "clients" | "team";

interface ClientConversation {
  project_id: string;
  customer_name: string;
  project_type: string | null;
  last_content: string;
  last_at: string;
  unread: number;
}

interface TeamMember {
  user_id: string;
  full_name: string;
  email: string | null;
  role: string | null;
}

interface ChatMessage {
  id: string;
  project_id?: string | null;
  sender_id: string;
  sender_name: string;
  content: string;
  read: boolean;
  created_at: string;
  receiver_id?: string | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
}

const initials = (name: string) =>
  (name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

function formatDayLabel(d: Date) {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

export default function AdminChat() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("clients");
  const [search, setSearch] = useState("");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useReactRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ url: string; type: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'client' | 'team'; id: string; name: string } | null>(null);
  const { upload, uploading } = useChatAttachmentUpload("admin");

  /* ---------------- Clients list ---------------- */
  const { data: clientConvos = [], isLoading: loadingClients } = useQuery({
    queryKey: ["admin-chat-client-convos"],
    queryFn: async () => {
      const { data: msgs, error } = await supabase
        .from("chat_messages")
        .select("project_id,content,created_at,read,sender_id")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;

      const byProj = new Map<string, { last: any; unread: number }>();
      for (const m of msgs || []) {
        if (!m.project_id) continue;
        const cur = byProj.get(m.project_id);
        if (!cur) byProj.set(m.project_id, { last: m, unread: 0 });
        if (!m.read && m.sender_id !== user?.id) {
          byProj.get(m.project_id)!.unread += 1;
        }
      }
      const projIds = Array.from(byProj.keys());
      if (projIds.length === 0) return [] as ClientConversation[];

      const { data: projs } = await supabase
        .from("projects")
        .select("id,customer_name,project_type")
        .in("id", projIds);

      return projIds.map<ClientConversation>((pid) => {
        const meta = byProj.get(pid)!;
        const proj = projs?.find((p) => p.id === pid);
        return {
          project_id: pid,
          customer_name: proj?.customer_name || "Unknown",
          project_type: proj?.project_type || null,
          last_content: meta.last.content,
          last_at: meta.last.created_at,
          unread: meta.unread,
        };
      }).sort((a, b) => +new Date(b.last_at) - +new Date(a.last_at));
    },
    enabled: !!user,
  });

  /* ---------------- Team list ---------------- */
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["admin-chat-team-members"],
    queryFn: async () => {
      const { data: orgRow } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      const orgId = orgRow?.organization_id;
      if (!orgId) return [] as TeamMember[];

      const { data: members } = await supabase
        .from("organization_members")
        .select("user_id,role")
        .eq("organization_id", orgId)
        .neq("user_id", user!.id);

      const ids = (members || []).map((m) => m.user_id);
      if (ids.length === 0) return [] as TeamMember[];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id,full_name,email,role")
        .in("user_id", ids);

      return (members || []).map<TeamMember>((m) => {
        const prof = profiles?.find((p) => p.user_id === m.user_id);
        return {
          user_id: m.user_id,
          full_name: prof?.full_name || prof?.email || "Team member",
          email: prof?.email || null,
          role: m.role || prof?.role || null,
        };
      });
    },
    enabled: !!user,
  });

  const { data: teamLastMsgs = {} } = useQuery({
    queryKey: ["admin-chat-team-last"],
    queryFn: async () => {
      const { data } = await supabase
        .from("direct_messages")
        .select("sender_id,receiver_id,content,created_at,read")
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order("created_at", { ascending: false })
        .limit(500);
      const map: Record<string, { last: any; unread: number }> = {};
      for (const m of data || []) {
        const other = m.sender_id === user!.id ? m.receiver_id : m.sender_id;
        if (!map[other]) map[other] = { last: m, unread: 0 };
        if (!m.read && m.receiver_id === user!.id) map[other].unread += 1;
      }
      return map;
    },
    enabled: !!user,
  });

  /* ---------------- Active conversation messages ---------------- */
  const activeKey = tab === "clients" ? activeProjectId : activeTeamId;

  const { data: messages = [], isLoading: loadingMsgs } = useQuery({
    queryKey: ["admin-chat-msgs", tab, activeKey],
    queryFn: async () => {
      if (!activeKey) return [] as ChatMessage[];
      if (tab === "clients") {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("project_id", activeProjectId!)
          .order("created_at", { ascending: true });
        if (error) throw error;
        return (data || []) as ChatMessage[];
      } else {
        const { data, error } = await supabase
          .from("direct_messages")
          .select("*")
          .or(
            `and(sender_id.eq.${user!.id},receiver_id.eq.${activeTeamId}),and(sender_id.eq.${activeTeamId},receiver_id.eq.${user!.id})`
          )
          .order("created_at", { ascending: true });
        if (error) throw error;
        return (data || []) as ChatMessage[];
      }
    },
    enabled: !!user && !!activeKey,
  });

  /* ---------------- Realtime ---------------- */
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("admin-chat-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-chat-client-convos"] });
        if (tab === "clients" && activeProjectId) {
          qc.invalidateQueries({ queryKey: ["admin-chat-msgs", "clients", activeProjectId] });
        }
        qc.invalidateQueries({ queryKey: ["admin-chat-unread-total"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-chat-team-last"] });
        if (tab === "team" && activeTeamId) {
          qc.invalidateQueries({ queryKey: ["admin-chat-msgs", "team", activeTeamId] });
        }
        qc.invalidateQueries({ queryKey: ["admin-chat-unread-total"] });
      });
    const subscription = subscribeSafely(ch, "admin-chat-realtime");
    return () => {
      removeRealtimeChannel(subscription ?? ch);
    };
  }, [user, qc, tab, activeProjectId, activeTeamId]);

  /* ---------------- Mark as read when opening ---------------- */
  useEffect(() => {
    if (!user || !activeKey) return;
    (async () => {
      if (tab === "clients" && activeProjectId) {
        await supabase
          .from("chat_messages")
          .update({ read: true })
          .eq("project_id", activeProjectId)
          .eq("read", false)
          .neq("sender_id", user.id);
      } else if (tab === "team" && activeTeamId) {
        await supabase
          .from("direct_messages")
          .update({ read: true })
          .eq("receiver_id", user.id)
          .eq("sender_id", activeTeamId)
          .eq("read", false);
      }
      qc.invalidateQueries({ queryKey: ["admin-chat-client-convos"] });
      qc.invalidateQueries({ queryKey: ["admin-chat-team-last"] });
      qc.invalidateQueries({ queryKey: ["admin-chat-unread-total"] });
    })();
  }, [activeKey, tab, user, activeProjectId, activeTeamId, qc]);

  /* ---------------- Scroll to bottom ---------------- */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);
  /* ---------------- Delete conversation ---------------- */
  const handleDelete = async () => {
    if (!deleteTarget || !user) return;
    if (deleteTarget.type === 'client') {
      await supabase.from('chat_messages').delete().eq('project_id', deleteTarget.id);
      if (activeProjectId === deleteTarget.id) setActiveProjectId(null);
    } else {
      await supabase.from('direct_messages').delete().or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${deleteTarget.id}),and(sender_id.eq.${deleteTarget.id},receiver_id.eq.${user.id})`
      );
      if (activeTeamId === deleteTarget.id) setActiveTeamId(null);
    }
    setDeleteTarget(null);
    qc.invalidateQueries({ queryKey: ['admin-chat-client-convos'] });
    qc.invalidateQueries({ queryKey: ['admin-chat-team-last'] });
  };

  /* ---------------- Send ---------------- */
  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !pending) || !user) return;
    setInput("");
    const att = pending;
    setPending(null);
    if (tab === "clients" && activeProjectId) {
      await supabase.from("chat_messages").insert({
        project_id: activeProjectId,
        sender_id: user.id,
        sender_name: "Admin",
        content: text,
        attachment_url: att?.url ?? null,
        attachment_type: att?.type ?? null,
        attachment_name: att?.name ?? null,
      } as any);
    } else if (tab === "team" && activeTeamId) {
      const recv = teamMembers.find((m) => m.user_id === activeTeamId);
      await supabase.from("direct_messages").insert({
        sender_id: user.id,
        sender_name: user.user_metadata?.full_name || user.email || "Admin",
        receiver_id: activeTeamId,
        receiver_name: recv?.full_name || "",
        organization_id: (
          await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", user.id)
            .maybeSingle()
        ).data?.organization_id,
        content: text,
        attachment_url: att?.url ?? null,
        attachment_type: att?.type ?? null,
        attachment_name: att?.name ?? null,
      } as any);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const result = await upload(f);
    if (result) setPending(result);
  };

  /* ---------------- Filtered lists ---------------- */
  const filteredClients = useMemo(
    () =>
      clientConvos.filter((c) =>
        c.customer_name.toLowerCase().includes(search.toLowerCase())
      ),
    [clientConvos, search]
  );

  const filteredTeam = useMemo(
    () =>
      teamMembers
        .filter((m) => m.full_name.toLowerCase().includes(search.toLowerCase()))
        .map((m) => ({ ...m, ...(teamLastMsgs as any)[m.user_id] })),
    [teamMembers, teamLastMsgs, search]
  );

  /* ---------------- Active header info ---------------- */
  const activeHeader = useMemo(() => {
    if (tab === "clients") {
      const c = clientConvos.find((x) => x.project_id === activeProjectId);
      return c ? { name: c.customer_name, sub: c.project_type || "Project" } : null;
    } else {
      const t = teamMembers.find((m) => m.user_id === activeTeamId);
      return t ? { name: t.full_name, sub: t.role || "Team" } : null;
    }
  }, [tab, activeProjectId, activeTeamId, clientConvos, teamMembers]);

  /* ---------------- Grouped messages by day ---------------- */
  const grouped = useMemo(() => {
    const out: { day: string; items: ChatMessage[] }[] = [];
    for (const m of messages) {
      const day = formatDayLabel(new Date(m.created_at));
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(m);
      else out.push({ day, items: [m] });
    }
    return out;
  }, [messages]);

  const showList = !activeKey;

  return (
    <AdminLayout title="Chat" breadcrumbs={[{ label: "Chat" }]}>
      <div className="h-[calc(100vh-7rem)] grid md:grid-cols-[340px_1fr] gap-0 border border-border rounded-lg overflow-hidden bg-card">
        {/* LEFT PANE */}
        <aside
          className={cn(
            "border-r border-border flex flex-col bg-card",
            !showList && "hidden md:flex"
          )}
        >
          <div className="p-3 border-b border-border space-y-2">
            <div className="grid grid-cols-2 gap-1 bg-muted/40 rounded-md p-1">
              <button
                onClick={() => {
                  setTab("clients");
                  setActiveTeamId(null);
                }}
                className={cn(
                  "text-xs font-medium py-1.5 rounded transition-colors",
                  tab === "clients"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <UserCircle2 className="w-3.5 h-3.5 inline mr-1" />
                Clients
              </button>
              <button
                onClick={() => {
                  setTab("team");
                  setActiveProjectId(null);
                }}
                className={cn(
                  "text-xs font-medium py-1.5 rounded transition-colors",
                  tab === "team"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="w-3.5 h-3.5 inline mr-1" />
                Team
              </button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-8 pl-7 text-sm"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {tab === "clients" ? (
              loadingClients ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : filteredClients.length === 0 ? (
                <EmptyList label="No client conversations yet" />
              ) : (
                filteredClients.map((c) => (
                  <button
                    key={c.project_id}
                    onClick={() => setActiveProjectId(c.project_id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors flex gap-2.5",
                      activeProjectId === c.project_id && "bg-muted/70"
                    )}
                  >
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {initials(c.customer_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{c.customer_name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                          {format(new Date(c.last_at), "HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground truncate">{c.last_content}</span>
                        {c.unread > 0 && (
                          <Badge className="h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground shrink-0">
                            {c.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )
            ) : filteredTeam.length === 0 ? (
              <EmptyList label="No team members" />
            ) : (
              filteredTeam.map((m: any) => (
                <button
                  key={m.user_id}
                  onClick={() => setActiveTeamId(m.user_id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors flex gap-2.5",
                    activeTeamId === m.user_id && "bg-muted/70"
                  )}
                >
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarFallback className="text-xs bg-amber-500/10 text-amber-600">
                      {initials(m.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{m.full_name}</span>
                      {m.last && (
                        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                          {format(new Date(m.last.created_at), "HH:mm")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground truncate">
                        {m.last?.content || (m.role ?? "Team member")}
                      </span>
                      {m.unread > 0 && (
                        <Badge className="h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground shrink-0">
                          {m.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </aside>

        {/* RIGHT PANE */}
        <section
          className={cn(
            "flex flex-col bg-background",
            showList && "hidden md:flex"
          )}
        >
          {!activeKey ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Select a conversation</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <header className="border-b border-border px-4 py-3 flex items-center gap-3 bg-card">
                <Button
                  size="icon"
                  variant="ghost"
                  className="md:hidden h-8 w-8"
                  onClick={() => {
                    setActiveProjectId(null);
                    setActiveTeamId(null);
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {initials(activeHeader?.name || "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{activeHeader?.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{activeHeader?.sub}</div>
                </div>
              </header>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                {loadingMsgs ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : grouped.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-10">
                    No messages yet — send the first one.
                  </div>
                ) : (
                  grouped.map((g) => (
                    <div key={g.day} className="space-y-2">
                      <div className="flex items-center gap-2 my-2">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {g.day}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      {g.items.map((m) => {
                        const mine = m.sender_id === user?.id;
                        return (
                          <div
                            key={m.id}
                            className={cn(
                              "flex flex-col max-w-[78%]",
                              mine ? "ml-auto items-end" : "mr-auto items-start"
                            )}
                          >
                            {!mine && (
                              <span className="text-[10px] text-muted-foreground mb-0.5 px-1">
                                {m.sender_name}
                              </span>
                            )}
                            <div
                              className={cn(
                                "rounded-2xl px-3 py-2 text-sm leading-snug whitespace-pre-wrap break-words space-y-2",
                                mine
                                  ? "bg-[#0f1b3d] text-white rounded-br-md"
                                  : "bg-muted text-foreground rounded-bl-md"
                              )}
                            >
                              {m.attachment_url && (
                                <MessageAttachment
                                  url={m.attachment_url}
                                  type={m.attachment_type}
                                  name={m.attachment_name}
                                />
                              )}
                              {m.content && <div>{m.content}</div>}
                            </div>
                            <span className="text-[10px] text-muted-foreground/60 mt-0.5 px-1 tabular-nums">
                              {format(new Date(m.created_at), "HH:mm")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border p-3 bg-card space-y-2">
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
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={handleFile}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
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
                        handleSend();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={(!input.trim() && !pending) || uploading}
                    className="bg-[#0f1b3d] hover:bg-[#0f1b3d]/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

function EmptyList({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
      <MessageCircle className="w-6 h-6 mb-2 opacity-30" />
      <p className="text-xs">{label}</p>
    </div>
  );
}
