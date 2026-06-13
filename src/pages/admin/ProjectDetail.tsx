import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, LayoutDashboard, DollarSign, FileText, Wrench, User as UserIcon } from 'lucide-react';

import { ProjectKernelHeader } from '@/components/admin/projects/ProjectKernelHeader';
import { ProjectKernelOverview } from '@/components/admin/projects/ProjectKernelOverview';
import { ProjectMeasurementsTab, ProjectMeasurementsReference } from '@/components/admin/projects/ProjectMeasurementsTab';
import { JobCostEditor } from '@/components/admin/JobCostEditor';
import { MaterialsSection, LaborSection } from '@/components/admin/projects/FullCostsDialog';
import { ProposalGenerator } from '@/components/admin/ProposalGenerator';
import { ProjectPhotosSection } from '@/components/admin/projects/ProjectPhotosSection';
import { ProjectChecklistTab } from '@/components/admin/projects/ProjectChecklistTab';
import { ProjectTechSheet } from '@/components/admin/projects/ProjectTechSheet';
import { ProjectDocumentsManager } from '@/components/admin/ProjectDocumentsManager';
import { ProjectChatPanel } from '@/components/admin/ProjectChatPanel';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'kernel';

  // Backward-compat: map old tab names to new structure
  useEffect(() => {
    const oldToNew: Record<string, string> = {
      overview: 'kernel',
      costs: 'finance',
      measurements: 'proposal',
      proposal: 'proposal',
      media: 'operations',
      checklist: 'operations',
      tech: 'client',
      documents: 'client',
      chat: 'operations',
    };
    const t = searchParams.get('tab');
    if (t && oldToNew[t] && oldToNew[t] !== t) {
      const sp = new URLSearchParams(searchParams);
      sp.set('tab', oldToNew[t]);
      setSearchParams(sp, { replace: true });
    }
  }, []); // eslint-disable-line

  const { data: project, isLoading } = useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('projects').select('*').eq('id', projectId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <AdminLayout title="Projeto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!project) {
    return (
      <AdminLayout title="Projeto">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Projeto não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={project.customer_name || 'Projeto'}>
      <div className="space-y-4">
        <ProjectKernelHeader project={project} />

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="kernel" className="gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" /> Kernel
            </TabsTrigger>
            <TabsTrigger value="finance" className="gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Financeiro
            </TabsTrigger>
            <TabsTrigger value="proposal" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Proposta
            </TabsTrigger>
            <TabsTrigger value="operations" className="gap-1.5">
              <Wrench className="h-3.5 w-3.5" /> Operação
            </TabsTrigger>
            <TabsTrigger value="client" className="gap-1.5">
              <UserIcon className="h-3.5 w-3.5" /> Cliente
            </TabsTrigger>
          </TabsList>

          {/* KERNEL */}
          <TabsContent value="kernel" className="mt-4">
            <ProjectKernelOverview project={project} />
          </TabsContent>

          {/* FINANCEIRO */}
          <TabsContent value="finance" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Custos & Margem</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="margin">
                  <TabsList>
                    <TabsTrigger value="margin">Margin</TabsTrigger>
                    <TabsTrigger value="materials">Materials</TabsTrigger>
                    <TabsTrigger value="labor">Labor</TabsTrigger>
                  </TabsList>
                  <TabsContent value="margin" className="mt-4">
                    <JobCostEditor projectId={project.id} />
                  </TabsContent>
                  <TabsContent value="materials" className="mt-4">
                    <MaterialsSection projectId={project.id} />
                  </TabsContent>
                  <TabsContent value="labor" className="mt-4">
                    <LaborSection projectId={project.id} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROPOSTA */}
          <TabsContent value="proposal" className="mt-4">
            <Tabs defaultValue="builder">
              <TabsList>
                <TabsTrigger value="builder">Builder</TabsTrigger>
                <TabsTrigger value="measurements">Medidas</TabsTrigger>
              </TabsList>
              <TabsContent value="builder" className="mt-4 space-y-3">
                <ProjectMeasurementsReference projectId={project.id} />
                <ProposalGenerator projectId={project.id} />
              </TabsContent>
              <TabsContent value="measurements" className="mt-4">
                <ProjectMeasurementsTab projectId={project.id} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* OPERAÇÃO */}
          <TabsContent value="operations" className="mt-4">
            <Tabs defaultValue="checklist">
              <TabsList>
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
                <TabsTrigger value="media">Mídia</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
              </TabsList>
              <TabsContent value="checklist" className="mt-4">
                <ProjectChecklistTab projectId={project.id} />
              </TabsContent>
              <TabsContent value="media" className="mt-4">
                <ProjectPhotosSection projectId={project.id} />
              </TabsContent>
              <TabsContent value="chat" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Chat com Equipe</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ProjectChatPanel projectId={project.id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* CLIENTE */}
          <TabsContent value="client" className="mt-4">
            <Tabs defaultValue="tech">
              <TabsList>
                <TabsTrigger value="tech">Ficha Técnica</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
              </TabsList>
              <TabsContent value="tech" className="mt-4">
                <ProjectTechSheet projectId={project.id} project={project} />
              </TabsContent>
              <TabsContent value="documents" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Documentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProjectDocumentsManager projectId={project.id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
