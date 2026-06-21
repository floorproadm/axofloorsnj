import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, LayoutDashboard, DollarSign, FileText, Wrench, User as UserIcon, MessageCircle, Image, ListChecks, Ruler, ClipboardList, FolderOpen, Calculator, Package, Users, Receipt, Plus } from 'lucide-react';
import { CustomerPortalShareDialog } from '@/components/admin/CustomerPortalShareDialog';
import { format } from 'date-fns';
import { NewInvoiceDialog } from '@/components/admin/payments/NewInvoiceDialog';
import { InvoiceDetailsSheet } from '@/components/admin/payments/InvoiceDetailsSheet';
import type { Invoice } from '@/hooks/useInvoices';

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
  const [portalOpen, setPortalOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoices } = useQuery({
    queryKey: ['project-invoices', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Invoice[];
    },
    enabled: !!projectId,
  });

  function fmt(n: number) {
    return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
  }

  // Backward-compat: map old tab names to new structure
  useEffect(() => {
    const oldToNew: Record<string, string> = {
      overview: 'kernel',
      costs: 'finance',
      measurements: 'operations',
      proposal: 'proposal',
      media: 'operations',
      checklist: 'operations',
      tech: 'client',
      documents: 'client',
      operations: 'operations',
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
        <ProjectKernelHeader
          project={project}
          onPortalClick={() => setPortalOpen(true)}
        />

        <CustomerPortalShareDialog
          open={portalOpen}
          onOpenChange={setPortalOpen}
          customerId={project.customer_id}
          customerName={project.customer_name}
          customerEmail={project.customer_email}
          customerPhone={project.customer_phone}
          relatedId={project.id}
          relatedType="project"
        />


        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="w-full grid grid-cols-6 sm:flex sm:justify-start sm:flex-wrap h-auto gap-1 bg-muted/40 p-1 rounded-xl">
            <TabsTrigger value="kernel" className="flex-col sm:flex-row gap-0.5 sm:gap-1.5 px-1 sm:px-3 py-1.5 text-[10px] sm:text-sm data-[state=active]:shadow-sm">
              <LayoutDashboard className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="client" className="flex-col sm:flex-row gap-0.5 sm:gap-1.5 px-1 sm:px-3 py-1.5 text-[10px] sm:text-sm data-[state=active]:shadow-sm">
              <UserIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> Cliente
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex-col sm:flex-row gap-0.5 sm:gap-1.5 px-1 sm:px-3 py-1.5 text-[10px] sm:text-sm data-[state=active]:shadow-sm">
              <Wrench className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> Operação
            </TabsTrigger>
            <TabsTrigger value="proposal" className="flex-col sm:flex-row gap-0.5 sm:gap-1.5 px-1 sm:px-3 py-1.5 text-[10px] sm:text-sm data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> Proposta
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex-col sm:flex-row gap-0.5 sm:gap-1.5 px-1 sm:px-3 py-1.5 text-[10px] sm:text-sm data-[state=active]:shadow-sm">
              <Receipt className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> Faturas
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex-col sm:flex-row gap-0.5 sm:gap-1.5 px-1 sm:px-3 py-1.5 text-[10px] sm:text-sm data-[state=active]:shadow-sm">
              <DollarSign className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> Financeiro
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
                    <TabsTrigger value="margin" className="gap-1.5">
                      <Calculator className="h-3.5 w-3.5" /> Margin
                    </TabsTrigger>
                    <TabsTrigger value="materials" className="gap-1.5">
                      <Package className="h-3.5 w-3.5" /> Materials
                    </TabsTrigger>
                    <TabsTrigger value="labor" className="gap-1.5">
                      <Users className="h-3.5 w-3.5" /> Labor
                    </TabsTrigger>
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
          <TabsContent value="proposal" className="mt-4 space-y-3">
            <ProjectMeasurementsReference projectId={project.id} />
            <ProposalGenerator projectId={project.id} />
          </TabsContent>

          {/* FATURAS */}
          <TabsContent value="invoices" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Faturas</CardTitle>
                  <Button size="sm" className="gap-1 text-xs" onClick={() => setInvoiceOpen(true)}>
                    <Plus className="h-3.5 w-3.5" /> Nova Fatura
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(invoices ?? []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 border rounded-lg border-dashed">
                    <Receipt className="h-6 w-6 text-muted-foreground/60" />
                    <p className="text-xs text-muted-foreground">Nenhuma fatura criada para este projeto</p>
                    <Button variant="outline" size="sm" className="h-7 px-3 text-[11px] gap-1 mt-1" onClick={() => setInvoiceOpen(true)}>
                      <Plus className="h-3 w-3" /> Nova Fatura
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(invoices ?? []).map((inv) => {
                      const isOverdue = inv.status !== 'paid' && inv.due_date && new Date(inv.due_date) < new Date();
                      const effectiveStatus = isOverdue ? 'overdue' : inv.status;
                      const statusMap: Record<string, { label: string; cls: string }> = {
                        paid: { label: 'Paga', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
                        overdue: { label: 'Em atraso', cls: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' },
                        pending: { label: 'Pendente', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
                        draft: { label: 'Rascunho', cls: 'bg-muted text-muted-foreground border-border' },
                      };
                      const s = statusMap[effectiveStatus] ?? statusMap.pending;
                      return (
                        <button
                          key={inv.id}
                          onClick={() => navigate(`/admin/invoices?invoice=${inv.id}`)}
                          className="w-full flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition text-left"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{inv.invoice_number}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {inv.due_date ? `Vence ${format(new Date(inv.due_date), "MMM d, yyyy")}` : 'Sem data de vencimento'}
                            </p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="text-sm font-bold">{fmt(inv.total_amount ?? inv.amount ?? 0)}</p>
                            <Badge variant="outline" className={`text-[10px] ${s.cls}`}>{s.label}</Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* OPERAÇÃO */}
          <TabsContent value="operations" className="mt-4">
            <Tabs defaultValue="checklist">
              <TabsList>
                <TabsTrigger value="checklist" className="gap-1.5">
                  <ListChecks className="h-3.5 w-3.5" /> Checklist
                </TabsTrigger>
                <TabsTrigger value="measurements" className="gap-1.5">
                  <Ruler className="h-3.5 w-3.5" /> Medidas
                </TabsTrigger>
                <TabsTrigger value="media" className="gap-1.5">
                  <Image className="h-3.5 w-3.5" /> Mídia
                </TabsTrigger>
                <TabsTrigger value="chat" className="gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" /> Chat
                </TabsTrigger>
              </TabsList>
              <TabsContent value="checklist" className="mt-4">
                <ProjectChecklistTab projectId={project.id} />
              </TabsContent>
              <TabsContent value="measurements" className="mt-4">
                <ProjectMeasurementsTab projectId={project.id} />
              </TabsContent>
              <TabsContent value="media" className="mt-4">
                <ProjectPhotosSection projectId={project.id} />
              </TabsContent>
              <TabsContent value="chat" className="mt-4">
                <Tabs defaultValue="team">
                  <TabsList>
                    <TabsTrigger value="team" className="gap-1.5">
                      <Wrench className="h-3.5 w-3.5" /> Equipe
                    </TabsTrigger>
                    <TabsTrigger value="client" className="gap-1.5">
                      <UserIcon className="h-3.5 w-3.5" /> Cliente
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="team" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Chat com Equipe</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ProjectChatPanel projectId={project.id} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="client" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Chat com Cliente</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          O chat com o cliente acontece pelo Portal do Cliente. Envie o link do portal pela aba <strong>Cliente</strong> para iniciar a conversa.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </TabsContent>



          {/* CLIENTE */}
          <TabsContent value="client" className="mt-4">
            <Tabs defaultValue="tech">
              <TabsList>
                <TabsTrigger value="tech" className="gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" /> Ficha Técnica
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-1.5">
                  <FolderOpen className="h-3.5 w-3.5" /> Documentos
                </TabsTrigger>
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
        <NewInvoiceDialog
          open={invoiceOpen}
          onOpenChange={setInvoiceOpen}
          defaultProjectId={project.id}
        />
      </div>
    </AdminLayout>
  );
}
