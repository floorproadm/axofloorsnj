import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Lead {
  id: string;
  name: string;
  status: string;
  budget: number | null;
  lead_source: string;
  follow_up_required: boolean | null;
  next_action_date: string | null;
  follow_up_actions: any;
  converted_to_project_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  project_status: string;
  customer_name: string;
  estimated_cost: number | null;
  created_at: string;
}

interface JobCost {
  project_id: string;
  margin_percent: number | null;
  profit_amount: number | null;
  total_cost: number | null;
  estimated_revenue: number | null;
}

interface JobProof {
  project_id: string;
  before_image_url: string | null;
  after_image_url: string | null;
}

interface CompanySettings {
  default_margin_min_percent: number;
}

interface CriticalAlerts {
  proposalWithoutFollowUp: Lead[];
  jobsBlockedByProof: Project[];
  leadsStalled48h: Lead[];
  newLeadsNoContact24h: Lead[];
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

interface MarginHealth {
  avgMargin30d: number | null;
  jobsBelowMinMargin: number;
  estimatedProfitOpen: number;
  hasData: boolean;
}

interface ExecutionMetrics {
  jobsInProduction: number;
  jobsReadyToComplete: number;
  jobsBlockedByProof: number;
}

interface IntakeMetrics {
  topSourcesByVolume: { source: string; count: number }[];
  topSourceByConversion: { source: string; rate: number } | null;
  manualLeads30d: number;
}

const ACTIVE_STATUSES = ['cold_lead', 'warm_lead', 'estimate_requested', 'estimate_scheduled', 'in_draft', 'proposal_sent', 'proposal_rejected', 'in_production'];

async function fetchDashboardData() {
  const [leadsRes, projectsRes, jobCostsRes, jobProofsRes, settingsRes] = await Promise.all([
    supabase.from('leads').select('id, name, status, budget, lead_source, follow_up_required, next_action_date, follow_up_actions, converted_to_project_id, created_at, updated_at'),
    supabase.from('projects').select('id, project_status, customer_name, estimated_cost, created_at'),
    supabase.from('job_costs').select('project_id, margin_percent, profit_amount, total_cost, estimated_revenue'),
    supabase.from('job_proof').select('project_id, before_image_url, after_image_url'),
    supabase.from('company_settings').select('default_margin_min_percent').limit(1).maybeSingle()
  ]);

  if (leadsRes.error) throw leadsRes.error;
  if (projectsRes.error) throw projectsRes.error;
  if (jobCostsRes.error) throw jobCostsRes.error;
  if (jobProofsRes.error) throw jobProofsRes.error;

  return {
    leads: (leadsRes.data || []) as Lead[],
    projects: (projectsRes.data || []) as Project[],
    jobCosts: (jobCostsRes.data || []) as JobCost[],
    jobProofs: (jobProofsRes.data || []) as JobProof[],
    companySettings: settingsRes.data as CompanySettings | null,
  };
}

/**
 * Hook for Executive Dashboard - READ ONLY
 * Uses React Query for caching, dedup, and stale control
 */
export function useDashboardData() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: fetchDashboardData,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });

  const leads = data?.leads ?? [];
  const projects = data?.projects ?? [];
  const jobCosts = data?.jobCosts ?? [];
  const jobProofs = data?.jobProofs ?? [];
  const companySettings = data?.companySettings ?? null;

  // Computed: Critical Alerts
  const criticalAlerts = useMemo((): CriticalAlerts => {
    const now = new Date();
    const h48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const h24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const proposalWithoutFollowUp = leads.filter(l => {
      if (l.status !== 'proposal_sent') return false;
      const actions = Array.isArray(l.follow_up_actions) ? l.follow_up_actions : [];
      return actions.length === 0;
    });

    const inProductionProjects = projects.filter(p => p.project_status === 'in_progress');
    const jobsBlockedByProof = inProductionProjects.filter(p => {
      const proof = jobProofs.find(jp => jp.project_id === p.id);
      if (!proof) return true;
      return !proof.before_image_url || !proof.after_image_url;
    });

    const leadsStalled48h = leads.filter(l => {
      if (!ACTIVE_STATUSES.includes(l.status)) return false;
      return new Date(l.updated_at) < h48Ago;
    });

    const newLeadsNoContact24h = leads.filter(l => {
      if (l.status !== 'cold_lead') return false;
      return new Date(l.created_at) < h24Ago;
    });

    const stageCounts: Record<string, number> = {};
    leads.forEach(l => {
      if (ACTIVE_STATUSES.includes(l.status)) {
        stageCounts[l.status] = (stageCounts[l.status] || 0) + 1;
      }
    });
    
    let pipelineBottleneck: { stage: string; count: number } | null = null;
    const stageEntries = Object.entries(stageCounts);
    if (stageEntries.length > 0) {
      const maxStage = stageEntries.reduce((a, b) => a[1] > b[1] ? a : b);
      const avgCount = stageEntries.reduce((sum, [, c]) => sum + c, 0) / stageEntries.length;
      if (maxStage[1] > avgCount * 2 && maxStage[1] >= 5) {
        pipelineBottleneck = { stage: maxStage[0], count: maxStage[1] };
      }
    }

    const hasNoCriticalIssues = 
      proposalWithoutFollowUp.length === 0 &&
      jobsBlockedByProof.length === 0 &&
      leadsStalled48h.length === 0 &&
      newLeadsNoContact24h.length === 0 &&
      !pipelineBottleneck;

    return { proposalWithoutFollowUp, jobsBlockedByProof, leadsStalled48h, newLeadsNoContact24h, pipelineBottleneck, hasNoCriticalIssues };
  }, [leads, projects, jobProofs]);

  // Computed: Money Metrics
  const moneyMetrics = useMemo((): MoneyMetrics => {
    const activeLeads = leads.filter(l => ACTIVE_STATUSES.includes(l.status));
    const activeLeadsCount = activeLeads.length;
    const estimatedValueOpen = activeLeads.reduce((sum, l) => sum + (l.budget || 0), 0);

    const blockedLeads = leads.filter(l => {
      if (l.status !== 'proposal_sent') return false;
      const actions = Array.isArray(l.follow_up_actions) ? l.follow_up_actions : [];
      return actions.length === 0;
    });
    const blockedLeadsCount = blockedLeads.length;
    const blockedLeadsValue = blockedLeads.reduce((sum, l) => sum + (l.budget || 0), 0);

    let avgVelocityDays = 0;
    if (activeLeads.length > 0) {
      const now = new Date();
      const totalDays = activeLeads.reduce((sum, l) => {
        return sum + (now.getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24);
      }, 0);
      avgVelocityDays = Math.round(totalDays / activeLeads.length);
    }

    return { activeLeadsCount, estimatedValueOpen, blockedLeadsCount, blockedLeadsValue, avgVelocityDays };
  }, [leads]);

  // Computed: Funnel Metrics
  const funnelMetrics = useMemo((): FunnelMetrics => {
    const counts: FunnelMetrics = {
      cold_lead: 0, warm_lead: 0, estimate_requested: 0, estimate_scheduled: 0,
      in_draft: 0, proposal_sent: 0, proposal_rejected: 0, in_production: 0,
      completed: 0, lost: 0, lostRate30d: 0
    };

    const statusMap: Record<string, keyof FunnelMetrics> = {
      'new': 'cold_lead', 'new_lead': 'cold_lead', 'cold_lead': 'cold_lead',
      'contacted': 'warm_lead', 'warm_lead': 'warm_lead',
      'estimate_requested': 'estimate_requested',
      'appt_scheduled': 'estimate_scheduled', 'estimate_scheduled': 'estimate_scheduled',
      'in_draft': 'in_draft',
      'qualified': 'proposal_sent', 'quoted': 'proposal_sent', 'proposal': 'proposal_sent', 'proposal_sent': 'proposal_sent',
      'proposal_rejected': 'proposal_rejected',
      'won': 'in_production', 'in_production': 'in_production',
      'converted': 'completed', 'completed': 'completed',
      'lost': 'lost'
    };

    leads.forEach(l => {
      const mappedStatus = statusMap[l.status];
      if (mappedStatus && mappedStatus !== 'lostRate30d') {
        counts[mappedStatus]++;
      }
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const leads30d = leads.filter(l => new Date(l.created_at) >= thirtyDaysAgo);
    const lost30d = leads30d.filter(l => l.status === 'lost').length;
    counts.lostRate30d = leads30d.length > 0 ? Math.round((lost30d / leads30d.length) * 100) : 0;

    return counts;
  }, [leads]);

  // Computed: Margin Health
  const marginHealth = useMemo((): MarginHealth => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const minMargin = companySettings?.default_margin_min_percent ?? 30;

    const recentProjects = projects.filter(p => 
      new Date(p.created_at) >= thirtyDaysAgo && p.project_status === 'completed'
    );
    const recentProjectIds = new Set(recentProjects.map(p => p.id));
    const recentJobCosts = jobCosts.filter(jc => 
      recentProjectIds.has(jc.project_id) && jc.margin_percent !== null
    );

    const avgMargin30d = recentJobCosts.length > 0
      ? recentJobCosts.reduce((sum, jc) => sum + (jc.margin_percent || 0), 0) / recentJobCosts.length
      : null;

    const jobsBelowMinMargin = jobCosts.filter(jc => 
      jc.margin_percent !== null && jc.margin_percent < minMargin
    ).length;

    const activeProjects = projects.filter(p => 
      p.project_status === 'in_progress' || p.project_status === 'pending'
    );
    const activeProjectIds = new Set(activeProjects.map(p => p.id));
    const estimatedProfitOpen = jobCosts
      .filter(jc => activeProjectIds.has(jc.project_id))
      .reduce((sum, jc) => sum + (jc.profit_amount || 0), 0);

    return {
      avgMargin30d: avgMargin30d !== null ? Math.round(avgMargin30d * 10) / 10 : null,
      jobsBelowMinMargin,
      estimatedProfitOpen,
      hasData: jobCosts.length > 0
    };
  }, [projects, jobCosts, companySettings]);

  // Computed: Execution Metrics
  const executionMetrics = useMemo((): ExecutionMetrics => {
    const inProductionProjects = projects.filter(p => p.project_status === 'in_progress');
    
    const jobsReadyToComplete = inProductionProjects.filter(p => {
      const proof = jobProofs.find(jp => jp.project_id === p.id);
      return proof && proof.before_image_url && proof.after_image_url;
    }).length;

    const jobsBlockedByProof = inProductionProjects.filter(p => {
      const proof = jobProofs.find(jp => jp.project_id === p.id);
      if (!proof) return true;
      return !proof.before_image_url || !proof.after_image_url;
    }).length;

    return { jobsInProduction: inProductionProjects.length, jobsReadyToComplete, jobsBlockedByProof };
  }, [projects, jobProofs]);

  // Computed: Intake Metrics
  const intakeMetrics = useMemo((): IntakeMetrics => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const leads30d = leads.filter(l => new Date(l.created_at) >= thirtyDaysAgo);

    const normalizeSource = (source: string): string => {
      if (['contact_form', 'contact_page', 'contact_section'].includes(source)) return 'contact';
      return source;
    };

    const sourceCounts: Record<string, { total: number; converted: number }> = {};
    leads30d.forEach(l => {
      const src = normalizeSource(l.lead_source);
      if (!sourceCounts[src]) sourceCounts[src] = { total: 0, converted: 0 };
      sourceCounts[src].total++;
      if (l.converted_to_project_id || l.status === 'completed') sourceCounts[src].converted++;
    });

    const topSourcesByVolume = Object.entries(sourceCounts)
      .map(([source, stats]) => ({ source, count: stats.total }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    let topSourceByConversion: { source: string; rate: number } | null = null;
    const qualifiedSources = Object.entries(sourceCounts)
      .filter(([, stats]) => stats.total >= 3)
      .map(([source, stats]) => ({ source, rate: Math.round((stats.converted / stats.total) * 100) }))
      .sort((a, b) => b.rate - a.rate);
    if (qualifiedSources.length > 0) topSourceByConversion = qualifiedSources[0];

    const manualLeads30d = leads30d.filter(l => normalizeSource(l.lead_source) === 'manual').length;

    return { topSourcesByVolume, topSourceByConversion, manualLeads30d };
  }, [leads]);

  return {
    leads,
    projects,
    jobCosts,
    jobProofs,
    companySettings,
    lastUpdated: new Date(),
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Erro ao carregar dados') : null,
    criticalAlerts,
    moneyMetrics,
    funnelMetrics,
    marginHealth,
    executionMetrics,
    intakeMetrics,
    refetch
  };
}
