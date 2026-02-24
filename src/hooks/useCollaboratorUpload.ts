import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CollaboratorUploadParams {
  file: File;
  projectId: string;
  folderType?: "job_progress" | "before_after";
  metadata?: Record<string, unknown>;
}

interface CollaboratorUploadResult {
  id: string;
  storage_path: string;
  created_at: string;
}

export function useCollaboratorUpload() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CollaboratorUploadParams): Promise<CollaboratorUploadResult> => {
      if (!session?.access_token) {
        throw new Error("Não autenticado");
      }

      const formData = new FormData();
      formData.append("file", params.file);
      formData.append("projectId", params.projectId);
      formData.append("folderType", params.folderType || "job_progress");
      if (params.metadata) {
        formData.append("metadata", JSON.stringify(params.metadata));
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/collaborator-upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro no upload");
      }

      return data as CollaboratorUploadResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-files"] });
      toast({ title: "Foto enviada com sucesso" });
    },
    onError: (err: Error) => {
      toast({
        title: "Erro no upload",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}
