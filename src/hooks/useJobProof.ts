import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface JobProof {
  id: string;
  project_id: string;
  before_image_url: string | null;
  after_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProofValidation {
  can_complete: boolean;
  error_message: string | null;
  has_before_image: boolean;
  has_after_image: boolean;
}

export const useJobProof = (projectId: string) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const fetchProofs = async (): Promise<JobProof[]> => {
    const { data, error } = await supabase
      .from('job_proof')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching proofs:', error);
      return [];
    }
    return data || [];
  };

  const validateCompletion = async (): Promise<ProofValidation> => {
    const { data, error } = await supabase
      .rpc('validate_project_completion', { p_project_id: projectId });

    if (error) {
      console.error('Error validating completion:', error);
      return {
        can_complete: false,
        error_message: 'Erro ao validar requisitos de conclusão',
        has_before_image: false,
        has_after_image: false
      };
    }

    const result = data?.[0];
    return {
      can_complete: result?.can_complete ?? false,
      error_message: result?.error_message ?? null,
      has_before_image: result?.has_before_image ?? false,
      has_after_image: result?.has_after_image ?? false
    };
  };

  const uploadImage = async (
    file: File,
    type: 'before' | 'after'
  ): Promise<string | null> => {
    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${type}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('job-proof')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('job-proof')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível enviar a imagem',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const addProof = async (
    beforeUrl: string | null,
    afterUrl: string | null
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('job_proof')
      .insert({
        project_id: projectId,
        before_image_url: beforeUrl,
        after_image_url: afterUrl
      });

    if (error) {
      console.error('Error adding proof:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o registro de prova',
        variant: 'destructive'
      });
      return false;
    }

    toast({
      title: 'Prova registrada',
      description: 'Imagem salva com sucesso'
    });
    return true;
  };

  const updateProof = async (
    proofId: string,
    updates: Partial<Pick<JobProof, 'before_image_url' | 'after_image_url'>>
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('job_proof')
      .update(updates)
      .eq('id', proofId);

    if (error) {
      console.error('Error updating proof:', error);
      return false;
    }

    toast({
      title: 'Prova atualizada',
      description: 'Imagem atualizada com sucesso'
    });
    return true;
  };

  return {
    fetchProofs,
    validateCompletion,
    uploadImage,
    addProof,
    updateProof,
    isUploading
  };
};
