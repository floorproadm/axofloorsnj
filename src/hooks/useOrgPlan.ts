import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OrgPlan = "basic" | "pro";

/**
 * Normalizes the raw DB plan value into our two-tier model.
 * DB enum is ('starter', 'pro', 'enterprise'); we treat starter = basic,
 * and both pro + enterprise unlock branding (PRO features).
 */
export function normalizePlan(raw: string | null | undefined): OrgPlan {
  if (raw === "pro" || raw === "enterprise") return "pro";
  return "basic";
}

/**
 * Hook for authenticated users — resolves the current org and its plan.
 */
export function useOrgPlan() {
  const q = useQuery({
    queryKey: ["org-plan"],
    queryFn: async (): Promise<OrgPlan> => {
      const { data: orgIdRes } = await supabase.rpc("get_user_org_id");
      const orgId = orgIdRes as string | null;
      if (!orgId) return "basic";
      const { data } = await supabase.rpc("get_org_plan" as any, { p_org_id: orgId });
      return normalizePlan(data as string | null);
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    plan: (q.data ?? "basic") as OrgPlan,
    isPro: (q.data ?? "basic") === "pro",
    isLoading: q.isLoading,
  };
}

/**
 * One-shot fetch for public/token-based pages where the org is derived
 * from the token target (proposal, invoice, portal). Returns 'basic' on any error.
 */
export async function fetchOrgPlan(orgId: string | null | undefined): Promise<OrgPlan> {
  if (!orgId) return "basic";
  try {
    const { data, error } = await supabase.rpc("get_org_plan" as any, { p_org_id: orgId });
    if (error) return "basic";
    return normalizePlan(data as string | null);
  } catch {
    return "basic";
  }
}
