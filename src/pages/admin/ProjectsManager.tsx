import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/admin/DataTable";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Plus, 
  Calendar, 
  DollarSign, 
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings
} from "lucide-react";

interface Project {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  project_type: string;
  project_status: string;
  address: string;
  city: string;
  zip_code: string;
  square_footage: number;
  estimated_cost: number;
  actual_cost: number;
  start_date: string;
  completion_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const projectTypes = [
  "Hardwood Installation",
  "Floor Refinishing", 
  "Vinyl Plank Installation",
  "Staircase Renovation",
  "Baseboards & Trim",
  "Commercial Flooring"
];

const projectStatuses = [
  "pending",
  "in_progress", 
  "completed",
  "cancelled",
  "on_hold"
];

const statusConfig = {
  pending: { color: "orange", icon: Clock, label: "Pending" },
  in_progress: { color: "blue", icon: Clock, label: "In Progress" },
  completed: { color: "green", icon: CheckCircle, label: "Completed" },
  cancelled: { color: "red", icon: AlertCircle, label: "Cancelled" },
  on_hold: { color: "yellow", icon: AlertCircle, label: "On Hold" }
};

export default function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const { toast } = useToast();

  // Form state
  const [projectForm, setProjectForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    project_type: "",
    project_status: "pending",
    address: "",
    city: "",
    zip_code: "",
    square_footage: "",
    estimated_cost: "",
    actual_cost: "",
    start_date: "",
    completion_date: "",
    notes: ""
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);

      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProject = async () => {
    try {
      if (!projectForm.customer_name.trim() || !projectForm.project_type || !projectForm.customer_phone.trim()) {
        toast({
          title: "Error",
          description: "Customer name, phone, and project type are required",
          variant: "destructive",
        });
        return;
      }

      const projectData = {
        ...projectForm,
        square_footage: projectForm.square_footage ? parseInt(projectForm.square_footage) : null,
        estimated_cost: projectForm.estimated_cost ? parseInt(projectForm.estimated_cost) : null,
        actual_cost: projectForm.actual_cost ? parseInt(projectForm.actual_cost) : null,
        start_date: projectForm.start_date || null,
        completion_date: projectForm.completion_date || null,
      };

      let result;
      if (editingProject) {
        result = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id);
      } else {
        result = await supabase
          .from('projects')
          .insert([projectData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Project ${editingProject ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingProject(null);
      resetForm();
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete the project for "${project.customer_name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

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

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      customer_name: project.customer_name,
      customer_email: project.customer_email,
      customer_phone: project.customer_phone,
      project_type: project.project_type,
      project_status: project.project_status,
      address: project.address || "",
      city: project.city || "",
      zip_code: project.zip_code || "",
      square_footage: project.square_footage?.toString() || "",
      estimated_cost: project.estimated_cost?.toString() || "",
      actual_cost: project.actual_cost?.toString() || "",
      start_date: project.start_date || "",
      completion_date: project.completion_date || "",
      notes: project.notes || ""
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setProjectForm({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      project_type: "",
      project_status: "pending",
      address: "",
      city: "",
      zip_code: "",
      square_footage: "",
      estimated_cost: "",
      actual_cost: "",
      start_date: "",
      completion_date: "",
      notes: ""
    });
  };

  const filteredProjects = selectedStatus === "all" 
    ? projects 
    : projects.filter(p => p.project_status === selectedStatus);

  const getStatusStats = () => {
    return projectStatuses.reduce((acc, status) => {
      acc[status] = projects.filter(p => p.project_status === status).length;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusStats = getStatusStats();
  const totalRevenue = projects
    .filter(p => p.project_status === 'completed' && p.actual_cost)
    .reduce((sum, p) => sum + (p.actual_cost || 0), 0);

  const columns = [
    {
      accessorKey: "customer_name",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("customer_name")}</div>
          <div className="text-sm text-muted-foreground">{row.original.customer_phone}</div>
        </div>
      ),
    },
    {
      accessorKey: "project_type",
      header: "Project Type",
    },
    {
      accessorKey: "project_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("project_status") as string;
        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;
        
        return (
          <Badge variant="outline" className={`text-${config.color}-600 border-${config.color}-200`}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "city",
      header: "Location",
      cell: ({ row }) => (
        row.original.city && row.original.zip_code 
          ? `${row.original.city}, ${row.original.zip_code}`
          : row.original.city || row.original.zip_code || "—"
      ),
    },
    {
      accessorKey: "estimated_cost",
      header: "Est. Cost",
      cell: ({ row }) => {
        const cost = row.getValue("estimated_cost") as number;
        return cost ? `$${cost.toLocaleString()}` : "—";
      },
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => {
        const date = row.getValue("start_date") as string;
        return date ? new Date(date).toLocaleDateString() : "—";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const project = row.original;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditProject(project)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteProject(project)}
              className="text-red-600 hover:text-red-800"
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout title="Projects Manager" breadcrumbs={[{ label: "Projects" }]}>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading projects data...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Projects Manager" breadcrumbs={[{ label: "Projects" }]}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{projects.length}</p>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{statusStats.in_progress || 0}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{statusStats.completed || 0}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setSelectedStatus("all")}>
                All Projects ({projects.length})
              </TabsTrigger>
              <TabsTrigger value="pending" onClick={() => setSelectedStatus("pending")}>
                Pending ({statusStats.pending || 0})
              </TabsTrigger>
              <TabsTrigger value="in_progress" onClick={() => setSelectedStatus("in_progress")}>
                In Progress ({statusStats.in_progress || 0})
              </TabsTrigger>
              <TabsTrigger value="completed" onClick={() => setSelectedStatus("completed")}>
                Completed ({statusStats.completed || 0})
              </TabsTrigger>
            </TabsList>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProject ? 'Edit' : 'Create'} Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Customer Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="customerName">Customer Name *</Label>
                        <Input
                          id="customerName"
                          value={projectForm.customer_name}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, customer_name: e.target.value }))}
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerEmail">Email</Label>
                        <Input
                          id="customerEmail"
                          type="email"
                          value={projectForm.customer_email}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, customer_email: e.target.value }))}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerPhone">Phone *</Label>
                        <Input
                          id="customerPhone"
                          value={projectForm.customer_phone}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Project Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="projectType">Project Type *</Label>
                        <Select
                          value={projectForm.project_type}
                          onValueChange={(value) => setProjectForm(prev => ({ ...prev, project_type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select project type" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="projectStatus">Status</Label>
                        <Select
                          value={projectForm.project_status}
                          onValueChange={(value) => setProjectForm(prev => ({ ...prev, project_status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {statusConfig[status]?.label || status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Location
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={projectForm.address}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={projectForm.city}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Enter city"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          value={projectForm.zip_code}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, zip_code: e.target.value }))}
                          placeholder="Enter ZIP code"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Project Specifics */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Project Specifics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="squareFootage">Square Footage</Label>
                        <Input
                          id="squareFootage"
                          type="number"
                          value={projectForm.square_footage}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, square_footage: e.target.value }))}
                          placeholder="Enter square footage"
                        />
                      </div>
                      <div>
                        <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                        <Input
                          id="estimatedCost"
                          type="number"
                          value={projectForm.estimated_cost}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, estimated_cost: e.target.value }))}
                          placeholder="Enter estimated cost"
                        />
                      </div>
                      <div>
                        <Label htmlFor="actualCost">Actual Cost ($)</Label>
                        <Input
                          id="actualCost"
                          type="number"
                          value={projectForm.actual_cost}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, actual_cost: e.target.value }))}
                          placeholder="Enter actual cost"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Timeline
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={projectForm.start_date}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, start_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="completionDate">Completion Date</Label>
                        <Input
                          id="completionDate"
                          type="date"
                          value={projectForm.completion_date}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, completion_date: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Notes
                    </h3>
                    <Textarea
                      value={projectForm.notes}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Enter project notes, special requirements, or additional details..."
                      rows={4}
                    />
                  </div>

                  <Button onClick={handleSaveProject} className="w-full">
                    {editingProject ? 'Update' : 'Create'} Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="all" className="space-y-4">
            <DataTable
              columns={columns}
              data={filteredProjects}
              searchPlaceholder="Search projects..."
              title="Projects"
              description="Manage and track all your flooring projects"
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}