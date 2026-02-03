import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface Project {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  project_type: string;
  project_status: string;
  address?: string;
  city?: string;
  zip_code?: string;
  square_footage?: number;
  estimated_cost?: number;
  actual_cost?: number;
  start_date?: string;
  completion_date?: string;
  notes?: string;
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

interface AdminDataState {
  leads: Lead[];
  projects: Project[];
  stats: AdminStats;
  isLoading: boolean;
  error: string | null;
}

export function useAdminData() {
  const { toast } = useToast();
  const [state, setState] = useState<AdminDataState>({
    leads: [],
    projects: [],
    stats: {
      totalLeads: 0,
      newLeads: 0,
      contactedLeads: 0,
      qualifiedLeads: 0,
      convertedLeads: 0,
      lostLeads: 0,
      conversionRate: 0,
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      averageProjectValue: 0
    },
    isLoading: true,
    error: null
  });

  const calculateStats = (leads: Lead[], projects: Project[]): AdminStats => {
    // Leads Stats
    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.status === 'new').length;
    const contactedLeads = leads.filter(l => l.status === 'contacted').length;
    const qualifiedLeads = leads.filter(l => l.status === 'qualified').length;
    const convertedLeads = leads.filter(l => l.status === 'converted').length;
    const lostLeads = leads.filter(l => l.status === 'lost').length;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // Projects Stats
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.project_status === 'in_progress' || p.project_status === 'pending').length;
    const completedProjects = projects.filter(p => p.project_status === 'completed').length;
    
    // Revenue Stats - Use actual_cost OR estimated_cost for completed projects
    const completedProjectsWithCost = projects.filter(p => 
      p.project_status === 'completed' && (p.actual_cost || p.estimated_cost)
    );
    
    const totalRevenue = completedProjectsWithCost.reduce((sum, p) => 
      sum + (p.actual_cost || p.estimated_cost || 0), 0
    );
    
    // Monthly revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyRevenue = completedProjectsWithCost
      .filter(p => p.completion_date && new Date(p.completion_date) >= thirtyDaysAgo)
      .reduce((sum, p) => sum + (p.actual_cost || p.estimated_cost || 0), 0);
    
    const averageProjectValue = completedProjectsWithCost.length > 0 
      ? Math.round(totalRevenue / completedProjectsWithCost.length)
      : 0;

    return {
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      convertedLeads,
      lostLeads,
      conversionRate,
      totalProjects,
      activeProjects,
      completedProjects,
      totalRevenue,
      monthlyRevenue,
      averageProjectValue
    };
  };

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      // Process leads to ensure services and follow_up_actions are arrays
      const processedLeads: Lead[] = (leadsData || []).map(lead => ({
        ...lead,
        services: Array.isArray(lead.services) ? lead.services as string[] : [],
        follow_up_actions: Array.isArray(lead.follow_up_actions) 
          ? (lead.follow_up_actions as unknown as FollowUpAction[]) 
          : []
      }));

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const processedProjects = projectsData || [];

      // Use only real data - no sample data
      const finalLeads = processedLeads;
      const finalProjects = processedProjects;

      // Calculate stats
      const stats = calculateStats(finalLeads, finalProjects);

      setState(prev => ({
        ...prev,
        leads: finalLeads,
        projects: finalProjects,
        stats,
        isLoading: false,
        error: null
      }));

    } catch (error) {
      console.error('Error fetching admin data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      toast({
        title: "Erro ao carregar dados",
        description: "Por favor, atualize a página e tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    ...state,
    refreshData
  };
}