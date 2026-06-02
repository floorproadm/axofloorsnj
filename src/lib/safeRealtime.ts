import { supabase } from "@/integrations/supabase/client";

type RealtimeChannel = ReturnType<typeof supabase.channel>;

const isRealtimeProblem = (status: string) =>
  status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED";

export function subscribeSafely(channel: RealtimeChannel, label: string): RealtimeChannel | null {
  try {
    return channel.subscribe((status, error) => {
      if (isRealtimeProblem(status)) {
        console.warn(`[Realtime disabled:${label}] ${status}`, error ?? "");
      }
    });
  } catch (error) {
    console.warn(`[Realtime disabled:${label}]`, error);
    void supabase.removeChannel(channel).catch(() => undefined);
    return null;
  }
}

export function removeRealtimeChannel(channel: RealtimeChannel | null | undefined) {
  if (!channel) return;
  void supabase.removeChannel(channel).catch(() => undefined);
}