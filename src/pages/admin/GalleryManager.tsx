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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { DragDropGrid } from "@/components/admin/DragDropGrid";
import { 
  FolderOpen, 
  Plus, 
  Image, 
  Star, 
  Upload,
  Eye,
  Settings,
  Sparkles,
  TrendingUp
} from "lucide-react";

interface GalleryProject {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  image_url: string;
  display_order: number;
  is_featured: boolean;
  folder_name?: string;
  parent_folder_id?: string;
  created_at: string;
  updated_at: string;
}

interface GalleryFolder {
  id: string;
  name: string;
  description: string;
  cover_image_url: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const categories = [
  "Hardwood Flooring",
  "Sanding & Refinish", 
  "Before and After",
  "Vinyl Plank",
  "Staircase",
  "Baseboards & Trim",
  "Commercial"
];

export default function GalleryManager() {
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<GalleryFolder | null>(null);
  const [editingProject, setEditingProject] = useState<GalleryProject | null>(null);
  const { toast } = useToast();

  // Form states
  const [folderForm, setFolderForm] = useState({
    name: "",
    description: "",
    cover_image_url: ""
  });

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    image_url: "",
    is_featured: false,
    parent_folder_id: "none"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('gallery_folders')
        .select('*')
        .order('display_order', { ascending: true });

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('gallery_projects')
        .select('*')
        .order('display_order', { ascending: true });

      if (foldersError) throw foldersError;
      if (projectsError) throw projectsError;

      setFolders(foldersData || []);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching gallery data:', error);
      toast({
        title: "Error",
        description: "Failed to load gallery data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProjectOrder = async (projectId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('gallery_projects')
        .update({ display_order: newOrder })
        .eq('id', projectId);

      if (error) throw error;

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating project order:', error);
      toast({
        title: "Error",
        description: "Failed to update project order",
        variant: "destructive",
      });
    }
  };

  const updateFolderOrder = async (folderId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('gallery_folders')
        .update({ display_order: newOrder })
        .eq('id', folderId);

      if (error) throw error;

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating folder order:', error);
      toast({
        title: "Error",
        description: "Failed to update folder order",
        variant: "destructive",
      });
    }
  };

