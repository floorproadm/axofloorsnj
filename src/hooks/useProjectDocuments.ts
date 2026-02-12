import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const DOCUMENT_FOLDERS = [
  { value: 'photos', label: 'Fotos' },
  { value: 'contracts', label: 'Contratos' },
  { value: 'drawings', label: 'Desenhos' },
  { value: 'specifications', label: 'Especificações' },
  { value: 'communication', label: 'Comunicação' },
  { value: 'other', label: 'Outros' },
] as const;

export type DocumentFolder = typeof DOCUMENT_FOLDERS[number]['value'];

export interface ProjectDocument {
  id: string;
  project_id: string;
  folder: string;
  file_name: string;
  file_type: string;
  file_url: string;
  uploaded_by: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export function useProjectDocuments(projectId: string | undefined, folder?: string) {
  return useQuery({
    queryKey: ['project-documents', projectId, folder],
    queryFn: async (): Promise<ProjectDocument[]> => {
      if (!projectId) return [];
      let query = supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (folder && folder !== 'all') {
        query = query.eq('folder', folder);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ProjectDocument[];
    },
    enabled: !!projectId,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      projectId,
      folder,
      file,
    }: {
      projectId: string;
      folder: DocumentFolder;
      file: File;
    }) => {
      const ext = file.name.split('.').pop() || 'bin';
      const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storagePath = `${projectId}/${folder}/${safeName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(storagePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Get signed URL (private bucket)
      const { data: urlData } = await supabase.storage
        .from('project-documents')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 year

      const fileUrl = urlData?.signedUrl || storagePath;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Insert record
      const { data, error } = await supabase
        .from('project_documents')
        .insert({
          project_id: projectId,
          folder,
          file_name: file.name,
          file_type: file.type || 'application/octet-stream',
          file_url: fileUrl,
          uploaded_by: user?.id || null,
          source: 'admin_upload',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', data.project_id] });
      toast({ title: '✓ Documento enviado' });
    },
    onError: (err) => {
      toast({
        title: 'Erro no upload',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (doc: ProjectDocument) => {
      // Extract storage path from URL or use direct path
      const storagePath = `${doc.project_id}/${doc.folder}/${doc.file_url.split('/').pop()}`;

      // Delete from storage (best effort)
      await supabase.storage.from('project-documents').remove([storagePath]);

      // Delete record
      const { error } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;
      return doc;
    },
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', doc.project_id] });
      toast({ title: '✓ Documento removido' });
    },
    onError: (err) => {
      toast({
        title: 'Erro ao remover',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    },
  });
}
