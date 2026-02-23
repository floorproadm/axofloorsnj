import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ---------- Types from RPC ----------

interface PipelineMetric {
  status: string;
  total: number;
  last_30d: number;
  avg_days_in_pipeline: number;
}

interface FinancialMetric {
  active_jobs: number;
  completed_jobs: number;
  pipeline_value: number;
  total_profit: number;
  total_revenue: number;
  avg_margin_30d: number | null;
  conversion_rate_30d: number | null;
  avg_cycle_days: number | null;
}

interface AgingLead {
  lead_id: string;
  name: string;
  status: string;
  days_in_pipeline: number;
  action_overdue: boolean;
}

interface AlertLead {
  id: string;
  name: string;
}

interface DashboardRPCResponse {
  pipeline: PipelineMetric[];
  financial: FinancialMetric;
  aging_top10: AgingLead[];
  money: {
    activeLeadsCount: number;
    estimatedValueOpen: number;
  };
  alerts: {
    proposalWithoutFollowUp: AlertLead[];
    newLeadsNoContact24h: AlertLead[];
    leadsStalled48h: AlertLead[];
  };
}

// ---------- Public interfaces (unchanged from before) ----------

interface CriticalAlerts {
  proposalWithoutFollowUp: AlertLead[];
  jobsBlockedByProof: never[]; // kept for compat, not used by Dashboard
  leadsStalled48h: AlertLead[];
  newLeadsNoContact24h: AlertLead[];
  pipelineBottleneck: { stage: string; count: number } | null;
  hasNoCriticalIssues: boolean;
}

interface MoneyMetrics {
  activeLeadsCount: number;
  estimatedValueOpen: number;
  blockedLeadsCount: number;
  blockedLeadsValue: number;
  avgVelocityDays: number;
}

interface FunnelMetrics {
  cold_lead: number;
  warm_lead: number;
  estimate_requested: number;
  estimate_scheduled: number;
  in_draft: number;
  proposal_sent: number;
  proposal_rejected: number;
  in_production: number;
  completed: number;
  lost: number;
  lostRate30d: number;
}

/**
 * Hook for Executive Dashboard - READ ONLY
 * Single RPC call replaces 5 parallel queries.
 * Public interface is identical to the previous version.
 */
export function useDashboardData() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async (): Promise<DashboardRPCResponse> => {
      const { data, error } = await supabase.rpc('get_dashboard_metrics');
      if (error) {
        console.error('Dashboard metrics RPC error:', error);
        throw error;
      }
      return data as unknown as DashboardRPCResponse;
    },
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });

  const pipeline = data?.pipeline ?? [];
  const financial = data?.financial;
  const alerts = data?.alerts;
  const money = data?.money;

  // Build funnelMetrics from pipeline array
  const funnelMetrics: FunnelMetrics = {
    cold_lead: 0,
    warm_lead: 0,
    estimate_requested: 0,
    estimate_scheduled: 0,
    in_draft: 0,
    proposal_sent: 0,
    proposal_rejected: 0,
    in_production: 0,
    completed: 0,
    lost: 0,
    lostRate30d: 0,
  };

  pipeline.forEach((s) => {
    if (s.status in funnelMetrics) {
      (funnelMetrics as unknown as Record<string, number>)[s.status] = s.total;
    }
  });

  // Build moneyMetrics
  const moneyMetrics: MoneyMetrics = {
    activeLeadsCount: money?.activeLeadsCount ?? 0,
    estimatedValueOpen: money?.estimatedValueOpen ?? 0,
    blockedLeadsCount: alerts?.proposalWithoutFollowUp?.length ?? 0,
    blockedLeadsValue: 0,
    avgVelocityDays: 0,
  };

  // Build criticalAlerts with same shape
  const proposalWithoutFollowUp = alerts?.proposalWithoutFollowUp ?? [];
  const newLeadsNoContact24h = alerts?.newLeadsNoContact24h ?? [];
  const leadsStalled48h = alerts?.leadsStalled48h ?? [];

  // Bottleneck detection from pipeline
  let pipelineBottleneck: { stage: string; count: number } | null = null;
  if (pipeline.length > 0) {
    const maxStage = pipeline.reduce((a, b) => (a.total > b.total ? a : b));
    const avgCount = pipeline.reduce((sum, s) => sum + s.total, 0) / pipeline.length;
    if (maxStage.total > avgCount * 2 && maxStage.total >= 5) {
      pipelineBottleneck = { stage: maxStage.status, count: maxStage.total };
    }
  }

  const criticalAlerts: CriticalAlerts = {
    proposalWithoutFollowUp,
    jobsBlockedByProof: [],
    leadsStalled48h,
    newLeadsNoContact24h,
    pipelineBottleneck,
    hasNoCriticalIssues:
      proposalWithoutFollowUp.length === 0 &&
      newLeadsNoContact24h.length === 0 &&
      leadsStalled48h.length === 0 &&
      !pipelineBottleneck,
  };

  return {
    leads: [],
    projects: [],
    jobCosts: [],
    jobProofs: [],
    companySettings: null,
    lastUpdated: new Date(),
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Erro ao carregar dados') : null,
    criticalAlerts,
    moneyMetrics,
    funnelMetrics,
    marginHealth: {
      avgMargin30d: financial?.avg_margin_30d ?? null,
      jobsBelowMinMargin: 0,
      estimatedProfitOpen: 0,
      hasData: (financial?.completed_jobs ?? 0) > 0,
    },
    executionMetrics: {
      jobsInProduction: financial?.active_jobs ?? 0,
      jobsReadyToComplete: 0,
      jobsBlockedByProof: 0,
    },
    intakeMetrics: {
      topSourcesByVolume: [],
      topSourceByConversion: null,
      manualLeads30d: 0,
    },
    performanceMetrics: {
      totalRevenue: financial?.total_revenue ?? 0,
      totalProfit: financial?.total_profit ?? 0,
      avgMargin: financial?.avg_margin_30d ?? 0,
      completedCount: financial?.completed_jobs ?? 0,
      inProductionCount: financial?.active_jobs ?? 0,
      totalLeads: pipeline.reduce((sum, s) => sum + s.total, 0),
      recentLeadsCount: pipeline.reduce((sum, s) => sum + s.last_30d, 0),
      conversionRate: financial?.conversion_rate_30d ?? 0,
      avgCycleTime: financial?.avg_cycle_days ?? 0,
    },
    refetch,
  };
}
