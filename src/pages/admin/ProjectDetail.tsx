import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AddressAutocomplete } from '@/components/admin/AddressAutocomplete';
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
  MessageCircle,
  Save,
  Pencil,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    address: '',
    city: '',
    zip_code: '',
    project_type: '',
    square_footage: '' as string | number,
    notes: '',
  });

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

  async function handleSave() {
    if (!projectId) return;
    setSaving(true);
    const payload: any = {
      customer_name: form.customer_name || null,
      customer_phone: form.customer_phone || null,
      customer_email: form.customer_email || null,
      address: form.address || null,
      city: form.city || null,
      zip_code: form.zip_code || null,
      project_type: form.project_type || null,
      square_footage: form.square_footage === '' ? null : Number(form.square_footage),
      notes: form.notes || null,
    };
    const { error } = await supabase.from('projects').update(payload).eq('id', projectId);
    setSaving(false);
    if (error) {
      toast.error('Não foi possível salvar', { description: error.message });
      return;
    }
    toast.success('Projeto atualizado');
    setEditing(false);
    qc.invalidateQueries({ queryKey: ['project-detail', projectId] });
    qc.invalidateQueries({ queryKey: ['hub-projects'] });
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

  // Sync form state when project loads / editing toggles
  useEffect(() => {
    if (project) {
      setForm({
        customer_name: project.customer_name || '',
        customer_phone: project.customer_phone || '',
        customer_email: project.customer_email || '',
        address: project.address || '',
        city: project.city || '',
        zip_code: project.zip_code || '',
        project_type: project.project_type || '',
        square_footage: project.square_footage ?? '',
        notes: project.notes || '',
      });
    }
  }, [project, editing]);

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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Informações do Projeto</CardTitle>
                {!editing ? (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving} className="gap-1.5">
                      <X className="h-3.5 w-3.5" />
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Salvar
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Cliente">
                      <Input
                        value={form.customer_name}
                        onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                      />
                    </Field>
                    <Field label="Telefone">
                      <Input
                        value={form.customer_phone}
                        onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                      />
                    </Field>
                    <Field label="Email">
                      <Input
                        type="email"
                        value={form.customer_email}
                        onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                      />
                    </Field>
                    <Field label="Tipo">
                      <Input
                        value={form.project_type}
                        onChange={(e) => setForm({ ...form, project_type: e.target.value })}
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Endereço">
                        <AddressAutocomplete
                          value={form.address}
                          onChange={(v) => setForm({ ...form, address: v })}
                          onSelect={(r) => setForm({
                            ...form,
                            address: r.street || r.full,
                            city: r.city || form.city,
                            zip_code: r.zip || form.zip_code,
                          })}
                          placeholder="Comece a digitar o endereço..."
                        />
                      </Field>
                    </div>
                    <Field label="Cidade">
                      <Input
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                      />
                    </Field>
                    <Field label="CEP / Zip">
                      <Input
                        value={form.zip_code}
                        onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                      />
                    </Field>
                    <Field label="Área (sq ft)">
                      <Input
                        type="number"
                        value={form.square_footage}
                        onChange={(e) => setForm({ ...form, square_footage: e.target.value })}
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Notas">
                        <Textarea
                          rows={3}
                          value={form.notes}
                          onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                      </Field>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ReadItem label="Cliente" value={project.customer_name} />
                      <ReadItem label="Telefone" value={project.customer_phone} />
                      <ReadItem label="Email" value={project.customer_email} />
                      <ReadItem label="Tipo" value={project.project_type} />
                      <ReadItem
                        label="Endereço"
                        value={
                          project.address
                            ? `${project.address}${project.city ? `, ${project.city}` : ''}`
                            : null
                        }
                        emptyHint="Sem endereço — clique em Editar para adicionar"
                      />
                      <ReadItem
                        label="Área"
                        value={project.square_footage ? `${project.square_footage} sq ft` : null}
                      />
                      <ReadItem
                        label="Criado em"
                        value={format(new Date(project.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      />
                      {project.start_date && (
                        <ReadItem
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
                  </>
                )}
              </CardContent>
            </Card>

            {/* Subtle delete link */}
            <div className="mt-8 pt-4 border-t border-border/40 flex justify-end">
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-muted-foreground/60 hover:text-destructive transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 className="h-3 w-3" />
                Apagar projeto
              </button>
            </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ReadItem({
  label,
  value,
  emptyHint,
}: {
  label: string;
  value: string | null | undefined;
  emptyHint?: string;
}) {
  const isEmpty = !value;
  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      {isEmpty ? (
        <p className="text-sm italic text-muted-foreground/70 mt-0.5">
          {emptyHint || '—'}
        </p>
      ) : (
        <p className="text-sm font-medium mt-0.5">{value}</p>
      )}
    </div>
  );
}
