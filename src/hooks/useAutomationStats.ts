import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAutomationStats() {
  return useQuery({
    queryKey: ["automation_stats"],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Emails sent this week per sequence
      const { data: sentThisWeek } = await supabase
        .from("automation_drip_logs")
        .select("enrollment_id, sent_at, automation_enrollments!inner(sequence_id)")
        .eq("status", "sent")
        .gte("sent_at", weekAgo);

      // Last sent per sequence
      const { data: allSent } = await supabase
        .from("automation_drip_logs")
        .select("sent_at, automation_enrollments!inner(sequence_id)")
        .eq("status", "sent")
        .order("sent_at", { ascending: false })
        .limit(200);

      const weeklyBySeq: Record<string, number> = {};
      const lastSentBySeq: Record<string, string> = {};

      (sentThisWeek || []).forEach((r: any) => {
        const sid = r.automation_enrollments?.sequence_id;
        if (sid) weeklyBySeq[sid] = (weeklyBySeq[sid] || 0) + 1;
      });

      (allSent || []).forEach((r: any) => {
        const sid = r.automation_enrollments?.sequence_id;
        if (sid && !lastSentBySeq[sid]) lastSentBySeq[sid] = r.sent_at;
      });

      // Total stats
      const totalSentWeek = Object.values(weeklyBySeq).reduce((s, v) => s + v, 0);

      return { weeklyBySeq, lastSentBySeq, totalSentWeek };
    },
    refetchInterval: 30000,
  });
}
