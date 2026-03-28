import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { LeadControlModal } from '@/components/admin/LeadControlModal';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function LeadDetail() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();

  const { data: lead, isLoading, refetch } = useQuery({
    queryKey: ['lead-detail', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      if (error) throw error;
      return {
        ...data,
        services: Array.isArray(data.services) ? data.services as string[] : [],
        follow_up_actions: Array.isArray(data.follow_up_actions) ? data.follow_up_actions as any[] : [],
      };
    },
    enabled: !!leadId,
  });

  return (
    <AdminLayout title="Lead Detail">
      <div className="p-4 sm:p-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-1.5"
          onClick={() => navigate('/admin/leads')}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Leads & Vendas
        </Button>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !lead ? (
          <div className="text-center py-20 text-muted-foreground">
            Lead não encontrado
          </div>
        ) : (
          <LeadControlModal
            lead={lead}
            isOpen={true}
            onClose={() => navigate('/admin/leads')}
            onRefresh={refetch}
            embedded
          />
        )}
      </div>
    </AdminLayout>
  );
}
