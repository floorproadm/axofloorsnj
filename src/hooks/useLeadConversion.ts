import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseLeadConversionReturn {
  convertLeadToProject: (leadId: string, projectType: string) => Promise<string | null>;
  isConverting: boolean;
}

export function useLeadConversion(): UseLeadConversionReturn {
  const { toast } = useToast();
  const [isConverting, setIsConverting] = useState(false);

  const convertLeadToProject = useCallback(async (
    leadId: string,
    projectType: string
  ): Promise<string | null> => {
    setIsConverting(true);

    try {
      const { data, error } = await supabase.rpc('convert_lead_to_project', {
        p_lead_id: leadId,
        p_project_type: projectType
      });

      if (error) {
        const msg = error.message?.replace(/^.*?ERROR:\s*/, '') || error.message;
        toast({
          title: "Erro na Conversão",
          description: msg,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "✓ Projeto Criado",
        description: "Lead convertido para projeto com sucesso. Customer + Project + Job Costs criados.",
      });

      return data as string;
    } catch (err) {
      console.error('Conversion RPC exception:', err);
      toast({
        title: "Erro",
        description: "Falha ao converter lead para projeto",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsConverting(false);
    }
  }, [toast]);

  return {
    convertLeadToProject,
    isConverting
  };
}
