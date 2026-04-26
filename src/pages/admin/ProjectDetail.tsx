import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { JobCostEditor } from '@/components/admin/JobCostEditor';
import { ProposalGenerator } from '@/components/admin/ProposalGenerator';
import { JobProofUploader } from '@/components/admin/JobProofUploader';
import { ProjectDocumentsManager } from '@/components/admin/ProjectDocumentsManager';
import { ProjectChatPanel } from '@/components/admin/ProjectChatPanel';
import {
  Loader2,
  ArrowLeft,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  MessageCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!projectId) return;
    setDeleting(true);
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    setDeleting(false);
    if (error) {
      toast.error('Could not delete project', { description: error.message });
      return;
    }
    toast.success('Project deleted');
    setConfirmDelete(false);
    navigate('/admin/projects');
  }

  const { data: project, isLoading } = useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <AdminLayout title="Projeto" breadcrumbs={[{ label: 'Projetos', href: '/admin/leads' }]}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!project) {
    return (
      <AdminLayout title="Projeto" breadcrumbs={[{ label: 'Projetos', href: '/admin/leads' }]}>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Projeto não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/leads')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <AdminLayout
      title={project.customer_name}
      breadcrumbs={[
        { label: 'Pipeline', href: '/admin/leads' },
        { label: project.customer_name },
      ]}
    >
      <div className="space-y-6">
        {/* Back + Status */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Voltar
          </Button>
          <Badge className={statusColors[project.project_status] || 'bg-muted'}>
            {project.project_status}
          </Badge>
        </div>

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this project?</AlertDialogTitle>
              <AlertDialogDescription>
                Linked costs, measurements, invoices and chat history may also be deleted. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); handleDelete(); }}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Deleting...' : 'Delete project'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="costs">Job Costs</TabsTrigger>
            <TabsTrigger value="proposal">Proposal</TabsTrigger>
            <TabsTrigger value="proof">Job Proof</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="chat" className="gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              Chat
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Projeto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem icon={<User className="w-4 h-4" />} label="Cliente" value={project.customer_name} />
                  <InfoItem icon={<Phone className="w-4 h-4" />} label="Telefone" value={project.customer_phone} />
                  <InfoItem icon={<Mail className="w-4 h-4" />} label="Email" value={project.customer_email} />
                  <InfoItem icon={<Briefcase className="w-4 h-4" />} label="Tipo" value={project.project_type} />
                  {project.address && (
                    <InfoItem icon={<MapPin className="w-4 h-4" />} label="Endereço" value={`${project.address}${project.city ? `, ${project.city}` : ''}`} />
                  )}
                  {project.square_footage && (
                    <InfoItem icon={<Briefcase className="w-4 h-4" />} label="Área" value={`${project.square_footage} sq ft`} />
                  )}
                  <InfoItem
                    icon={<Calendar className="w-4 h-4" />}
                    label="Criado em"
                    value={format(new Date(project.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  />
                  {project.start_date && (
                    <InfoItem
                      icon={<Calendar className="w-4 h-4" />}
                      label="Início"
                      value={format(new Date(project.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                    />
                  )}
                </div>
                {project.notes && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Notas</p>
                    <p className="text-sm">{project.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="mt-6 border-destructive/30">
              <CardHeader>
                <CardTitle className="text-sm text-destructive flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-medium">Apagar projeto</p>
                    <p className="text-xs text-muted-foreground">
                      Custos, medições, faturas e chat vinculados serão removidos. Ação irreversível.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete project
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* JOB COSTS */}
          <TabsContent value="costs">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Custos do Projeto</CardTitle>
              </CardHeader>
              <CardContent>
                <JobCostEditor projectId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROPOSAL */}
          <TabsContent value="proposal">
            <ProposalGenerator projectId={project.id} />
          </TabsContent>

          {/* JOB PROOF */}
          <TabsContent value="proof">
            <JobProofUploader projectId={project.id} />
          </TabsContent>

          {/* DOCUMENTS */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectDocumentsManager projectId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* CHAT */}
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat com Equipe
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ProjectChatPanel projectId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