  const handleSaveFolder = async () => {
    try {
      if (!folderForm.name.trim()) {
        toast({
          title: "Error",
          description: "Folder name is required",
          variant: "destructive",
        });
        return;
      }

      const folderData = {
        ...folderForm,
        display_order: editingFolder ? editingFolder.display_order : folders.length
      };

      let result;
      if (editingFolder) {
        result = await supabase
          .from('gallery_folders')
          .update(folderData)
          .eq('id', editingFolder.id);
      } else {
        result = await supabase
          .from('gallery_folders')
          .insert([folderData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Folder ${editingFolder ? 'updated' : 'created'} successfully`,
      });

      setIsFolderDialogOpen(false);
      setEditingFolder(null);
      setFolderForm({ name: "", description: "", cover_image_url: "" });
      fetchData();
    } catch (error) {
      console.error('Error saving folder:', error);
      toast({
        title: "Error",
        description: "Failed to save folder",
        variant: "destructive",
      });
    }
  };

  const handleSaveProject = async () => {
    try {
      if (!projectForm.title.trim() || !projectForm.category) {
        toast({
          title: "Error",
          description: "Title and category are required",
          variant: "destructive",
        });
        return;
      }

      const projectData = {
        ...projectForm,
        parent_folder_id: projectForm.parent_folder_id === "none" ? null : projectForm.parent_folder_id,
        display_order: editingProject ? editingProject.display_order : projects.length
      };

      let result;
      if (editingProject) {
        result = await supabase
          .from('gallery_projects')
          .update(projectData)
          .eq('id', editingProject.id);
      } else {
        result = await supabase
          .from('gallery_projects')
          .insert([projectData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Project ${editingProject ? 'updated' : 'created'} successfully`,
      });

      setIsProjectDialogOpen(false);
      setEditingProject(null);
      setProjectForm({
        title: "",
        description: "",
        category: "",
        location: "",
        image_url: "",
        is_featured: false,
        parent_folder_id: "none"
      });
      fetchData();
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFolder = async (folder: GalleryFolder) => {
    if (!confirm(`Are you sure you want to delete the folder "${folder.name}"? This will also delete all projects in this folder.`)) {
      return;
    }

    try {
      // First delete all projects in this folder
      await supabase
        .from('gallery_projects')
        .delete()
        .eq('parent_folder_id', folder.id);

      // Then delete the folder
      const { error } = await supabase
        .from('gallery_folders')
        .delete()
        .eq('id', folder.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (project: GalleryProject) => {
    if (!confirm(`Are you sure you want to delete the project "${project.title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('gallery_projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const handleEditFolder = (folder: GalleryFolder) => {
    setEditingFolder(folder);
    setFolderForm({
      name: folder.name,
      description: folder.description || "",
      cover_image_url: folder.cover_image_url || ""
    });
    setIsFolderDialogOpen(true);
  };

  const handleEditProject = (project: GalleryProject) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description,
      category: project.category,
      location: project.location,
      image_url: project.image_url,
      is_featured: project.is_featured,
      parent_folder_id: project.parent_folder_id || "none"
    });
    setIsProjectDialogOpen(true);
  };

  const toggleFeatured = async (project: GalleryProject) => {
    try {
      const { error } = await supabase
        .from('gallery_projects')
        .update({ is_featured: !project.is_featured })
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Project ${!project.is_featured ? 'marked as featured' : 'unmarked as featured'}`,
      });

      fetchData();
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const filteredProjects = selectedFolder 
    ? projects.filter(p => p.parent_folder_id === selectedFolder)
    : projects;

  const getProjectCount = (folderId: string) => {
    return projects.filter(p => p.parent_folder_id === folderId).length;
  };

  if (isLoading) {
    return (
      <AdminLayout title="Gallery Manager" breadcrumbs={[{ label: "Gallery" }]}>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading gallery data...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gallery Manager" breadcrumbs={[{ label: "Gallery" }]}>
      <div className="space-y-6 animate-fade-in">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="admin-stat-card admin-gradient">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="dashboard-metric text-white">{folders.length}</p>
                  <p className="text-white/80 text-sm font-medium">Gallery Folders</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <FolderOpen className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="admin-stat-card gold-gradient">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="dashboard-metric text-navy">{projects.length}</p>
                  <p className="text-navy/80 text-sm font-medium">Total Projects</p>
                </div>
                <div className="p-3 bg-navy/20 rounded-full">
                  <Image className="w-8 h-8 text-navy" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-stat-card bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="dashboard-metric text-white">{projects.filter(p => p.is_featured).length}</p>
                  <p className="text-white/80 text-sm font-medium">Featured Projects</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Star className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-stat-card bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="dashboard-metric text-white">{categories.length}</p>
                  <p className="text-white/80 text-sm font-medium">Categories</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Eye className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="folders" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-muted/50">
              <TabsTrigger value="folders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FolderOpen className="w-4 h-4 mr-2" />
                Folders
              </TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Image className="w-4 h-4 mr-2" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="bulk-upload" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="animate-pulse">
                <Sparkles className="w-3 h-3 mr-1" />
                Live Updates
              </Badge>
            </div>
          </div>

          <TabsContent value="folders" className="space-y-6 animate-slide-up">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-navy">Gallery Folders</h3>
                  <p className="text-sm text-muted-foreground">Organize your projects into folders</p>
                </div>
              </div>
              <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gold-gradient hover-scale">
                    <Plus className="w-4 h-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl animate-scale-in">
                  <DialogHeader>
                    <DialogTitle className="text-navy flex items-center gap-2">
                      <FolderOpen className="w-5 h-5" />
                      {editingFolder ? 'Edit' : 'Create'} Folder
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="form-section">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="folderName" className="text-navy font-medium">Folder Name</Label>
                          <Input
                            id="folderName"
                            value={folderForm.name}
                            onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter folder name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="folderCover" className="text-navy font-medium">Cover Image URL</Label>
                          <Input
                            id="folderCover"
                            value={folderForm.cover_image_url}
                            onChange={(e) => setFolderForm(prev => ({ ...prev, cover_image_url: e.target.value }))}
                            placeholder="Enter cover image URL"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="folderDescription" className="text-navy font-medium">Description</Label>
                        <Textarea
                          id="folderDescription"
                          value={folderForm.description}
                          onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter folder description"
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="form-section">
                      <h4 className="form-section-title">
                        <Upload className="w-5 h-5" />
                        Upload Cover Image
                      </h4>
                      <ImageUploader
                        onImageUploaded={(url) => setFolderForm(prev => ({ ...prev, cover_image_url: url }))}
                        maxFiles={1}
                      />
                    </div>
                    <Button onClick={handleSaveFolder} className="w-full gold-gradient hover-scale">
                      {editingFolder ? 'Update' : 'Create'} Folder
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <DragDropGrid
              items={folders.map(folder => ({
                id: folder.id,
                title: folder.name,
                description: folder.description,
                imageUrl: folder.cover_image_url,
                order: folder.display_order
              }))}
              onReorder={(oldIndex, newIndex) => {
                const folderId = folders[oldIndex].id;
                updateFolderOrder(folderId, newIndex);
              }}
              onEdit={(item) => {
                const folder = folders.find(f => f.id === item.id);
                if (folder) handleEditFolder(folder);
              }}
              onDelete={(item) => {
                const folder = folders.find(f => f.id === item.id);
                if (folder) handleDeleteFolder(folder);
              }}
              type="folder"
            />
          </TabsContent>

          <TabsContent value="projects" className="space-y-6 animate-slide-up">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Image className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-navy">Gallery Projects</h3>
                    <p className="text-sm text-muted-foreground">Manage your project portfolio</p>
                  </div>
                </div>
                {selectedFolder && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFolder(null)}
                    className="hover-scale"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Show All Projects
                  </Button>
                )}
              </div>
              <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gold-gradient hover-scale">
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingProject ? 'Edit' : 'Create'} Project</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="projectTitle">Title</Label>
                        <Input
                          id="projectTitle"
                          value={projectForm.title}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter project title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="projectCategory">Category</Label>
                        <Select
                          value={projectForm.category}
                          onValueChange={(value) => setProjectForm(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
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
                        <Label htmlFor="projectLocation">Location</Label>
                        <Input
                          id="projectLocation"
                          value={projectForm.location}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Enter project location"
                        />
                      </div>
                      <div>
                        <Label htmlFor="projectFolder">Folder</Label>
                        <Select
                          value={projectForm.parent_folder_id}
                          onValueChange={(value) => setProjectForm(prev => ({ ...prev, parent_folder_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select folder" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No folder</SelectItem>
                            {folders.map((folder) => (
                              <SelectItem key={folder.id} value={folder.id}>
                                {folder.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="projectDescription">Description</Label>
                      <Textarea
                        id="projectDescription"
                        value={projectForm.description}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter project description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectImage">Image URL</Label>
                      <Input
                        id="projectImage"
                        value={projectForm.image_url}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, image_url: e.target.value }))}
                        placeholder="Enter image URL"
                      />
                    </div>
                    <div>
                      <Label>Upload Project Image</Label>
                      <ImageUploader
                        onImageUploaded={(url) => setProjectForm(prev => ({ ...prev, image_url: url }))}
                        maxFiles={1}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="projectFeatured"
                        checked={projectForm.is_featured}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                      />
                      <Label htmlFor="projectFeatured">Featured Project</Label>
                    </div>
                    <Button onClick={handleSaveProject} className="w-full">
                      {editingProject ? 'Update' : 'Create'} Project
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <DragDropGrid
              items={filteredProjects.map(project => ({
                id: project.id,
                title: project.title,
                description: project.description,
                imageUrl: project.image_url,
                category: project.category,
                location: project.location,
                isFeatured: project.is_featured,
                order: project.display_order
              }))}
              onReorder={(oldIndex, newIndex) => {
                const projectId = filteredProjects[oldIndex].id;
                updateProjectOrder(projectId, newIndex);
              }}
              onEdit={(item) => {
                const project = projects.find(p => p.id === item.id);
                if (project) handleEditProject(project);
              }}
              onDelete={(item) => {
                const project = projects.find(p => p.id === item.id);
                if (project) handleDeleteProject(project);
              }}
              onToggleFeatured={(item) => {
                const project = projects.find(p => p.id === item.id);
                if (project) toggleFeatured(project);
              }}
              type="project"
            />
          </TabsContent>

          <TabsContent value="bulk-upload" className="space-y-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-navy">Bulk Photo Upload</h3>
                <p className="text-sm text-muted-foreground">Upload multiple photos to a folder at once</p>
              </div>
            </div>

            <Card className="admin-card">
              <CardHeader>
                <CardTitle className="text-navy">Select Target Folder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="targetFolder">Choose folder to upload photos to:</Label>
                  <Select
                    value={selectedFolder || ""}
                    onValueChange={(value) => setSelectedFolder(value || null)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a folder" />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name} ({getProjectCount(folder.id)} photos)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedFolder && (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/5 rounded-lg">
                      <h4 className="font-medium text-navy mb-2">Upload Photos to: {folders.find(f => f.id === selectedFolder)?.name}</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Each photo will be automatically created as a project in this folder
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="bulkCategory">Default Category</Label>
                          <Select
                            value={projectForm.category}
                            onValueChange={(value) => setProjectForm(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
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
                          <Label htmlFor="bulkLocation">Default Location</Label>
                          <Input
                            id="bulkLocation"
                            value={projectForm.location}
                            onChange={(e) => setProjectForm(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Enter default location"
                          />
                        </div>
                      </div>

                      <ImageUploader
                        onImageUploaded={async (url) => {
                          try {
                            const fileName = url.split('/').pop() || 'Uploaded Photo';
                            const projectData = {
                              title: fileName.split('.')[0].replace(/[-_]/g, ' '),
                              description: `Photo uploaded to ${folders.find(f => f.id === selectedFolder)?.name}`,
                              category: projectForm.category || categories[0],
                              location: projectForm.location || '',
                              image_url: url,
                              is_featured: false,
                              parent_folder_id: selectedFolder,
                              display_order: projects.filter(p => p.parent_folder_id === selectedFolder).length
                            };

                            const { error } = await supabase
                              .from('gallery_projects')
                              .insert([projectData]);

                            if (error) throw error;

                            toast({
                              title: "Success",
                              description: `Photo "${projectData.title}" added to folder`,
                            });

                            fetchData();
                          } catch (error) {
                            console.error('Error creating project from upload:', error);
                            toast({
                              title: "Error",
                              description: "Failed to create project from uploaded photo",
                              variant: "destructive",
                            });
                          }
                        }}
                        maxFiles={10}
                        bucket="gallery"
                      />
                    </div>
                  </div>
                )}

                {!selectedFolder && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a folder above to start uploading photos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 animate-slide-up">
            <Card className="admin-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-navy">
                  <Settings className="w-5 h-5" />
                  Gallery Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="form-section">
                  <h4 className="form-section-title">
                    <Eye className="w-5 h-5" />
                    Available Categories
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge key={category} variant="secondary" className="hover-scale">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="form-section">
                  <h4 className="form-section-title">
                    <TrendingUp className="w-5 h-5" />
                    Quick Actions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" onClick={fetchData} className="hover-lift">
                      <Upload className="w-4 h-4 mr-2" />
                      Refresh Gallery Data
                    </Button>
                    <Button variant="outline" onClick={() => window.open('/gallery', '_blank')} className="hover-lift">
                      <Eye className="w-4 h-4 mr-2" />
                      View Public Gallery
                    </Button>
                  </div>
                </div>
                
                <div className="form-section">
                  <h4 className="form-section-title">
                    <Sparkles className="w-5 h-5" />
                    Gallery Statistics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <p className="dashboard-metric">{folders.length}</p>
                      <p className="dashboard-label">Total Folders</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="dashboard-metric text-green-600">{projects.filter(p => p.is_featured).length}</p>
                      <p className="dashboard-label">Featured</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="dashboard-metric text-blue-600">{projects.length}</p>
                      <p className="dashboard-label">Projects</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="dashboard-metric text-purple-600">{categories.length}</p>
                      <p className="dashboard-label">Categories</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}