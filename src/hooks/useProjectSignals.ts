import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectSignals {
  // map: project_id -> signal flags
  missingProof: Set<string>;
  unreadChat: Map<string, number>;
  overdueInvoice: Set<string>;
}

/**
 * Lightweight signals layer: pulls aggregate data once and exposes
 * per-project flags used by pipeline cards (risk dot + NRA badges).
 */
export function useProjectSignals(projectIds: string[]) {
  const ids = [...new Set(projectIds)].filter(Boolean);
  const key = ids.slice().sort().join(",");

  return useQuery({
    queryKey: ["project-signals", key],
    enabled: ids.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<ProjectSignals> => {
      const [{ data: proofs }, { data: chats }, { data: invoices }] = await Promise.all([
        supabase.from("job_proof").select("project_id, before_image_url, after_image_url").in("project_id", ids),
        supabase.from("chat_messages").select("project_id, read").in("project_id", ids).eq("read", false),
        supabase.from("invoices").select("project_id, status, due_date").in("project_id", ids).neq("status", "paid"),
      ]);

      const proofComplete = new Set<string>();
      (proofs ?? []).forEach((p: any) => {
        if (p.before_image_url && p.after_image_url) proofComplete.add(p.project_id);
      });
      const missingProof = new Set<string>(ids.filter((id) => !proofComplete.has(id)));

      const unreadChat = new Map<string, number>();
      (chats ?? []).forEach((c: any) => {
        unreadChat.set(c.project_id, (unreadChat.get(c.project_id) ?? 0) + 1);
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdueInvoice = new Set<string>();
      (invoices ?? []).forEach((inv: any) => {
        if (inv.due_date && new Date(inv.due_date) < today) overdueInvoice.add(inv.project_id);
      });

      return { missingProof, unreadChat, overdueInvoice };
    },
  });
}

export interface RiskLevel {
  level: "healthy" | "watch" | "risk";
  reasons: string[];
}

export function computeRisk(opts: {
  marginPercent: number | null | undefined;
  hasMissingProof: boolean;
  hasOverdueInvoice: boolean;
  status: string;
}): RiskLevel {
  const reasons: string[] = [];
  let score = 0;

  if (opts.marginPercent != null) {
    if (opts.marginPercent < 15) {
      score += 2;
      reasons.push(`Low margin ${opts.marginPercent.toFixed(0)}%`);
    } else if (opts.marginPercent < 25) {
      score += 1;
      reasons.push(`Tight margin ${opts.marginPercent.toFixed(0)}%`);
    }
  }
  if (opts.hasOverdueInvoice) {
    score += 2;
    reasons.push("Invoice overdue");
  }
  if (opts.hasMissingProof && (opts.status === "completed" || opts.status === "awaiting_payment" || opts.status === "paid")) {
    score += 1;
    reasons.push("Missing proof photos");
  }

  const level: RiskLevel["level"] = score >= 2 ? "risk" : score === 1 ? "watch" : "healthy";
  return { level, reasons };
}
