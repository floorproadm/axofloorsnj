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

interface QuizResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  services: string[];
  room_size: string;
  budget: number;
  city?: string;
  zip_code?: string;
  created_at: string;
  source: string;
}

const Admin = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [quizResponses, setQuizResponses] = useState<QuizResponse[]>([]);
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

      // Load quiz responses (leads)
      const { data: quizData, error: quizError } = await supabase
        .from('quiz_responses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (quizError) throw quizError;
      setQuizResponses(quizData || []);

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
          newLeads: quizData?.filter(q => 
            new Date(q.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
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

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      });
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('gallery')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent, file?: File) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let imageUrl = "";
      
      if (file) {
        const uploadedUrl = await handleFileUpload(file);
        if (!uploadedUrl) return;
        imageUrl = uploadedUrl;
      }

      const projectData = {
        ...formData,
        image_url: imageUrl || formData.title, // Will need to be updated for editing
      };

      if (editingProject) {
        // Update existing project
        const updateData = imageUrl ? projectData : { ...formData };
        const { error } = await supabase
          .from('gallery_projects')
          .update(updateData)
          .eq('id', editingProject);

        if (error) throw error;
        setEditingProject(null);
        toast({
          title: "Success",
          description: "Project updated successfully",
        });
      } else {
        // Create new project
        if (!imageUrl) {
          toast({
            title: "Error",
            description: "Please select an image",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase
          .from('gallery_projects')
          .insert([projectData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Project added successfully",
        });
      }

      setFormData({
        title: "",
        description: "",
        category: "",
        location: "",
        is_featured: false,
        display_order: 0
      });
      
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (project: GalleryProject) => {
    setEditingProject(project.id);
    setFormData({
      title: project.title,
      description: project.description,
      category: project.category,
      location: project.location,
      is_featured: project.is_featured,
      display_order: project.display_order
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase
        .from('gallery_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const toggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('gallery_projects')
        .update({ is_featured: !currentFeatured })
        .eq('id', id);

      if (error) throw error;
      
      fetchProjects();
      toast({
        title: "Success",
        description: `Project ${!currentFeatured ? 'featured' : 'unfeatured'} successfully`,
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-grey/20 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-navy">AXO Floors Admin</h1>
              <Badge variant="secondary" className="bg-gold/10 text-gold">
                Welcome, {user?.email}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Back to Site
                </Button>
              </Link>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4 mx-auto">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-navy mb-1">{stats.totalProjects}</div>
              <div className="text-sm text-grey">Total Projects</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-4 mx-auto">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-navy mb-1">{stats.pendingProjects}</div>
              <div className="text-sm text-grey">Pending</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-navy mb-1">{stats.completedProjects}</div>
              <div className="text-sm text-grey">Completed</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gold/20 rounded-full mb-4 mx-auto">
                <DollarSign className="w-6 h-6 text-gold" />
              </div>
              <div className="text-2xl font-bold text-navy mb-1">{formatCurrency(stats.totalRevenue)}</div>
              <div className="text-sm text-grey">Total Revenue</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4 mx-auto">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-navy mb-1">{stats.upcomingAppointments}</div>
              <div className="text-sm text-grey">Upcoming</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4 mx-auto">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-navy mb-1">{stats.newLeads}</div>
              <div className="text-sm text-grey">New Leads</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="leads">New Leads</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="appointments">Calendar</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* New Leads Tab */}
          <TabsContent value="leads">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  New Leads from Quiz
                </CardTitle>
                <Button variant="outline" size="sm" onClick={loadDashboardData}>
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quizResponses.length === 0 ? (
                    <p className="text-grey text-center py-8">No leads yet. Promote your quiz to get more leads!</p>
                  ) : (
                    quizResponses.map((lead) => (
                      <div key={lead.id} className="border rounded-lg p-4 hover:bg-grey-light/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-navy">{lead.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-grey mt-1">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {lead.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                              </span>
                              {lead.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {lead.city}, NJ
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-grey">{formatDate(lead.created_at)}</div>
                            <Badge variant="secondary" className="mt-1">
                              {lead.source}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <span className="text-sm font-medium text-navy">Services:</span>
                            <p className="text-sm text-grey">{lead.services.join(', ')}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-navy">Area:</span>
                            <p className="text-sm text-grey">{lead.room_size} sq ft</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-navy">Budget:</span>
                            <p className="text-sm text-grey">{formatCurrency(lead.budget)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button size="sm" className="gold-gradient text-black">
                            <Phone className="w-3 h-3 mr-1" />
                            Call Now
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="w-3 h-3 mr-1" />
                            Email
                          </Button>
                          <Button variant="outline" size="sm">
                            <Plus className="w-3 h-3 mr-1" />
                            Create Project
                          </Button>
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
        </Tabs>
      </div>
    </div>
  );
};

          <TabsContent value="gallery" className="space-y-8">
            {/* Add/Edit Form */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingProject ? "Edit Project" : "Add New Project"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                  const file = fileInput?.files?.[0];
                  handleSubmit(e, file);
                }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="title">Project Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input
                        id="display_order"
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id="is_featured"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                      />
                      <Label htmlFor="is_featured">Featured Project</Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="image">Project Image {editingProject && "(Leave empty to keep current image)"}</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      required={!editingProject}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={isUploading} className="gold-gradient">
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? "Uploading..." : editingProject ? "Update Project" : "Add Project"}
                    </Button>
                    {editingProject && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setEditingProject(null);
                          setFormData({
                            title: "",
                            description: "",
                            category: "",
                            location: "",
                            is_featured: false,
                            display_order: 0
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Projects List */}
            <Card>
              <CardHeader>
                <CardTitle>Existing Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-8">Loading projects...</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                      <Card key={project.id} className="group hover:shadow-lg transition-smooth">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
                          <img 
                            src={project.image_url} 
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-500"
                          />
                          {project.is_featured && (
                            <Badge className="absolute top-2 left-2 bg-gold text-navy">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-heading font-semibold text-navy mb-1">
                            {project.title}
                          </h3>
                          <p className="text-sm text-gold font-medium mb-2">{project.location}</p>
                          <p className="text-sm text-grey mb-2">{project.category}</p>
                          <p className="text-xs text-grey mb-4 line-clamp-2">{project.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-grey">Order: {project.display_order}</span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleFeatured(project.id, project.is_featured)}
                              >
                                {project.is_featured ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(project)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(project.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;