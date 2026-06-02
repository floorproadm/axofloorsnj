import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { removeRealtimeChannel, subscribeSafely } from "@/lib/safeRealtime";

export function useChatUnreadCount() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-chat-unread-total"],
    queryFn: async () => {
      if (!user) return 0;
      const [{ count: c1 }, { count: c2 }] = await Promise.all([
        supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("read", false)
          .neq("sender_id", user.id),
        supabase
          .from("direct_messages")
          .select("*", { count: "exact", head: true })
          .eq("read", false)
          .eq("receiver_id", user.id),
      ]);
      return (c1 || 0) + (c2 || 0);
    },
    enabled: !!user,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("chat-unread-watch")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-chat-unread-total"] })
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-chat-unread-total"] })
      );
    const subscription = subscribeSafely(ch, "chat-unread-watch");
    return () => {
      removeRealtimeChannel(subscription ?? ch);
    };
  }, [user, qc]);

  return query.data || 0;
}
