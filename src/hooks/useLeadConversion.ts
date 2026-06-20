import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseLeadConversionReturn {
  /** Legacy signature kept for backwards compat. Calls the new full-conversion RPC. */
  convertLeadToProject: (leadId: string, _projectType?: string) => Promise<string | null>;
  convertLeadToFullProject: (leadId: string) => Promise<string | null>;
  isConverting: boolean;
}

export function useLeadConversion(): UseLeadConversionReturn {
  const [isConverting, setIsConverting] = useState(false);

  const convertLeadToFullProject = useCallback(async (leadId: string): Promise<string | null> => {
    setIsConverting(true);
    try {
      const { data, error } = await supabase.rpc('convert_lead_to_full_project' as any, {
        p_lead_id: leadId,
      });
      if (error) {
        const msg = error.message?.replace(/^.*?ERROR:\s*/, '') || error.message;
        toast.error(`Erro na conversão: ${msg}`);
        return null;
      }
      const projectId = data as string;
      toast.success('Cliente e projeto criados com sucesso!');
      return projectId;
    } catch (err) {
      console.error('Conversion RPC exception:', err);
      toast.error('Falha ao converter lead');
      return null;
    } finally {
      setIsConverting(false);
    }
  }, []);

  const convertLeadToProject = useCallback(
    (leadId: string) => convertLeadToFullProject(leadId),
    [convertLeadToFullProject]
  );

  return { convertLeadToProject, convertLeadToFullProject, isConverting };
}
