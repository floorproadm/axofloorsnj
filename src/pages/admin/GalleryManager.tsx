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
import { 
  FolderOpen, 
  Plus, 
  Image, 
  Edit, 
  Trash2, 
  Star, 
  Upload,
  GripVertical,
  Eye,
  Settings
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
    parent_folder_id: ""
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
        parent_folder_id: ""
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
      parent_folder_id: project.parent_folder_id || ""
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
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{folders.length}</p>
                  <p className="text-sm text-muted-foreground">Folders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Image className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{projects.length}</p>
                  <p className="text-sm text-muted-foreground">Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{projects.filter(p => p.is_featured).length}</p>
                  <p className="text-sm text-muted-foreground">Featured</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{categories.length}</p>
                  <p className="text-sm text-muted-foreground">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="folders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="folders">Folders</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="folders" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Gallery Folders</h3>
              <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingFolder ? 'Edit' : 'Create'} Folder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="folderName">Name</Label>
                      <Input
                        id="folderName"
                        value={folderForm.name}
                        onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter folder name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="folderDescription">Description</Label>
                      <Textarea
                        id="folderDescription"
                        value={folderForm.description}
                        onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter folder description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="folderCover">Cover Image URL</Label>
                      <Input
                        id="folderCover"
                        value={folderForm.cover_image_url}
                        onChange={(e) => setFolderForm(prev => ({ ...prev, cover_image_url: e.target.value }))}
                        placeholder="Enter cover image URL"
                      />
                    </div>
                    <Button onClick={handleSaveFolder} className="w-full">
                      {editingFolder ? 'Update' : 'Create'} Folder
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {folders.map((folder) => (
                <Card key={folder.id} className="relative group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{folder.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getProjectCount(folder.id)} projects
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditFolder(folder)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFolder(folder)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {folder.cover_image_url && (
                      <div className="aspect-video bg-muted rounded-md mb-2 overflow-hidden">
                        <img 
                          src={folder.cover_image_url} 
                          alt={folder.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {folder.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
                    >
                      {selectedFolder === folder.id ? 'Hide Projects' : 'View Projects'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">Gallery Projects</h3>
                {selectedFolder && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFolder(null)}
                  >
                    Show All Projects
                  </Button>
                )}
              </div>
              <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingProject ? 'Edit' : 'Create'} Project</DialogTitle>
                  </DialogHeader>
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
                          <SelectItem value="">No folder</SelectItem>
                          {folders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {folder.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="projectDescription">Description</Label>
                      <Textarea
                        id="projectDescription"
                        value={projectForm.description}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter project description"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="projectImage">Image URL</Label>
                      <Input
                        id="projectImage"
                        value={projectForm.image_url}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, image_url: e.target.value }))}
                        placeholder="Enter image URL"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="projectFeatured"
                          checked={projectForm.is_featured}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                        />
                        <Label htmlFor="projectFeatured">Featured Project</Label>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Button onClick={handleSaveProject} className="w-full">
                        {editingProject ? 'Update' : 'Create'} Project
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="relative group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          {project.is_featured && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {project.category}
                          </Badge>
                          {project.location && (
                            <Badge variant="outline" className="text-xs">
                              {project.location}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFeatured(project)}
                        >
                          <Star className={`w-4 h-4 ${project.is_featured ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProject(project)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProject(project)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.image_url && (
                      <div className="aspect-video bg-muted rounded-md mb-2 overflow-hidden">
                        <img 
                          src={project.image_url} 
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Gallery Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Available Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button variant="outline" onClick={fetchData}>
                      <Upload className="w-4 h-4 mr-2" />
                      Refresh Gallery Data
                    </Button>
                    <Button variant="outline" onClick={() => window.open('/gallery', '_blank')}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Public Gallery
                    </Button>
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