import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FollowUpAction {
  date: string;
  action: string;
  notes?: string;
}

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  lead_source: string;
  status: string;
  priority: string;
  services: string[];
  budget?: number;
  room_size?: string;
  location?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  message?: string;
  assigned_to?: string;
  follow_up_date?: string;
  last_contacted_at?: string;
  converted_to_project_id?: string;
  notes?: string;
  follow_up_required?: boolean;
  next_action_date?: string;
  follow_up_actions?: FollowUpAction[];
  created_at: string;
  updated_at: string;
}

interface AdminStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  conversionRate: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageProjectValue: number;
}

const LEAD_COLUMNS = 'id, name, email, phone, lead_source, status, priority, services, budget, room_size, location, address, city, zip_code, message, assigned_to, follow_up_date, last_contacted_at, converted_to_project_id, notes, follow_up_required, next_action_date, follow_up_actions, created_at, updated_at';

const PROJECT_COLUMNS = 'id, customer_name, customer_email, customer_phone, project_type, project_status, address, city, zip_code, square_footage, estimated_cost, actual_cost, start_date, completion_date, notes, created_at, updated_at';

async function fetchLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select(LEAD_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data || []).map(lead => ({
    ...lead,
    services: Array.isArray(lead.services) ? lead.services as string[] : [],
    follow_up_actions: Array.isArray(lead.follow_up_actions)
      ? (lead.follow_up_actions as unknown as FollowUpAction[])
      : []
  })) as Lead[];
}

async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export function useAdminData() {
  const { data: leads = [], isLoading: leadsLoading, refetch: refetchLeads } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: fetchLeads,
    refetchInterval: 300_000,
    staleTime: 60_000,
  });

  const { data: projects = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: fetchProjects,
    refetchInterval: 300_000,
    staleTime: 60_000,
  });

  const isLoading = leadsLoading || projectsLoading;

  const stats = useMemo((): AdminStats => {
    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.status === 'cold_lead').length;
    const contactedLeads = leads.filter(l => l.status === 'warm_lead').length;
    const qualifiedLeads = leads.filter(l => l.status === 'estimate_requested').length;
    const convertedLeads = leads.filter(l => l.status === 'in_production').length;
    const lostLeads = leads.filter(l => l.status === 'lost').length;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.project_status === 'in_progress' || p.project_status === 'pending').length;
    const completedProjects = projects.filter(p => p.project_status === 'completed').length;

    const completedProjectsWithCost = projects.filter(p =>
      p.project_status === 'completed' && (p.actual_cost || p.estimated_cost)
    );
    const totalRevenue = completedProjectsWithCost.reduce((sum, p) =>
      sum + (p.actual_cost || p.estimated_cost || 0), 0
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyRevenue = completedProjectsWithCost
      .filter(p => p.completion_date && new Date(p.completion_date) >= thirtyDaysAgo)
      .reduce((sum, p) => sum + (p.actual_cost || p.estimated_cost || 0), 0);

    const averageProjectValue = completedProjectsWithCost.length > 0
      ? Math.round(totalRevenue / completedProjectsWithCost.length)
      : 0;

    return {
      totalLeads, newLeads, contactedLeads, qualifiedLeads, convertedLeads, lostLeads, conversionRate,
      totalProjects, activeProjects, completedProjects, totalRevenue, monthlyRevenue, averageProjectValue
    };
  }, [leads, projects]);

  const refreshData = () => {
    refetchLeads();
    refetchProjects();
  };

  return { leads, projects, stats, isLoading, error: null, refreshData };
}
