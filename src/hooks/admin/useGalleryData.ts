import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GalleryProject {
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

export interface GalleryFolder {
  id: string;
  name: string;
  description: string;
  cover_image_url: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface GalleryDataState {
  projects: GalleryProject[];
  folders: GalleryFolder[];
  isLoading: boolean;
  error: string | null;
}

export const useGalleryData = () => {
  const [state, setState] = useState<GalleryDataState>({
    projects: [],
    folders: [],
    isLoading: true,
    error: null,
  });

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

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

      setState({
        folders: foldersData || [],
        projects: projectsData || [],
        isLoading: false,
        error: null,
      });

    } catch (error) {
      console.error('Error fetching gallery data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load gallery data',
      }));

      toast({
        title: "Error",
        description: "Failed to load gallery data",
        variant: "destructive",
      });
    }
  };

  const updateProjectOrder = async (projectId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('gallery_projects')
        .update({ display_order: newOrder })
        .eq('id', projectId);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(project =>
          project.id === projectId
            ? { ...project, display_order: newOrder }
            : project
        ).sort((a, b) => a.display_order - b.display_order),
      }));

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

      // Update local state
      setState(prev => ({
        ...prev,
        folders: prev.folders.map(folder =>
          folder.id === folderId
            ? { ...folder, display_order: newOrder }
            : folder
        ).sort((a, b) => a.display_order - b.display_order),
      }));

    } catch (error) {
      console.error('Error updating folder order:', error);
      toast({
        title: "Error",
        description: "Failed to update folder order",
        variant: "destructive",
      });
    }
  };

  const toggleFeatured = async (projectId: string) => {
    try {
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return;

      const { error } = await supabase
        .from('gallery_projects')
        .update({ is_featured: !project.is_featured })
        .eq('id', projectId);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === projectId
            ? { ...p, is_featured: !p.is_featured }
            : p
        ),
      }));

      toast({
        title: "Success",
        description: `Project ${!project.is_featured ? 'marked as featured' : 'unmarked as featured'}`,
      });

    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const reorderProjects = (oldIndex: number, newIndex: number, folderId?: string) => {
    const filteredProjects = folderId 
      ? state.projects.filter(p => p.parent_folder_id === folderId)
      : state.projects.filter(p => !p.parent_folder_id);

    const newProjects = [...filteredProjects];
    const [removed] = newProjects.splice(oldIndex, 1);
    newProjects.splice(newIndex, 0, removed);

    // Update display orders
    newProjects.forEach((project, index) => {
      updateProjectOrder(project.id, index);
    });
  };

  const reorderFolders = (oldIndex: number, newIndex: number) => {
    const newFolders = [...state.folders];
    const [removed] = newFolders.splice(oldIndex, 1);
    newFolders.splice(newIndex, 0, removed);

    // Update display orders
    newFolders.forEach((folder, index) => {
      updateFolderOrder(folder.id, index);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    ...state,
    fetchData,
    updateProjectOrder,
    updateFolderOrder,
    toggleFeatured,
    reorderProjects,
    reorderFolders,
  };
};