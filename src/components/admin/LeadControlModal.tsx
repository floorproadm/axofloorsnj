import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  STAGE_LABELS, 
  STAGE_CONFIG,
  normalizeStatus,
  useLeadPipeline,
  type PipelineStage 
} from '@/hooks/useLeadPipeline';
import { useLeadFollowUp, type FollowUpAction } from '@/hooks/useLeadFollowUp';
import { useLeadConversion } from '@/hooks/useLeadConversion';
import { useLeadNRA, type LeadNRA } from '@/hooks/useLeadNRA';
import { useProposals, type ProposalStatus } from '@/hooks/useProposals';
import { 
  Phone, Mail, MapPin, DollarSign, 
  ChevronRight, Clock, XCircle, Trash2,
  CheckCircle2, Plus, Loader2, History, Ban,
  ArrowRightLeft, AlertTriangle, Send, FileText, ThumbsUp, ThumbsDown,
  Maximize2, Pencil, MessageSquare, StickyNote, User, CalendarDays, Tag,
  Paperclip, Image, File, X, Download
} from 'lucide-react';
import { format, differenceInHours, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Lead = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  lead_source: string;
  status: string;
  priority: string;
  services: string[];
  budget?: number;
  city?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  follow_up_required?: boolean;
  next_action_date?: string;
  follow_up_actions?: FollowUpAction[];
  converted_to_project_id?: string;
};

interface LeadControlModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  embedded?: boolean;
}

const PROJECT_TYPES = [
  'Sanding & Finish',
  'Hardwood Installation',
  'Vinyl Plank Installation',
  'Staircase Refinishing',
  'Baseboard Installation',
  'Repair & Patch',
  'Other'
];

// NRA severity → visual config
const NRA_STYLES: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode; title: string }> = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-700',
    icon: <Ban className="w-5 h-5" />,
    title: '🔴 Ação Obrigatória'
  },
  blocked: {
    bg: 'bg-slate-100',
    border: 'border-slate-500',
    text: 'text-slate-700',
    icon: <AlertTriangle className="w-5 h-5" />,
    title: '⚠️ Erro do Sistema — Revisar'
  },
  normal: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-400',
    text: 'text-emerald-700',
    icon: <CheckCircle2 className="w-5 h-5" />,
    title: '🟢 Pronto para Avançar'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-700',
    icon: <AlertTriangle className="w-5 h-5" />,
    title: '⚠️ Erro'
  }
};

