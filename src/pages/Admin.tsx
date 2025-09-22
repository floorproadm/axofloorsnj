import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  MapPin,
  Phone,
  Mail,
  Eye,
  Edit,
  Plus,
  LogOut,
  Home,
  BarChart3,
  FileText,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  project_type: string;
  project_status: string;
  square_footage: number;
  estimated_cost: number;
  actual_cost?: number;
  start_date?: string;
  completion_date?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  notes?: string;
  created_at: string;
}

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  appointment_type: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  location?: string;
  notes?: string;
  project_id?: string;
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
  created_at: string;
  updated_at: string;
}

const Admin = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    pendingProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
    upcomingAppointments: 0,
    newLeads: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Load appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);

      // Load leads from unified leads table
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (leadsError) throw leadsError;
      const processedLeads = (leadsData || []).map(lead => ({
        ...lead,
        services: Array.isArray(lead.services) ? lead.services as string[] : []
      }));
      setLeads(processedLeads);

      // Calculate stats
      if (projectsData) {
        const pendingCount = projectsData.filter(p => p.project_status === 'pending').length;
        const completedCount = projectsData.filter(p => p.project_status === 'completed').length;
        const totalRevenue = projectsData
          .filter(p => p.actual_cost)
          .reduce((sum, p) => sum + (p.actual_cost || 0), 0);

        setStats({
          totalProjects: projectsData.length,
          pendingProjects: pendingCount,
          completedProjects: completedCount,
          totalRevenue: totalRevenue,
          upcomingAppointments: appointmentsData?.filter(a => 
            new Date(a.appointment_date) >= new Date() && a.status === 'scheduled'
          ).length || 0,
          newLeads: processedLeads?.filter(l => 
            new Date(l.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length || 0
        });
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error loading data",
        description: "Please refresh the page and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out."
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-grey">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-First Header */}
      <div className="bg-white border-b border-grey/20 sticky top-0 z-10">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-navy truncate">
                AXO Admin
              </h1>
              <Badge variant="secondary" className="bg-gold/10 text-gold text-xs px-2 py-1 hidden sm:inline-flex">
                {user?.email?.split('@')[0]}
              </Badge>
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
              <Link to="/">
                <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3">
                  <Home className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline ml-1 sm:ml-2">Back</span>
                </Button>
              </Link>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                className="h-8 px-2 sm:px-3 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-1 sm:ml-2">Out</span>
              </Button>
            </div>
          </div>
          {/* Mobile User Info */}
          <div className="sm:hidden mt-2">
            <p className="text-xs text-grey truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* Stats Overview - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <Card className="col-span-1">
            <CardContent className="p-2 sm:p-3 md:p-4 text-center">
              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-100 rounded-full mb-1 sm:mb-2 mx-auto">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div className="text-sm sm:text-lg md:text-xl font-bold text-navy mb-1">{stats.totalProjects}</div>
              <div className="text-xs text-grey">Projects</div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-2 sm:p-3 md:p-4 text-center">
              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-yellow-100 rounded-full mb-1 sm:mb-2 mx-auto">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-600" />
              </div>
              <div className="text-sm sm:text-lg md:text-xl font-bold text-navy mb-1">{stats.pendingProjects}</div>
              <div className="text-xs text-grey">Pending</div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-2 sm:p-3 md:p-4 text-center">
              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full mb-1 sm:mb-2 mx-auto">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <div className="text-sm sm:text-lg md:text-xl font-bold text-navy mb-1">{stats.completedProjects}</div>
              <div className="text-xs text-grey">Done</div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-2 sm:p-3 md:p-4 text-center">
              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gold/20 rounded-full mb-1 sm:mb-2 mx-auto">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gold" />
              </div>
              <div className="text-xs sm:text-sm md:text-xl font-bold text-navy mb-1">{formatCurrency(stats.totalRevenue)}</div>
              <div className="text-xs text-grey">Revenue</div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-2 sm:p-3 md:p-4 text-center">
              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-purple-100 rounded-full mb-1 sm:mb-2 mx-auto">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <div className="text-sm sm:text-lg md:text-xl font-bold text-navy mb-1">{stats.upcomingAppointments}</div>
              <div className="text-xs text-grey">Meetings</div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-2 sm:p-3 md:p-4 text-center">
              <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-green-100 rounded-full mb-1 sm:mb-2 mx-auto">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <div className="text-sm sm:text-lg md:text-xl font-bold text-navy mb-1">{stats.newLeads}</div>
              <div className="text-xs text-grey">New Leads</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs - Mobile Optimized */}
        <Tabs defaultValue="leads" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto pb-2 -mx-3 sm:mx-0">
            <div className="px-3 sm:px-0">
              <TabsList className="grid w-full grid-cols-5 h-auto sm:min-w-[500px]">
                <TabsTrigger value="leads" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Leads</TabsTrigger>
                <TabsTrigger value="projects" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Projects</TabsTrigger>
                <TabsTrigger value="appointments" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Calendar</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Analytics</TabsTrigger>
                <TabsTrigger value="management" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Manager</TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Recent Leads (Last 7 days)
                </CardTitle>
                <Button variant="outline" size="sm" onClick={loadDashboardData}>
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leads.length === 0 ? (
                    <p className="text-grey text-center py-8">No recent leads. Check the Full Leads tab for all leads.</p>
                  ) : (
                    leads.slice(0, 10).map((lead) => (
                      <div key={lead.id} className="border rounded-lg p-4 hover:bg-grey-light/50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-navy truncate">{lead.name}</h4>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-grey mt-1">
                              {lead.email && (
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{lead.email}</span>
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                {lead.phone}
                              </span>
                              {lead.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  {lead.city}, NJ
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="text-right">
                              <div className="text-sm text-grey">{formatDate(lead.created_at)}</div>
                              <Badge variant="secondary" className="mt-1">
                                {lead.lead_source}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {(lead.services.length > 0 || lead.budget || lead.room_size) && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            {lead.services.length > 0 && (
                              <div>
                                <span className="text-sm font-medium text-navy">Services:</span>
                                <p className="text-sm text-grey">{lead.services.join(', ')}</p>
                              </div>
                            )}
                            {lead.room_size && (
                              <div>
                                <span className="text-sm font-medium text-navy">Area:</span>
                                <p className="text-sm text-grey">{lead.room_size} sq ft</p>
                              </div>
                            )}
                            {lead.budget && (
                              <div>
                                <span className="text-sm font-medium text-navy">Budget:</span>
                                <p className="text-sm text-grey">{formatCurrency(lead.budget)}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 md:flex-row flex-col md:gap-2 gap-1">
                          <Button size="sm" className="gold-gradient text-black w-full md:w-auto">
                            <Phone className="w-3 h-3 mr-1" />
                            Call Now
                          </Button>
                          <div className="flex gap-1 w-full md:w-auto">
                            <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                              <Mail className="w-3 h-3 mr-1" />
                              Email
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                              <Plus className="w-3 h-3 mr-1" />
                              Create Project
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Active Projects
                </CardTitle>
                <Button className="gold-gradient text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.length === 0 ? (
                    <p className="text-grey text-center py-8">No projects yet. Create your first project!</p>
                  ) : (
                    projects.map((project) => (
                      <div key={project.id} className="border rounded-lg p-4 hover:bg-grey-light/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-navy">{project.customer_name}</h4>
                            <p className="text-sm text-grey">{project.project_type}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(project.project_status)}>
                              {project.project_status}
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-navy">Contact:</span>
                            <p className="text-grey">{project.customer_phone}</p>
                          </div>
                          <div>
                            <span className="font-medium text-navy">Area:</span>
                            <p className="text-grey">{project.square_footage} sq ft</p>
                          </div>
                          <div>
                            <span className="font-medium text-navy">Estimate:</span>
                            <p className="text-grey">{formatCurrency(project.estimated_cost)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-navy">Created:</span>
                            <p className="text-grey">{formatDate(project.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="appointments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Appointments
                </CardTitle>
                <Button className="gold-gradient text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Appointment
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments.length === 0 ? (
                    <p className="text-grey text-center py-8">No appointments scheduled. Create your first appointment!</p>
                  ) : (
                    appointments.slice(0, 10).map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-4 hover:bg-grey-light/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-navy">{appointment.customer_name}</h4>
                            <p className="text-sm text-grey">{appointment.appointment_type}</p>
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-navy">Date & Time:</span>
                            <p className="text-grey">
                              {formatDate(appointment.appointment_date)} at {appointment.appointment_time}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-navy">Contact:</span>
                            <p className="text-grey">{appointment.customer_phone}</p>
                          </div>
                          <div>
                            <span className="font-medium text-navy">Location:</span>
                            <p className="text-grey">{appointment.location || 'TBD'}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Project Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-grey">Pending Projects</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-grey-light rounded-full">
                          <div 
                            className="h-2 bg-yellow-500 rounded-full" 
                            style={{ 
                              width: `${stats.totalProjects > 0 ? (stats.pendingProjects / stats.totalProjects) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{stats.pendingProjects}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-grey">Completed Projects</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-grey-light rounded-full">
                          <div 
                            className="h-2 bg-green-500 rounded-full" 
                            style={{ 
                              width: `${stats.totalProjects > 0 ? (stats.completedProjects / stats.totalProjects) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{stats.completedProjects}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Revenue Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-grey">Total Revenue</span>
                      <p className="text-2xl font-bold text-navy">{formatCurrency(stats.totalRevenue)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-grey">Average Project Value</span>
                      <p className="text-lg font-semibold text-navy">
                        {stats.completedProjects > 0 
                          ? formatCurrency(stats.totalRevenue / stats.completedProjects)
                          : '$0'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Full Leads Management Tab */}
          <TabsContent value="management">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-navy">Complete Leads Management</h3>
                  <p className="text-sm text-grey">Advanced lead tracking and management</p>
                </div>
                <Link to="/leads-management">
                  <Button className="gold-gradient text-black">
                    <Users className="w-4 h-4 mr-2" />
                    Open Full Leads Manager
                  </Button>
                </Link>
              </div>
              
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4 mx-auto">
                    <Users className="w-8 h-8 text-gold" />
                  </div>
                  <h4 className="text-xl font-semibold text-navy mb-2">Advanced Leads Management</h4>
                  <p className="text-grey mb-6 max-w-md mx-auto">
                    Access the complete leads management system with filtering, status tracking, 
                    conversion tools, and detailed lead profiles.
                  </p>
                  <Link to="/leads-management">
                    <Button size="lg" className="gold-gradient text-black">
                      Open Leads Manager
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;