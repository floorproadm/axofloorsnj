import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Pencil, Check, X, Calendar, ListChecks, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { removeRealtimeChannel, subscribeSafely } from "@/lib/safeRealtime";

interface ReferralMessage {
  id: string;
  author_role: "admin" | "partner";
  author_name: string;
  content: string;
  created_at: string;
}

interface Props {
  leadId: string;
  mode: "admin" | "partner";
  authorName: string;
  /** Required for admin mode (admin author_user_id is enforced by RLS) */
  organizationId?: string | null;
}

interface AdminFields {
  next_step: string | null;
  expected_close_date: string | null;
  internal_note_for_partner: string | null;
}

export function ReferralCollabPanel({ leadId, mode, authorName, organizationId }: Props) {
  const [fields, setFields] = useState<AdminFields>({
    next_step: null,
    expected_close_date: null,
    internal_note_for_partner: null,
  });
  const [editing, setEditing] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [draft, setDraft] = useState<AdminFields>(fields);

  const [messages, setMessages] = useState<ReferralMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: leadData }, { data: msgs }] = await Promise.all([
        supabase
          .from("leads")
          .select("next_step, expected_close_date, internal_note_for_partner, organization_id")
          .eq("id", leadId)
          .maybeSingle(),
        supabase
          .from("referral_messages" as any)
          .select("id, author_role, author_name, content, created_at")
          .eq("lead_id", leadId)
          .order("created_at", { ascending: true }),
      ]);
      if (cancelled) return;
      if (leadData) {
        const f = {
          next_step: (leadData as any).next_step ?? null,
          expected_close_date: (leadData as any).expected_close_date ?? null,
          internal_note_for_partner: (leadData as any).internal_note_for_partner ?? null,
        };
        setFields(f);
        setDraft(f);
      }
      if (msgs) setMessages(msgs as any);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`referral_messages_${leadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "referral_messages", filter: `lead_id=eq.${leadId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === (payload.new as any).id)) return prev;
            return [...prev, payload.new as any];
          });
        }
      );
    const subscription = subscribeSafely(channel, `referral_messages_${leadId}`);
    return () => {
      removeRealtimeChannel(subscription ?? channel);
    };
  }, [leadId]);

  // Autoscroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const saveFields = async () => {
    setSavingFields(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          next_step: draft.next_step?.trim() || null,
          expected_close_date: draft.expected_close_date || null,
          internal_note_for_partner: draft.internal_note_for_partner?.trim() || null,
        } as any)
        .eq("id", leadId);
      if (error) throw error;
      setFields(draft);
      setEditing(false);
      toast({ title: "Updated", description: "Partner will see the new info." });
    } catch (e: any) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally {
      setSavingFields(false);
    }
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content) return;
    if (content.length > 2000) {
      toast({ title: "Message too long", description: "Max 2000 characters.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) throw new Error("Not signed in");

      let orgId = organizationId ?? null;
      if (!orgId) {
        const { data: leadRow } = await supabase
          .from("leads")
          .select("organization_id")
          .eq("id", leadId)
          .maybeSingle();
        orgId = (leadRow as any)?.organization_id ?? null;
      }
      if (!orgId) throw new Error("Missing organization");

      const { error } = await supabase.from("referral_messages" as any).insert({
        lead_id: leadId,
        organization_id: orgId,
        author_role: mode,
        author_user_id: userId,
        author_name: authorName,
        content,
      } as any);
      if (error) throw error;
      setInput("");
    } catch (e: any) {
      toast({ title: "Could not send", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <div className="space-y-4">
      {/* Structured status panel */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
            Status from AXO
          </p>
          {mode === "admin" ? (
            editing ? (
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setDraft(fields); setEditing(false); }}>
                  <X className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" className="h-7 px-2 gap-1" onClick={saveFields} disabled={savingFields}>
                  {savingFields ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" className="h-7 px-2 gap-1" onClick={() => setEditing(true)}>
                <Pencil className="w-3 h-3" />
                Edit
              </Button>
            )
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Lock className="w-3 h-3" />
              Read only
            </span>
          )}
        </div>

        <div className="p-3 space-y-3">
          {/* Next step */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 flex items-center gap-1">
              <ListChecks className="w-3 h-3" />
              Next step
            </p>
            {editing ? (
              <Input
                value={draft.next_step ?? ""}
                onChange={(e) => setDraft({ ...draft, next_step: e.target.value })}
                placeholder="e.g. Scheduling site visit this week"
                maxLength={200}
                className="h-8 text-sm"
              />
            ) : (
              <p className="text-sm text-foreground">
                {fields.next_step || <span className="text-muted-foreground italic">Not set</span>}
              </p>
            )}
          </div>

          {/* Expected close */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Expected to close
            </p>
            {editing ? (
              <Input
                type="date"
                value={draft.expected_close_date ?? ""}
                onChange={(e) => setDraft({ ...draft, expected_close_date: e.target.value || null })}
                className="h-8 text-sm"
              />
            ) : (
              <p className="text-sm text-foreground tabular-nums">
                {formatDate(fields.expected_close_date) || <span className="text-muted-foreground italic">Not set</span>}
              </p>
            )}
          </div>

          {/* Note for partner */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Note for partner
            </p>
            {editing ? (
              <Textarea
                value={draft.internal_note_for_partner ?? ""}
                onChange={(e) => setDraft({ ...draft, internal_note_for_partner: e.target.value })}
                placeholder="Short note visible to the referring partner"
                maxLength={500}
                rows={2}
                className="text-sm resize-none"
              />
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {fields.internal_note_for_partner || (
                  <span className="text-muted-foreground italic">None</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="rounded-lg border border-border bg-card flex flex-col">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
            Conversation
          </p>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {messages.length} {messages.length === 1 ? "message" : "messages"}
          </span>
        </div>

        <div ref={scrollRef} className="max-h-72 overflow-y-auto p-3 space-y-2">
          {!loaded ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No messages yet. Start the conversation.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.author_role === mode;
              return (
                <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words",
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {m.content}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 px-1">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {m.author_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70">·</span>
                    <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-2 border-t border-border flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={mode === "admin" ? "Reply to partner…" : "Message AXO team…"}
            rows={2}
            maxLength={2000}
            className="text-sm resize-none flex-1 min-h-[40px]"
          />
          <Button
            size="sm"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="h-9 gap-1"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
