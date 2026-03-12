import React, { useState, useEffect } from "react";
import { AXO_ORG_ID } from "@/lib/constants";
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
  CheckCircle,
  Info
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

export default function GalleryManager({ embedded = false }: { embedded?: boolean }) {
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

  const updateProjectOrder = async (projectId: string, newOrder: string) => {
    try {
      const { error } = await supabase
        .from('gallery_projects')
        .update({ display_order: Number(newOrder) })
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

  const updateFolderOrder = async (folderId: string, newOrder: string) => {
    try {
      const { error } = await supabase
        .from('gallery_folders')
        .update({ display_order: Number(newOrder) })
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
        display_order: editingFolder ? editingFolder.display_order : folders.length,
        organization_id: AXO_ORG_ID,
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
        title: "Sucesso",
        description: `Pasta ${editingFolder ? 'atualizada' : 'criada'} com sucesso`,
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
        display_order: editingProject ? editingProject.display_order : projects.length,
        organization_id: AXO_ORG_ID,
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
        title: "Sucesso",
        description: `Projeto ${editingProject ? 'atualizado' : 'criado'} com sucesso`,
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
    if (!confirm(`Tem certeza que deseja deletar a pasta "${folder.name}"? Isso também deletará todos os projetos desta pasta.`)) {
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
        title: "Sucesso",
        description: "Pasta deletada com sucesso",
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
    if (!confirm(`Tem certeza que deseja deletar o projeto "${project.title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('gallery_projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Projeto deletado com sucesso",
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
        title: "Sucesso",
        description: `Projeto ${!project.is_featured ? 'marcado como destaque' : 'removido dos destaques'}`,
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
    const loadingContent = (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando dados da galeria...</p>
      </div>
    );
    if (embedded) return loadingContent;
    return (
      <AdminLayout title="Gallery Manager" breadcrumbs={[{ label: "Gallery" }]}>
        {loadingContent}
      </AdminLayout>
    );
  }

  const galleryContent = (
    <div className="space-y-6 animate-fade-in overflow-x-hidden">

        <Tabs defaultValue="manage" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/50">
              <TabsTrigger value="manage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FolderOpen className="w-4 h-4 mr-2" />
                Gerenciar Galeria
              </TabsTrigger>
              <TabsTrigger value="upload" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Upload className="w-4 h-4 mr-2" />
                Upload Fotos
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => window.open('/gallery', '_blank')}
                variant="outline"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Galeria Pública
              </Button>
            </div>
          </div>

          <TabsContent value="manage" className="space-y-6 animate-slide-up">
            {/* Folder Management Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5" />
                      Pastas da Galeria
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Organize seus projetos em pastas temáticas
                    </p>
                  </div>
                  
                  <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingFolder(null);
                        setFolderForm({ name: "", description: "", cover_image_url: "" });
                      }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Pasta
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingFolder ? 'Editar Pasta' : 'Criar Nova Pasta'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="folder-name">Nome da Pasta</Label>
                          <Input
                            id="folder-name"
                            value={folderForm.name}
                            onChange={(e) => setFolderForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: Projetos Sala de Estar"
                          />
                        </div>
                        <div>
                          <Label htmlFor="folder-description">Descrição (Opcional)</Label>
                          <Textarea
                            id="folder-description"
                            value={folderForm.description}
                            onChange={(e) => setFolderForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Breve descrição desta pasta..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="folder-cover">Imagem de Capa (Opcional)</Label>
                          <div className="space-y-3">
                            <ImageUploader
                              bucket="gallery"
                              maxFiles={1}
                              maxSize={10}
                              onImageUploaded={(url) => {
                                setFolderForm(prev => ({ ...prev, cover_image_url: url }));
                              }}
                            />
                            {folderForm.cover_image_url && (
                              <div className="relative">
                                <img 
                                  src={folderForm.cover_image_url} 
                                  alt="Preview da capa" 
                                  className="w-full h-40 object-cover rounded-md"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={() => setFolderForm(prev => ({ ...prev, cover_image_url: "" }))}
                                >
                                  Remover
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsFolderDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleSaveFolder}>
                            {editingFolder ? 'Atualizar' : 'Criar'} Pasta
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {folders.length > 0 ? (
                  <DragDropGrid
                    items={folders.map(folder => ({
                      id: folder.id,
                      title: folder.name,
                      description: folder.description || '',
                      imageUrl: folder.cover_image_url || '',
                      category: `${getProjectCount(folder.id)} projetos`,
                      location: '',
                      isFeatured: false,
                      order: folder.display_order
                    }))}
                    onReorder={(oldIndex, newIndex) => {
                      // Get the item that was moved
                      const movedItem = folders[oldIndex];
                      if (movedItem) {
                        updateFolderOrder(movedItem.id, newIndex.toString());
                      }
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
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma pasta criada ainda</p>
                    <p className="text-sm">Crie sua primeira pasta para organizar os projetos</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Management Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="w-5 h-5" />
                      Projetos da Galeria
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Gerencie e organize todos os seus projetos
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select value={selectedFolder || "all"} onValueChange={(value) => setSelectedFolder(value === "all" ? null : value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filtrar por pasta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Projetos</SelectItem>
                        <SelectItem value="none">Sem Pasta</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => {
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
                        }}>
                          <Plus className="w-4 h-4 mr-2" />
                          Novo Projeto
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {editingProject ? 'Editar Projeto' : 'Criar Novo Projeto'}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="project-title">Título do Projeto</Label>
                              <Input
                                id="project-title"
                                value={projectForm.title}
                                onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Ex: Piso de Carvalho Elegante"
                              />
                            </div>
                            <div>
                              <Label htmlFor="project-location">Localização</Label>
                              <Input
                                id="project-location"
                                value={projectForm.location}
                                onChange={(e) => setProjectForm(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="Ex: São Paulo, SP"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="project-description">Descrição</Label>
                            <Textarea
                              id="project-description"
                              value={projectForm.description}
                              onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Descreva os detalhes do projeto..."
                              rows={3}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="project-category">Categoria</Label>
                              <Select value={projectForm.category} onValueChange={(value) => setProjectForm(prev => ({ ...prev, category: value }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar categoria" />
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
                              <Label htmlFor="project-folder">Pasta</Label>
                              <Select value={projectForm.parent_folder_id} onValueChange={(value) => setProjectForm(prev => ({ ...prev, parent_folder_id: value }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar pasta" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Sem Pasta</SelectItem>
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
                            <Label htmlFor="project-image">URL da Imagem</Label>
                            <Input
                              id="project-image"
                              value={projectForm.image_url}
                              onChange={(e) => setProjectForm(prev => ({ ...prev, image_url: e.target.value }))}
                              placeholder="https://exemplo.com/imagem-projeto.jpg"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="project-featured"
                              checked={projectForm.is_featured}
                              onChange={(e) => setProjectForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                            />
                            <Label htmlFor="project-featured">Projeto em Destaque</Label>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleSaveProject}>
                              {editingProject ? 'Atualizar' : 'Criar'} Projeto
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedFolder && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    <span className="text-sm">
                      Mostrando projetos da pasta: <strong>{folders.find(f => f.id === selectedFolder)?.name}</strong>
                    </span>
                    <Badge variant="secondary" className="ml-auto">
                      {filteredProjects.length} projetos
                    </Badge>
                  </div>
                )}
                
                {filteredProjects.length > 0 ? (
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
                      // Get the item that was moved
                      const movedItem = filteredProjects[oldIndex];
                      if (movedItem) {
                        updateProjectOrder(movedItem.id, newIndex.toString());
                      }
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
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>
                      {selectedFolder 
                        ? 'Nenhum projeto nesta pasta. Adicione itens para alimentar o portfolio.' 
                        : 'Nenhum projeto criado. Sem portfolio, sem prova social.'
                      }
                    </p>
                    <p className="text-sm">
                      {selectedFolder 
                        ? 'Use o upload de fotos para adicionar projetos a esta pasta'
                        : 'Crie seu primeiro projeto ou use o upload de fotos'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6 animate-slide-up">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload de Múltiplas Fotos
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Faça upload de várias fotos de uma vez para uma pasta específica
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <Card className="border-dashed">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <FolderOpen className="w-4 h-4" />
                          Selecionar Pasta
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {folders.length > 0 ? (
                          <>
                            <Select value={selectedFolder || ""} onValueChange={setSelectedFolder}>
                              <SelectTrigger>
                                <SelectValue placeholder="Escolha uma pasta" />
                              </SelectTrigger>
                              <SelectContent>
                                {folders.map((folder) => (
                                  <SelectItem key={folder.id} value={folder.id}>
                                    {folder.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {selectedFolder && (
                              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                <h4 className="font-medium">
                                  {folders.find(f => f.id === selectedFolder)?.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {getProjectCount(selectedFolder)} projetos existentes
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground">
                              Você precisa criar uma pasta primeiro
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Área de Upload
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedFolder ? (
                          <ImageUploader
                            bucket="gallery"
                            acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']}
                            onImageUploaded={(url) => {
                              // Auto-create project for each uploaded image
                              const fileName = url.split('/').pop()?.split('.')[0] || 'Novo Projeto';
                              const projectData = {
                                title: fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                description: `Projeto criado via upload automático`,
                                category: categories[0], // Default to first category
                                location: '',
                                image_url: url,
                                is_featured: false,
                                parent_folder_id: selectedFolder,
                                display_order: projects.length
                              };

                              supabase
                                .from('gallery_projects')
                                .insert([projectData])
                                .then(({ error }) => {
                                  if (error) {
                                    console.error('Error creating project:', error);
                                    toast({
                                      title: "Erro",
                                      description: "Falha ao criar projeto automaticamente",
                                      variant: "destructive",
                                    });
                                  } else {
                                    toast({
                                      title: "Sucesso",
                                      description: "Projeto criado automaticamente!",
                                    });
                                    // Atualizar apenas o estado local para manter na página atual
                                    setProjects(prev => [...prev, { 
                                      id: crypto.randomUUID(), // Temporary ID
                                      ...projectData,
                                      created_at: new Date().toISOString(),
                                      updated_at: new Date().toISOString()
                                    }]);
                                  }
                                });
                            }}
                            maxFiles={10}
                            maxSize={10 * 1024 * 1024} // 10MB
                          />
                        ) : (
                          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                            <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Selecione uma pasta primeiro para fazer upload das fotos</p>
                            <p className="text-sm">Cada foto será automaticamente convertida em um projeto</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {selectedFolder && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Info className="w-3 h-3 text-white" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 mb-1">Como funciona o upload automático:</p>
                        <ul className="text-blue-800 space-y-1">
                          <li>• Cada foto enviada vira automaticamente um projeto</li>
                          <li>• O nome do arquivo vira o título do projeto</li>
                          <li>• Você pode editar os detalhes depois na aba "Gerenciar Galeria"</li>
                          <li>• Aceita JPEG, PNG, WebP, HEIC e HEIF (máximo 10MB cada)</li>
                          <li>• Máximo de 10 fotos por vez</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );

  if (embedded) return galleryContent;

  return (
    <AdminLayout title="Gerenciador da Galeria" breadcrumbs={[{ label: "Galeria" }]}>
      {galleryContent}
    </AdminLayout>
  );
}