export function LeadControlModal({ lead, isOpen, onClose, onRefresh, embedded = false }: LeadControlModalProps) {
  const navigate = useNavigate();
  const { updateLeadStatus, isUpdating } = useLeadPipeline();
  const { addFollowUpAction, getFollowUpStatus, isUpdating: isFollowUpUpdating } = useLeadFollowUp();
  const { convertLeadToProject, isConverting } = useLeadConversion();
  const { nra, loading: nraLoading, refresh: refreshNRA } = useLeadNRA(lead?.id);
  const { useProposalByProject, updateProposalStatus } = useProposals();
  
  const projectId = lead?.converted_to_project_id || undefined;
  const { data: proposal, refetch: refetchProposal } = useProposalByProject(projectId);
  
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [projectType, setProjectType] = useState('');
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [selectedTier, setSelectedTier] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [sheetWidth, setSheetWidth] = useState(640);
  const [activeTab, setActiveTab] = useState('resumo');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [newNote, setNewNote] = useState('');
  const [noteFiles, setNoteFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isResizing = useRef(false);
  const queryClient = useQueryClient();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = sheetWidth;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = startX - ev.clientX;
      const newWidth = Math.min(Math.max(startWidth + delta, 360), window.innerWidth * 0.85);
      setSheetWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [sheetWidth]);

  // Lead notes query
  const { data: leadNotes = [], refetch: refetchNotes } = useQuery({
    queryKey: ['lead-notes', lead?.id],
    queryFn: async () => {
      if (!lead?.id) return [];
      const { data, error } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!lead?.id,
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ content, file }: { content: string; file?: File }) => {
      const { data: orgData } = await supabase.rpc('get_user_org_id');
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;

      if (file) {
        const ext = file.name.split('.').pop();
        const path = `lead-notes/${lead!.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('project-documents')
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('project-documents')
          .getPublicUrl(path);
        attachmentUrl = urlData.publicUrl;
        attachmentName = file.name;
      }

      const { error } = await supabase.from('lead_notes').insert({
        lead_id: lead!.id,
        content,
        organization_id: orgData,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setNewNote('');
      setNoteFiles([]);
      refetchNotes();
      toast.success('Nota adicionada');
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from('lead_notes').delete().eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchNotes();
      toast.success('Nota removida');
    },
  });

  // Inline edit save
  const handleInlineEdit = async (field: string, value: string) => {
    const updateData: Record<string, any> = {};
    if (field === 'budget') {
      updateData[field] = value ? parseFloat(value) : null;
    } else {
      updateData[field] = value || null;
    }
    const { error } = await supabase.from('leads').update(updateData).eq('id', lead!.id);
    if (error) {
      toast.error('Erro ao salvar');
      return;
    }
    setEditingField(null);
    setEditValues({});
    onRefresh();
    toast.success('Atualizado');
  };

  if (!lead) return null;

  const stage = normalizeStatus(lead.status);
  const config = STAGE_CONFIG[stage];
  const followUpStatus = getFollowUpStatus(lead);
  
  const isStale = differenceInHours(new Date(), new Date(lead.updated_at)) > 48;
  const isTerminal = stage === 'completed' || stage === 'lost';
  const hasProject = !!lead.converted_to_project_id;
  const canMarkLost = !isTerminal && (stage === 'proposal_sent' || stage === 'in_production');

  const handleDeleteLead = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('leads').delete().eq('id', lead.id);
      if (error) throw error;
      toast.success(`Lead "${lead.name}" deletado com sucesso`);
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao deletar lead');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAdvanceStatus = async (newStatus: PipelineStage) => {
    const success = await updateLeadStatus(lead.id, newStatus);
    if (success) {
      onRefresh();
    }
  };

  const handleAddFollowUp = async () => {
    if (!actionType.trim()) return;
    const action: FollowUpAction = {
      date: new Date().toISOString(),
      action: actionType.trim(),
      notes: actionNotes.trim() || undefined
    };
    const success = await addFollowUpAction(lead.id, action);
    if (success) {
      setActionType('');
      setActionNotes('');
      setShowFollowUpForm(false);
      refreshNRA();
      onRefresh();
    }
  };

  const handleConvertToProject = async () => {
    if (!projectType) return;
    const pid = await convertLeadToProject(lead.id, projectType);
    if (pid) {
      setShowConvertForm(false);
      setProjectType('');
      onRefresh();
      setTimeout(() => { refreshNRA(); refetchProposal(); }, 500);
    }
  };

  const handleProposalAction = async (action: 'send' | 'accept' | 'reject') => {
    if (!proposal) return;
    try {
      if (action === 'send') {
        await updateProposalStatus.mutateAsync({ id: proposal.id, status: 'sent' });
        toast.success('Proposta enviada');
      } else if (action === 'accept') {
        if (!selectedTier) { toast.error('Selecione um tier'); return; }
        await updateProposalStatus.mutateAsync({ id: proposal.id, status: 'accepted', selected_tier: selectedTier });
        toast.success('Proposta aceita');
        setShowAcceptForm(false);
        setSelectedTier('');
      } else if (action === 'reject') {
        await updateProposalStatus.mutateAsync({ id: proposal.id, status: 'rejected' });
        toast.success('Proposta rejeitada');
      }
      refetchProposal();
      refreshNRA();
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar proposta');
    }
  };

  // Primary next status derived from NRA action mapping
  const NRA_TO_NEXT_STATUS: Record<string, PipelineStage> = {
    warm_up: 'warm_lead',
    request_estimate: 'estimate_requested',
    schedule_estimate: 'estimate_scheduled',
    advance_to_draft: 'in_draft',
    send_proposal: 'proposal_sent',
    advance_pipeline: stage === 'proposal_sent' ? 'in_production' : 'completed',
    reopen_draft: 'in_draft',
    complete_job: 'completed',
  };
  const primaryNextStatus = nra ? NRA_TO_NEXT_STATUS[nra.action] : undefined;

  

  const innerContent = (
    <>
      {/* Header */}
      <div className={cn("px-4 sm:px-6 py-4 border-b flex-shrink-0 pr-14", config.bgColor)}>
        {/* Open as page button - positioned left of the X close button */}
        {!embedded && (
          <button
            type="button"
            title="Abrir como página"
            className="absolute right-12 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
            onClick={() => {
              onClose();
              navigate(`/admin/leads/${lead.id}`);
            }}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}
        <div className="pb-0">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate">
              {lead.name}
            </h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge className={cn("px-2.5 py-0.5 text-xs font-semibold border", config.bgColor, config.textColor, config.borderColor)}>
                {STAGE_LABELS[stage]}
              </Badge>
              {hasProject && (
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
                  Projeto ✓
                </Badge>
              )}
              {proposal && <ProposalStatusBadge status={proposal.status as ProposalStatus} />}
              {isStale && !isTerminal && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  +48h parado
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* Quick Actions Toolbar */}
        <div className="px-4 sm:px-6 py-2 border-b bg-muted/20 flex items-center gap-2 flex-shrink-0 overflow-x-auto">
          {!isTerminal && (
            <>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={() => { setActiveTab('historico'); setShowFollowUpForm(true); }}>
                <Phone className="w-3 h-3" /> Registrar Contato
              </Button>
              {primaryNextStatus && (
                <Button size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={() => handleAdvanceStatus(primaryNextStatus)} disabled={isUpdating}>
                  <ChevronRight className="w-3 h-3" /> Avançar
                </Button>
              )}
              {!hasProject && stage === 'estimate_scheduled' && (
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={() => setShowConvertForm(true)}>
                  <ArrowRightLeft className="w-3 h-3" /> Converter
                </Button>
              )}
            </>
          )}
          {lead.phone && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 shrink-0" asChild>
              <a href={`tel:${lead.phone}`}><Phone className="w-3 h-3" /> Ligar</a>
            </Button>
          )}
          {lead.email && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 shrink-0" asChild>
              <a href={`mailto:${lead.email}`}><Mail className="w-3 h-3" /> Email</a>
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 space-y-4">
            
            {/* NRA PANEL — always visible at top */}
            {nraLoading ? (
              <div className="p-4 rounded-lg bg-muted/50 border flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Calculando ação...</span>
              </div>
            ) : nra && nra.action !== 'none' ? (
              <NRAPanel 
                nra={nra} 
                lead={lead}
                stage={stage}
                hasProject={hasProject}
                primaryNextStatus={primaryNextStatus}
                isUpdating={isUpdating}
                isConverting={isConverting}
                isFollowUpUpdating={isFollowUpUpdating}
                showFollowUpForm={showFollowUpForm}
                showConvertForm={showConvertForm}
                actionType={actionType}
                actionNotes={actionNotes}
                projectType={projectType}
                onAdvanceStatus={handleAdvanceStatus}
                onShowFollowUpForm={setShowFollowUpForm}
                onShowConvertForm={setShowConvertForm}
                onActionTypeChange={setActionType}
                onActionNotesChange={setActionNotes}
                onProjectTypeChange={setProjectType}
                onSubmitFollowUp={handleAddFollowUp}
                onConvertToProject={handleConvertToProject}
              />
            ) : null}

            {/* TABS */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="resumo" className="text-xs gap-1"><User className="w-3 h-3" /> Resumo</TabsTrigger>
                <TabsTrigger value="historico" className="text-xs gap-1"><History className="w-3 h-3" /> Histórico</TabsTrigger>
                <TabsTrigger value="notas" className="text-xs gap-1"><StickyNote className="w-3 h-3" /> Notas</TabsTrigger>
              </TabsList>

              {/* ═══ TAB: RESUMO ═══ */}
              <TabsContent value="resumo" className="space-y-4 mt-4">
                {/* PROPOSAL ACTIONS */}
                {hasProject && (
                  <ProposalActionsPanel
                    proposal={proposal}
                    showAcceptForm={showAcceptForm}
                    selectedTier={selectedTier}
                    isUpdating={updateProposalStatus.isPending}
                    onSend={() => handleProposalAction('send')}
                    onAccept={() => handleProposalAction('accept')}
                    onReject={() => handleProposalAction('reject')}
                    onShowAcceptForm={setShowAcceptForm}
                    onSelectTier={setSelectedTier}
                  />
                )}

                {hasProject && (nra?.action === 'enter_job_costs' || nra?.action === 'fix_margin' || nra?.action === 'advance_to_proposal') && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
                    💡 Custos, margem e proposta são gerenciados em <strong>Pipeline Operacional</strong> (/admin/jobs)
                  </div>
                )}

                <Separator />

                {/* CONTACT INFO — Inline Editable */}
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Informações de Contato</h3>
                  <InlineField
                    icon={<Phone className="w-3.5 h-3.5" />}
                    label="Telefone"
                    value={lead.phone}
                    field="phone"
                    editingField={editingField}
                    editValues={editValues}
                    onStartEdit={(f, v) => { setEditingField(f); setEditValues({ [f]: v }); }}
                    onSave={handleInlineEdit}
                    onCancel={() => setEditingField(null)}
                    onChange={(f, v) => setEditValues(prev => ({ ...prev, [f]: v }))}
                    linkHref={`tel:${lead.phone}`}
                  />
                  <InlineField
                    icon={<Mail className="w-3.5 h-3.5" />}
                    label="Email"
                    value={lead.email || ''}
                    field="email"
                    editingField={editingField}
                    editValues={editValues}
                    onStartEdit={(f, v) => { setEditingField(f); setEditValues({ [f]: v }); }}
                    onSave={handleInlineEdit}
                    onCancel={() => setEditingField(null)}
                    onChange={(f, v) => setEditValues(prev => ({ ...prev, [f]: v }))}
                    linkHref={lead.email ? `mailto:${lead.email}` : undefined}
                    placeholder="Adicionar email..."
                  />
                  <InlineField
                    icon={<MapPin className="w-3.5 h-3.5" />}
                    label="Cidade"
                    value={lead.city || ''}
                    field="city"
                    editingField={editingField}
                    editValues={editValues}
                    onStartEdit={(f, v) => { setEditingField(f); setEditValues({ [f]: v }); }}
                    onSave={handleInlineEdit}
                    onCancel={() => setEditingField(null)}
                    onChange={(f, v) => setEditValues(prev => ({ ...prev, [f]: v }))}
                    placeholder="Adicionar cidade..."
                  />
                  <InlineField
                    icon={<DollarSign className="w-3.5 h-3.5" />}
                    label="Orçamento"
                    value={lead.budget ? String(lead.budget) : ''}
                    field="budget"
                    editingField={editingField}
                    editValues={editValues}
                    onStartEdit={(f, v) => { setEditingField(f); setEditValues({ [f]: v }); }}
                    onSave={handleInlineEdit}
                    onCancel={() => setEditingField(null)}
                    onChange={(f, v) => setEditValues(prev => ({ ...prev, [f]: v }))}
                    placeholder="Adicionar orçamento..."
                    prefix="$"
                    type="number"
                  />
                </div>

                <Separator />

                {/* Services */}
                {lead.services && lead.services.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Serviços
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {lead.services.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{String(s)}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="flex justify-between text-xs text-muted-foreground pt-2">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {format(new Date(lead.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                  <span>Atualizado: {format(new Date(lead.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
              </TabsContent>

              {/* ═══ TAB: HISTÓRICO ═══ */}
              <TabsContent value="historico" className="space-y-4 mt-4">
                {/* Follow-up form */}
                {showFollowUpForm && (
                  <FollowUpForm
                    actionType={actionType}
                    actionNotes={actionNotes}
                    onActionTypeChange={setActionType}
                    onActionNotesChange={setActionNotes}
                    onSubmit={handleAddFollowUp}
                    onCancel={() => setShowFollowUpForm(false)}
                    isUpdating={isFollowUpUpdating}
                  />
                )}

                {!showFollowUpForm && (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setShowFollowUpForm(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Registrar Novo Contato
                  </Button>
                )}

                {/* Timeline */}
                {followUpStatus.hasActions && lead.follow_up_actions ? (
                  <div className="space-y-2">
                    {lead.follow_up_actions.slice().reverse().map((action, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm p-3 bg-muted/30 rounded-lg border">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{action.action}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatDistanceToNow(new Date(action.date), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          {action.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{action.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum contato registrado ainda</p>
                )}
              </TabsContent>

              {/* ═══ TAB: NOTAS ═══ */}
              <TabsContent value="notas" className="space-y-4 mt-4">
                {/* New note input */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Escreva uma nota sobre este lead..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                    onClick={() => addNoteMutation.mutate(newNote.trim())}
                    className="w-full"
                  >
                    {addNoteMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-1.5" />}
                    Adicionar Nota
                  </Button>
                </div>

                <Separator />

                {/* Notes list */}
                {leadNotes.length > 0 ? (
                  <div className="space-y-3">
                    {leadNotes.map((note: any) => (
                      <div key={note.id} className="p-3 rounded-lg bg-muted/30 border group">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm whitespace-pre-wrap flex-1">{note.content}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {note.author_name} · {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma nota adicionada ainda</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {/* Footer - Actions */}
        <div className="px-4 sm:px-6 py-3 border-t bg-muted/30 flex justify-between items-center flex-shrink-0">
          {/* Delete Lead */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
                Deletar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deletar lead "{lead.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é irreversível. O lead e todo o seu histórico de follow-up serão removidos permanentemente.
                  {hasProject && (
                    <span className="block mt-2 font-semibold text-destructive">
                      ⚠️ Este lead possui um projeto vinculado. O projeto NÃO será deletado.
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteLead}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sim, deletar permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Mark as Lost */}
          {canMarkLost && !isTerminal && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAdvanceStatus('lost')}
              disabled={isUpdating}
              className="text-muted-foreground hover:text-state-blocked hover:bg-state-blocked/10"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Marcar como Perdido
            </Button>
          )}
        </div>
      </>
  );

  if (embedded) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] border rounded-lg overflow-hidden">
        {innerContent}
      </div>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="p-0 flex flex-col h-full w-full sm:max-w-none" style={{ width: `${sheetWidth}px` }}>
        {/* Resize handle */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-50 group hover:bg-primary/20 transition-colors"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-border group-hover:bg-primary/50 transition-colors" />
        </div>
        {innerContent}
      </SheetContent>
    </Sheet>
  );
}

// ═══════════════════════════════════════════════════════════
// NRA PANEL — renders the single required action from DB
// ═══════════════════════════════════════════════════════════
function NRAPanel({ 
  nra, lead, stage, hasProject, primaryNextStatus,
  isUpdating, isConverting, isFollowUpUpdating,
  showFollowUpForm, showConvertForm,
  actionType, actionNotes, projectType,
  onAdvanceStatus, onShowFollowUpForm, onShowConvertForm,
  onActionTypeChange, onActionNotesChange, onProjectTypeChange,
  onSubmitFollowUp, onConvertToProject
}: {
  nra: LeadNRA;
  lead: Lead;
  stage: PipelineStage;
  hasProject: boolean;
  primaryNextStatus?: PipelineStage;
  isUpdating: boolean;
  isConverting: boolean;
  isFollowUpUpdating: boolean;
  showFollowUpForm: boolean;
  showConvertForm: boolean;
  actionType: string;
  actionNotes: string;
  projectType: string;
  onAdvanceStatus: (status: PipelineStage) => void;
  onShowFollowUpForm: (show: boolean) => void;
  onShowConvertForm: (show: boolean) => void;
  onActionTypeChange: (v: string) => void;
  onActionNotesChange: (v: string) => void;
  onProjectTypeChange: (v: string) => void;
  onSubmitFollowUp: () => void;
  onConvertToProject: () => void;
}) {
  const style = NRA_STYLES[nra.severity] || NRA_STYLES.normal;

  return (
    <Card className={cn("border-2", style.border, style.bg)}>
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-base flex items-center gap-2", style.text)}>
          {style.icon}
          {style.title}
        </CardTitle>
        <CardDescription className={cn("text-sm font-medium", style.text, "opacity-80")}>
          {nra.label}
        </CardDescription>
      </CardHeader>

      <CardFooter className="pt-2 flex-col items-stretch gap-3">
        <NRAActionButton
          nra={nra}
          lead={lead}
          primaryNextStatus={primaryNextStatus}
          isUpdating={isUpdating}
          isConverting={isConverting}
          isFollowUpUpdating={isFollowUpUpdating}
          showFollowUpForm={showFollowUpForm}
          showConvertForm={showConvertForm}
          actionType={actionType}
          actionNotes={actionNotes}
          projectType={projectType}
          onAdvanceStatus={onAdvanceStatus}
          onShowFollowUpForm={onShowFollowUpForm}
          onShowConvertForm={onShowConvertForm}
          onActionTypeChange={onActionTypeChange}
          onActionNotesChange={onActionNotesChange}
          onProjectTypeChange={onProjectTypeChange}
          onSubmitFollowUp={onSubmitFollowUp}
          onConvertToProject={onConvertToProject}
        />
      </CardFooter>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// NRA ACTION BUTTON — maps NRA action to correct UI control
// Simplified: no more job_costs / proposal / jobproof here
// ═══════════════════════════════════════════════════════════
function NRAActionButton({
  nra, lead, primaryNextStatus,
  isUpdating, isConverting, isFollowUpUpdating,
  showFollowUpForm, showConvertForm,
  actionType, actionNotes, projectType,
  onAdvanceStatus, onShowFollowUpForm, onShowConvertForm,
  onActionTypeChange, onActionNotesChange, onProjectTypeChange,
  onSubmitFollowUp, onConvertToProject
}: {
  nra: LeadNRA;
  lead: Lead;
  primaryNextStatus?: PipelineStage;
  isUpdating: boolean;
  isConverting: boolean;
  isFollowUpUpdating: boolean;
  showFollowUpForm: boolean;
  showConvertForm: boolean;
  actionType: string;
  actionNotes: string;
  projectType: string;
  onAdvanceStatus: (status: PipelineStage) => void;
  onShowFollowUpForm: (show: boolean) => void;
  onShowConvertForm: (show: boolean) => void;
  onActionTypeChange: (v: string) => void;
  onActionNotesChange: (v: string) => void;
  onProjectTypeChange: (v: string) => void;
  onSubmitFollowUp: () => void;
  onConvertToProject: () => void;
}) {
  switch (nra.action) {
    case 'record_follow_up':
      return showFollowUpForm ? (
        <FollowUpForm
          actionType={actionType}
          actionNotes={actionNotes}
          onActionTypeChange={onActionTypeChange}
          onActionNotesChange={onActionNotesChange}
          onSubmit={onSubmitFollowUp}
          onCancel={() => onShowFollowUpForm(false)}
          isUpdating={isFollowUpUpdating}
        />
      ) : (
        <Button 
          onClick={() => onShowFollowUpForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Registrar Contato Agora
        </Button>
      );

    case 'convert_to_project':
      return showConvertForm ? (
        <div className="space-y-3 p-3 bg-white rounded-lg border">
          <Select value={projectType} onValueChange={onProjectTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo do projeto..." />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button 
              onClick={onConvertToProject}
              disabled={!projectType || isConverting}
              size="sm"
            >
              {isConverting ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
              )}
              Converter
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onShowConvertForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button 
          onClick={() => onShowConvertForm(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <ArrowRightLeft className="w-4 h-4 mr-1.5" />
          Criar Projeto
        </Button>
      );

    // Cost/margin/proposal actions → redirect to /admin/jobs
    case 'enter_job_costs':
    case 'fix_margin':
    case 'advance_to_proposal':
      return (
        <p className="text-sm text-blue-700 font-medium">
          → Gerencie custos e proposta em <strong>Pipeline Operacional</strong>
        </p>
      );

    case 'schedule_visit':
    case 'advance_pipeline':
    case 'complete_job':
      if (!primaryNextStatus) return null;
      return (
        <Button
          onClick={() => onAdvanceStatus(primaryNextStatus)}
          disabled={isUpdating}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          {isUpdating ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-1.5" />
          )}
          {STAGE_LABELS[primaryNextStatus]}
        </Button>
      );

    case 'upload_photos':
    case 'upload_before_photo':
    case 'upload_after_photo':
      return (
        <p className="text-sm text-blue-700 font-medium">
          → Envie fotos em <strong>Pipeline Operacional</strong>
        </p>
      );

    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════
// FOLLOW-UP FORM — extracted sub-component
// ═══════════════════════════════════════════════════════════
function FollowUpForm({ 
  actionType, actionNotes, onActionTypeChange, onActionNotesChange, 
  onSubmit, onCancel, isUpdating 
}: {
  actionType: string;
  actionNotes: string;
  onActionTypeChange: (v: string) => void;
  onActionNotesChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isUpdating: boolean;
}) {
  return (
    <div className="space-y-3 p-3 bg-background rounded-lg border">
      <Input
        placeholder="Ex: Ligação, WhatsApp, Email..."
        value={actionType}
        onChange={(e) => onActionTypeChange(e.target.value)}
        className="text-sm"
      />
      <Textarea
        placeholder="Notas do contato (opcional)"
        value={actionNotes}
        onChange={(e) => onActionNotesChange(e.target.value)}
        rows={2}
        className="text-sm"
      />
      <div className="flex gap-2">
        <Button 
          onClick={onSubmit}
          disabled={!actionType.trim() || isUpdating}
          size="sm"
        >
          {isUpdating ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
          )}
          Salvar
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROPOSAL STATUS BADGE
// ═══════════════════════════════════════════════════════════
const PROPOSAL_BADGE_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  draft: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300', label: '🟡 Rascunho' },
  sent: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', label: '🔵 Enviada' },
  viewed: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300', label: '👁️ Visualizada' },
  accepted: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', label: '🟢 Aceita' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', label: '🔴 Rejeitada' },
  expired: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-300', label: '⚫ Expirada' },
};

function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const style = PROPOSAL_BADGE_STYLES[status] || PROPOSAL_BADGE_STYLES.draft;
  return (
    <Badge variant="outline" className={cn("text-xs", style.bg, style.text, style.border)}>
      <FileText className="w-3 h-3 mr-1" />
      {style.label}
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════
// PROPOSAL ACTIONS PANEL — contextual actions based on status
// ═══════════════════════════════════════════════════════════
function ProposalActionsPanel({
  proposal, showAcceptForm, selectedTier, isUpdating,
  onSend, onAccept, onReject, onShowAcceptForm, onSelectTier,
}: {
  proposal: any;
  showAcceptForm: boolean;
  selectedTier: string;
  isUpdating: boolean;
  onSend: () => void;
  onAccept: () => void;
  onReject: () => void;
  onShowAcceptForm: (v: boolean) => void;
  onSelectTier: (v: string) => void;
}) {
  if (!proposal) return null;

  const status = proposal.status as ProposalStatus;

  if (status === 'accepted') {
    const tierLabel = proposal.selected_tier === 'good' ? 'Good' : proposal.selected_tier === 'better' ? 'Better' : 'Best';
    const tierPrice = proposal.selected_tier === 'good' ? proposal.good_price : proposal.selected_tier === 'better' ? proposal.better_price : proposal.best_price;
    return (
      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-300">
        <h3 className="font-semibold text-sm text-emerald-800 flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4" />
          Proposta Aceita — Tier {tierLabel}
        </h3>
        <p className="text-lg font-bold text-emerald-700">${Number(tierPrice).toLocaleString()}</p>
        <p className="text-xs text-emerald-600 mt-1">
          Aceita em {proposal.accepted_at ? format(new Date(proposal.accepted_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '—'}
        </p>
      </div>
    );
  }

  if (status === 'rejected' || status === 'expired') {
    return (
      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
        Proposta {status === 'rejected' ? 'rejeitada' : 'expirada'} — #{proposal.proposal_number}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Proposta #{proposal.proposal_number}
      </h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded bg-background border">
          <p className="text-xs text-muted-foreground">Good</p>
          <p className="font-bold text-sm">${Number(proposal.good_price).toLocaleString()}</p>
        </div>
        <div className="p-2 rounded bg-background border">
          <p className="text-xs text-muted-foreground">Better</p>
          <p className="font-bold text-sm">${Number(proposal.better_price).toLocaleString()}</p>
        </div>
        <div className="p-2 rounded bg-background border">
          <p className="text-xs text-muted-foreground">Best</p>
          <p className="font-bold text-sm">${Number(proposal.best_price).toLocaleString()}</p>
        </div>
      </div>

      {status === 'draft' && (
        <Button onClick={onSend} disabled={isUpdating} className="w-full" size="sm">
          {isUpdating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
          Enviar Proposta
        </Button>
      )}

      {(status === 'sent' || status === 'viewed') && (
        <>
          {showAcceptForm ? (
            <div className="space-y-2 p-3 bg-background rounded-lg border">
              <Select value={selectedTier} onValueChange={onSelectTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar tier aceito..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good — ${Number(proposal.good_price).toLocaleString()}</SelectItem>
                  <SelectItem value="better">Better — ${Number(proposal.better_price).toLocaleString()}</SelectItem>
                  <SelectItem value="best">Best — ${Number(proposal.best_price).toLocaleString()}</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button onClick={onAccept} disabled={!selectedTier || isUpdating} size="sm">
                  {isUpdating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                  Confirmar Aceite
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onShowAcceptForm(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => onShowAcceptForm(true)} size="sm" className="flex-1">
                <ThumbsUp className="w-4 h-4 mr-1.5" />
                Marcar Aceita
              </Button>
              <Button onClick={onReject} disabled={isUpdating} variant="destructive" size="sm" className="flex-1">
                <ThumbsDown className="w-4 h-4 mr-1.5" />
                Rejeitar
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// INLINE FIELD — click to edit, Notion-style
// ═══════════════════════════════════════════════════════════
function InlineField({
  icon, label, value, field, editingField, editValues,
  onStartEdit, onSave, onCancel, onChange,
  linkHref, placeholder, prefix, type = 'text',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  field: string;
  editingField: string | null;
  editValues: Record<string, string>;
  onStartEdit: (field: string, value: string) => void;
  onSave: (field: string, value: string) => void;
  onCancel: () => void;
  onChange: (field: string, value: string) => void;
  linkHref?: string;
  placeholder?: string;
  prefix?: string;
  type?: string;
}) {
  const isEditing = editingField === field;

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-muted/50">
        <span className="text-muted-foreground shrink-0">{icon}</span>
        <Input
          autoFocus
          type={type}
          value={editValues[field] ?? value}
          onChange={(e) => onChange(field, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(field, editValues[field] ?? value);
            if (e.key === 'Escape') onCancel();
          }}
          className="h-7 text-sm flex-1"
          placeholder={placeholder}
        />
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onSave(field, editValues[field] ?? value)}>
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer group transition-colors"
      onClick={() => onStartEdit(field, value)}
    >
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
      {value ? (
        linkHref ? (
          <a href={linkHref} className="text-sm text-primary hover:underline truncate flex-1" onClick={e => e.stopPropagation()}>
            {prefix}{value}
          </a>
        ) : (
          <span className="text-sm font-medium truncate flex-1">{prefix}{value}</span>
        )
      ) : (
        <span className="text-sm text-muted-foreground/60 italic truncate flex-1">{placeholder || 'Vazio'}</span>
      )}
      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  );
}
