import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Upload, Plus, Trash2, Edit, Eye, EyeOff, LogOut, User, Users, FileText } from "lucide-react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";

interface GalleryProject {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  image_url: string;
  display_order: number;
  is_featured: boolean;
}

interface QuizResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  room_size: string;
  services: any; // Json type from Supabase
  budget: number;
  source: string;
  created_at: string;
}

const Admin = () => {
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [quizResponses, setQuizResponses] = useState<QuizResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    is_featured: false,
    display_order: 0
  });

  const categories = [
    "Hardwood Flooring",
    "Sanding & Refinish", 
    "Vinyl Plank",
    "Staircase",
    "Baseboards & Trim"
  ];

  useEffect(() => {
    fetchProjects();
    fetchQuizResponses();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_projects')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load gallery projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuizResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizResponses(data || []);
    } catch (error) {
      console.error('Error fetching quiz responses:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz responses",
        variant: "destructive",
      });
    }
  };

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
    <div className="min-h-screen">
      <Header />
      
      {/* User Info and Logout */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-gold text-black rounded-full">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">Área Administrativa</p>
                <p className="text-sm text-muted-foreground">
                  Logado como: {user?.email}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={signOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-heading text-navy mb-2">
            Área Administrativa
          </h1>
          <p className="text-grey">
            Gerencie projetos da galeria e leads do quiz
          </p>
        </div>

        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Quiz Leads ({quizResponses.length})
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Gallery Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Quiz Leads
                  <Button onClick={fetchQuizResponses} variant="outline" size="sm">
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quizResponses.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-grey/50 mb-4" />
                    <p className="text-grey">Nenhum lead encontrado ainda</p>
                    <p className="text-sm text-grey/70">Os leads aparecerão aqui quando alguém completar o quiz</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quizResponses.map((response) => (
                      <Card key={response.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <h3 className="font-semibold text-navy">{response.name}</h3>
                            <p className="text-sm text-grey">{response.email}</p>
                            <p className="text-sm text-grey">{response.phone}</p>
                            {response.city && (
                              <p className="text-sm text-grey">{response.city}</p>
                            )}
                          </div>
                          <div>
                            <div className="space-y-1">
                              <p className="text-sm">
                                <strong>Serviço:</strong> {Array.isArray(response.services) ? response.services.join(', ') : response.services}
                              </p>
                              <p className="text-sm">
                                <strong>Área:</strong> {response.room_size} sq ft
                              </p>
                              <p className="text-sm">
                                <strong>Orçamento:</strong> ${response.budget?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-2">
                              {response.source}
                            </Badge>
                            <p className="text-xs text-grey">
                              {new Date(response.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
      
      <Footer />
    </div>
  );
};

export default Admin;