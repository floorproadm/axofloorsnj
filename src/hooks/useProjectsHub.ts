import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";

export interface HubProjectMember {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

export interface HubProject {
  id: string;
  customer_name: string;
  project_type: string;
  project_status: string;
  address: string | null;
  city: string | null;
  square_footage: number | null;
  start_date: string | null;
  created_at: string;
  notes: string | null;
  next_action: string | null;
  next_action_date: string | null;
  referred_by_partner_id: string | null;
  partner_name: string | null;
  members: HubProjectMember[];
  job_costs: {
    estimated_revenue: number;
    total_cost: number | null;
    margin_percent: number | null;
  } | null;
}

export interface HubProposal {
  id: string;
  proposal_number: string;
  status: string;
  good_price: number;
  better_price: number;
  best_price: number;
  selected_tier: string | null;
  created_at: string;
  project_id: string;
  projects: {
    customer_name: string;
    project_type: string;
    address: string | null;
  } | null;
}

export interface HubMeasurement {
  id: string;
  project_id: string;
  status: string;
  total_sqft: number;
  measurement_date: string | null;
  created_at: string;
  projects: {
    customer_name: string;
    address: string | null;
  } | null;
}

export interface HubMaterialCost {
  id: string;
  project_id: string;
  description: string;
  supplier: string | null;
  amount: number;
  purchase_date: string;
  is_paid: boolean;
}

export interface HubLaborEntry {
  id: string;
  project_id: string;
  worker_name: string;
  role: string | null;
  daily_rate: number;
  days_worked: number;
  total_cost: number;
  work_date: string;
  is_paid: boolean;
}

export interface HubWeeklyReview {
  id: string;
  week_start: string;
  week_end: string;
  total_revenue: number;
  total_profit: number;
  avg_margin: number;
  jobs_completed: number;
  status: string;
}

export function useProjectsHub() {
  // Projects pipeline
  const projects = useQuery({
    queryKey: ["hub-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, customer_name, project_type, project_status, address, city, square_footage, start_date, created_at, notes, next_action, next_action_date, referred_by_partner_id, job_costs(estimated_revenue, total_cost, margin_percent), partners:referred_by_partner_id(contact_name, company_name), project_members(user_id, role)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles separately (no FK from project_members.user_id to profiles)
      const userIds = Array.from(
        new Set((data ?? []).flatMap((p: any) => (p.project_members ?? []).map((m: any) => m.user_id)).filter(Boolean))
      );
      let profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        profileMap = new Map((profs ?? []).map((pr: any) => [pr.user_id, { full_name: pr.full_name, avatar_url: pr.avatar_url }]));
      }

      return (data ?? []).map((p: any) => ({
        ...p,
        job_costs: Array.isArray(p.job_costs) ? p.job_costs[0] ?? null : p.job_costs,
        partner_name: p.partners?.contact_name || p.partners?.company_name || null,
        members: (p.project_members ?? []).map((m: any) => ({
          user_id: m.user_id,
          role: m.role,
          full_name: profileMap.get(m.user_id)?.full_name ?? null,
          avatar_url: profileMap.get(m.user_id)?.avatar_url ?? null,
        })),
      })) as HubProject[];
    },
    staleTime: 60_000,
  });

  // Accepted proposals not yet converted
  const pendingProposals = useQuery({
    queryKey: ["hub-pending-proposals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("id, proposal_number, status, good_price, better_price, best_price, selected_tier, created_at, project_id, projects(customer_name, project_type, address)")
        .eq("status", "accepted")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as HubProposal[];
    },
    staleTime: 60_000,
  });

  // Recent measurements
  const measurements = useQuery({
    queryKey: ["hub-measurements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_measurements")
        .select("id, project_id, status, total_sqft, measurement_date, created_at, projects(customer_name, address)")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as HubMeasurement[];
    },
    staleTime: 60_000,
  });

  // Recent material costs
  const materialCosts = useQuery({
    queryKey: ["hub-material-costs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_costs")
        .select("id, project_id, description, supplier, amount, purchase_date, is_paid")
        .order("purchase_date", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as HubMaterialCost[];
    },
    staleTime: 60_000,
  });

  // Recent labor entries
  const laborEntries = useQuery({
    queryKey: ["hub-labor-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labor_entries")
        .select("id, project_id, worker_name, role, daily_rate, days_worked, total_cost, work_date, is_paid")
        .order("work_date", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as HubLaborEntry[];
    },
    staleTime: 60_000,
  });

  // Latest weekly review
  const weeklyReview = useQuery({
    queryKey: ["hub-weekly-review"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_reviews")
        .select("id, week_start, week_end, total_revenue, total_profit, avg_margin, jobs_completed, status")
        .eq("organization_id", AXO_ORG_ID)
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as HubWeeklyReview | null;
    },
    staleTime: 60_000,
  });

  const isLoading = projects.isLoading || pendingProposals.isLoading;

  // Pipeline counts
  const pipeline = {
    pending: (projects.data ?? []).filter(p => p.project_status === "pending").length,
    in_progress: (projects.data ?? []).filter(p => p.project_status === "in_production" || p.project_status === "in_progress").length,
    completed: (projects.data ?? []).filter(p => p.project_status === "completed").length,
  };

  return {
    projects: projects.data ?? [],
    pendingProposals: pendingProposals.data ?? [],
    measurements: measurements.data ?? [],
    materialCosts: materialCosts.data ?? [],
    laborEntries: laborEntries.data ?? [],
    weeklyReview: weeklyReview.data ?? null,
    pipeline,
    isLoading,
  };
}
