import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { JobProofUploader } from '@/components/admin/JobProofUploader';
import { 
  Phone, Mail, MapPin, DollarSign, 
  ChevronRight, Clock, XCircle,
  CheckCircle2, Plus, Loader2, History, Ban,
  ArrowRightLeft, AlertTriangle
} from 'lucide-react';
import { format, differenceInHours, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
}

const PROJECT_TYPES = [
  'Sanding & Refinishing',
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

export function LeadControlModal({ lead, isOpen, onClose, onRefresh }: LeadControlModalProps) {
  const { updateLeadStatus, isUpdating } = useLeadPipeline();
  const { addFollowUpAction, getFollowUpStatus, isUpdating: isFollowUpUpdating } = useLeadFollowUp();
  const { convertLeadToProject, isConverting } = useLeadConversion();
  const { nra, loading: nraLoading, refresh: refreshNRA } = useLeadNRA(lead?.id);
  
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [projectType, setProjectType] = useState('');

  if (!lead) return null;

  const stage = normalizeStatus(lead.status);
  const config = STAGE_CONFIG[stage];
  const followUpStatus = getFollowUpStatus(lead);
  
  const isStale = differenceInHours(new Date(), new Date(lead.updated_at)) > 48;
  const isTerminal = stage === 'completed' || stage === 'lost';
  const hasProject = !!lead.converted_to_project_id;
  
  // "Lost" is allowed from proposal and in_production (non-terminal, non-early stages)
  const canMarkLost = !isTerminal && (stage === 'proposal' || stage === 'in_production');

  const handleAdvanceStatus = async (newStatus: PipelineStage) => {
    const success = await updateLeadStatus(lead.id, newStatus);
    if (success) {
      onRefresh();
      onClose();
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
    const projectId = await convertLeadToProject(lead.id, projectType);
    if (projectId) {
      setShowConvertForm(false);
      setProjectType('');
      refreshNRA();
      onRefresh();
    }
  };

  // Primary next status derived from NRA action mapping
  const NRA_TO_NEXT_STATUS: Record<string, PipelineStage> = {
    schedule_visit: 'appt_scheduled',
    advance_to_proposal: 'proposal',
    advance_pipeline: stage === 'proposal' ? 'in_production' : 'completed',
    complete_job: 'completed',
  };
  const primaryNextStatus = nra ? NRA_TO_NEXT_STATUS[nra.action] : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-16px)] sm:max-w-xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <div className={cn("px-4 sm:px-6 py-4 border-b", config.bgColor)}>
          <DialogHeader className="pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-xl font-bold text-foreground truncate pr-8">
                  {lead.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge className={cn("px-2.5 py-0.5 text-xs font-semibold border", config.bgColor, config.textColor, config.borderColor)}>
                    {STAGE_LABELS[stage]}
                  </Badge>
                  {hasProject && (
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
                      Projeto ✓
                    </Badge>
                  )}
                  {isStale && !isTerminal && (
                    <Badge variant="destructive" className="text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      +48h parado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-4 sm:p-6 space-y-4">
            
            {/* ═══════════════════════════════════════════════════ */}
            {/* NRA PANEL — Single source of truth from the bank  */}
            {/* ═══════════════════════════════════════════════════ */}
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

            {/* JobProof Section — only when NRA says upload photos */}
            {nra && ['upload_photos', 'upload_before_photo', 'upload_after_photo'].includes(nra.action) && hasProject && (
              <div className="p-4 rounded-lg bg-violet-50 border-2 border-violet-300">
                <h3 className="font-bold text-violet-700 text-base mb-2">
                  📷 Prova de Trabalho
                </h3>
                <p className="text-sm text-violet-600 mb-3">
                  Envie fotos ANTES e DEPOIS para poder fechar o job
                </p>
                <JobProofUploader projectId={lead.converted_to_project_id!} />
              </div>
            )}

            {/* FOLLOW-UP HISTORY */}
            {followUpStatus.hasActions && lead.follow_up_actions && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <History className="w-4 h-4" />
                  Histórico de Contatos ({followUpStatus.actionCount})
                </h3>
                <div className="space-y-2">
                  {lead.follow_up_actions.slice(-3).reverse().map((action, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm p-2 bg-background rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-state-success mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{action.action}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatDistanceToNow(new Date(action.date), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        {action.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{action.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 w-full"
                  onClick={() => setShowFollowUpForm(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Registrar Novo Contato
                </Button>

                {showFollowUpForm && (
                  <div className="mt-3">
                    <FollowUpForm
                      actionType={actionType}
                      actionNotes={actionNotes}
                      onActionTypeChange={setActionType}
                      onActionNotesChange={setActionNotes}
                      onSubmit={handleAddFollowUp}
                      onCancel={() => setShowFollowUpForm(false)}
                      isUpdating={isFollowUpUpdating}
                    />
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* CONTACT INFO */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Phone className="w-3 h-3" /> Telefone
                </p>
                <a href={`tel:${lead.phone}`} className="font-medium text-sm text-primary hover:underline">
                  {lead.phone}
                </a>
              </div>
              {lead.email && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Mail className="w-3 h-3" /> Email
                  </p>
                  <a href={`mailto:${lead.email}`} className="font-medium text-sm text-primary hover:underline truncate block">
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.city && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3" /> Cidade
                  </p>
                  <p className="font-medium text-sm">{lead.city}</p>
                </div>
              )}
              {lead.budget && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <DollarSign className="w-3 h-3" /> Orçamento
                  </p>
                  <p className="font-medium text-sm text-state-success">${lead.budget.toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="flex justify-between text-xs text-muted-foreground pt-2">
              <span>Criado: {format(new Date(lead.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
              <span>Atualizado: {format(new Date(lead.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
            </div>
          </div>
        </ScrollArea>

        {/* Footer - Lost option */}
        {canMarkLost && !isTerminal && (
          <div className="px-4 sm:px-6 py-3 border-t bg-muted/30 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Não deu certo?
            </span>
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════
// NRA PANEL — renders the single required action from DB
// ═══════════════════════════════════════════════════════════
function NRAPanel({ 
  nra, lead, stage, hasProject, primaryNextStatus,
  isUpdating, isConverting, isFollowUpUpdating,
  showFollowUpForm, showConvertForm, actionType, actionNotes, projectType,
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
// ═══════════════════════════════════════════════════════════
function NRAActionButton({
  nra, lead, primaryNextStatus,
  isUpdating, isConverting, isFollowUpUpdating,
  showFollowUpForm, showConvertForm, actionType, actionNotes, projectType,
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
    case 'enter_job_costs':
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
          {nra.action === 'enter_job_costs' ? 'Preencher Custos' : 'Criar Projeto'}
        </Button>
      );

    case 'fix_margin':
      return (
        <div className="text-sm text-red-700 font-medium">
          Ajuste os custos do projeto para atingir a margem mínima.
        </div>
      );

    case 'schedule_visit':
    case 'advance_to_proposal':
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
      // Handled by the JobProofUploader section above
      return (
        <p className="text-sm text-violet-600 font-medium">
          ↓ Use o uploader abaixo
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
