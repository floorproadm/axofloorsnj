import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
// JobControlModal is not exported — we import the whole module and use the default export's internal
// We need to extract JobControlModal. For now, let's re-use the page approach like LeadDetail.

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading, refetch } = useQuery({
    queryKey: ['job-detail', jobId],
    queryFn: async () => {
      if (!jobId) return null;

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', jobId)
        .single();
      if (error) throw error;

      // Fetch related data
      const [costsRes, proofRes, partnerRes] = await Promise.all([
        supabase.from('job_costs').select('*').eq('project_id', jobId).maybeSingle(),
        supabase.from('job_proof').select('id, project_id, before_image_url, after_image_url').eq('project_id', jobId),
        data.referred_by_partner_id
          ? supabase.from('partners').select('id, company_name, contact_name').eq('id', data.referred_by_partner_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      return {
        ...data,
        team_lead: data.team_lead || null,
        team_members: data.team_members || [],
        work_schedule: data.work_schedule || '8:00 AM - 5:00 PM',
        job_costs: costsRes.data || null,
        job_proof: proofRes.data || [],
        partner_name: partnerRes.data ? ((partnerRes.data as any).contact_name || (partnerRes.data as any).company_name) : null,
      };
    },
    enabled: !!jobId,
  });

  // Dynamically import JobControlModal
  // Since JobControlModal is defined inside JobsManager, we need to extract it.
  // For now, we'll use a lazy approach with the extracted component.
  
  return (
    <AdminLayout title="Job Detail">
      <div className="p-4 sm:p-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-1.5"
          onClick={() => navigate('/admin/jobs')}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Jobs
        </Button>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !project ? (
          <div className="text-center py-20 text-muted-foreground">
            Job não encontrado
          </div>
        ) : (
          <JobControlModalEmbedded
            project={project}
            onRefresh={refetch}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// We need to import JobControlModal from JobsManager — but it's not exported.
// Let's create a thin wrapper that imports from the refactored export.
// For this to work, we need to export JobControlModal from JobsManager.

function JobControlModalEmbedded({ project, onRefresh }: { project: any; onRefresh: () => void }) {
  // This is a placeholder — we'll use the exported version
  const { JobControlModal } = require('./JobsManager');
  return (
    <JobControlModal
      project={project}
      isOpen={true}
      onClose={() => {}}
      onRefresh={onRefresh}
      embedded
    />
  );
}
