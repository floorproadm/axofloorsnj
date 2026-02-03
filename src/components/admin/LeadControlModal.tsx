import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  STAGE_LABELS, 
  STAGE_CONFIG,
  normalizeStatus,
  useLeadPipeline,
  type PipelineStage 
} from '@/hooks/useLeadPipeline';
import { useLeadFollowUp, type FollowUpAction } from '@/hooks/useLeadFollowUp';
import { JobProofUploader } from '@/components/admin/JobProofUploader';
import { 
  Phone, Mail, MapPin, DollarSign, 
  ChevronRight, Clock, XCircle, AlertTriangle,
  CheckCircle2, Plus, Loader2, History, Ban
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

// Microcopy operacional - ações por etapa
const actionLabels: Record<PipelineStage, string> = {
  new_lead: 'Agendar Visita',
  appt_scheduled: 'Enviar Orçamento',
  proposal: 'Iniciar Job',
  in_production: 'Fechar Job',
  completed: '',
  lost: ''
};

// Status descriptions - linguagem de dono de flooring
const statusDescriptions: Record<PipelineStage, string> = {
  new_lead: 'Cliente novo esperando contato',
  appt_scheduled: 'Visita marcada, preparar orçamento',
  proposal: 'Orçamento enviado, acompanhar fechamento',
  in_production: 'Trabalho em andamento',
  completed: 'Job finalizado com sucesso',
  lost: 'Oportunidade perdida'
};

export function LeadControlModal({ lead, isOpen, onClose, onRefresh }: LeadControlModalProps) {
  const { updateLeadStatus, isUpdating, getNextAllowedStatuses } = useLeadPipeline();
  const { addFollowUpAction, getFollowUpStatus, isUpdating: isFollowUpUpdating } = useLeadFollowUp();
  
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  if (!lead) return null;

  const stage = normalizeStatus(lead.status);
  const config = STAGE_CONFIG[stage];
  const nextStatuses = getNextAllowedStatuses(lead.status);
  const followUpStatus = getFollowUpStatus(lead);
  
  const isStale = differenceInHours(new Date(), new Date(lead.updated_at)) > 48;
  const isTerminal = stage === 'completed' || stage === 'lost';
  
  // Determine blocking conditions
  const needsFollowUp = stage === 'proposal' && !followUpStatus.hasActions;
  const needsJobProof = stage === 'in_production' && lead.converted_to_project_id;
  const isBlocked = needsFollowUp;

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
      onRefresh();
    }
  };

  // Get the primary next action (non-lost)
  const primaryNextStatus = nextStatuses.find(s => s !== 'lost');
  const canMarkLost = nextStatuses.includes('lost');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-16px)] sm:max-w-xl max-h-[90vh] overflow-hidden p-0">
        {/* Header with Status */}
        <div className={cn(
          "px-4 sm:px-6 py-4 border-b",
          config.bgColor
        )}>
          <DialogHeader className="pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-xl font-bold text-foreground truncate pr-8">
                  {lead.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge 
                    className={cn(
                      "px-2.5 py-0.5 text-xs font-semibold border",
                      config.bgColor,
                      config.textColor,
                      config.borderColor
                    )}
                  >
                    {STAGE_LABELS[stage]}
                  </Badge>
                  {isStale && !isTerminal && (
                    <Badge variant="destructive" className="text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      +48h parado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <p className={cn("text-sm mt-2", config.textColor)}>
              {statusDescriptions[stage]}
            </p>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-4 sm:p-6 space-y-4">
            
            {/* BLOCKING SECTION - Highest Priority */}
            {isBlocked && (
              <div className="p-4 rounded-lg bg-state-blocked/10 border-2 border-state-blocked">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-state-blocked/20 flex items-center justify-center flex-shrink-0">
                    <Ban className="w-5 h-5 text-state-blocked" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-state-blocked text-base">
                      🔴 Bloqueado — Ação Obrigatória
                    </h3>
                    <p className="text-sm text-state-blocked/80 mt-1">
                      {needsFollowUp && "Registre pelo menos 1 contato para poder avançar este lead."}
                    </p>
                    
                    {/* Inline Follow-up Form */}
                    {needsFollowUp && (
                      <div className="mt-4 space-y-3">
                        {!showFollowUpForm ? (
                          <Button 
                            onClick={() => setShowFollowUpForm(true)}
                            className="bg-state-blocked hover:bg-state-blocked/90 text-white"
                          >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Registrar Contato Agora
                          </Button>
                        ) : (
                          <div className="space-y-3 p-3 bg-white rounded-lg border">
                            <Input
                              placeholder="Ex: Ligação, WhatsApp, Email..."
                              value={actionType}
                              onChange={(e) => setActionType(e.target.value)}
                              className="text-sm"
                            />
                            <Textarea
                              placeholder="Notas do contato (opcional)"
                              value={actionNotes}
                              onChange={(e) => setActionNotes(e.target.value)}
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button 
                                onClick={handleAddFollowUp}
                                disabled={!actionType.trim() || isFollowUpUpdating}
                                size="sm"
                              >
                                {isFollowUpUpdating ? (
                                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                )}
                                Salvar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setShowFollowUpForm(false)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* NEXT ACTION SECTION - Single CTA */}
            {!isTerminal && !isBlocked && primaryNextStatus && (
              <div className="p-4 rounded-lg bg-state-success/10 border-2 border-state-success">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-state-success text-base flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      🟢 Pronto para Avançar
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Próximo passo no caminho até o dinheiro
                    </p>
                  </div>
                  <Button
                    onClick={() => handleAdvanceStatus(primaryNextStatus)}
                    disabled={isUpdating}
                    className={cn(
                      "font-semibold",
                      STAGE_CONFIG[primaryNextStatus].bgColor,
                      STAGE_CONFIG[primaryNextStatus].textColor,
                      "hover:opacity-90 border",
                      STAGE_CONFIG[primaryNextStatus].borderColor
                    )}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4 mr-1.5" />
                    )}
                    {actionLabels[primaryNextStatus] || STAGE_LABELS[primaryNextStatus]}
                  </Button>
                </div>
              </div>
            )}

            {/* JobProof Section - Visual Block */}
            {needsJobProof && (
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

            {/* FOLLOW-UP HISTORY - If has actions */}
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
                
                {/* Add more follow-up */}
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
                  <div className="space-y-3 p-3 mt-3 bg-background rounded-lg border">
                    <Input
                      placeholder="Ex: Ligação, WhatsApp, Email..."
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      className="text-sm"
                    />
                    <Textarea
                      placeholder="Notas do contato (opcional)"
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleAddFollowUp}
                        disabled={!actionType.trim() || isFollowUpUpdating}
                        size="sm"
                      >
                        {isFollowUpUpdating ? (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        )}
                        Salvar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowFollowUpForm(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* CONTACT INFO - Secondary */}
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

        {/* Footer Actions - Lost option */}
        {canMarkLost && !isTerminal && (
          <div className="px-4 sm:px-6 py-3 border-t bg-muted/30 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Não deu certo?
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAdvanceStatus('lost')}
              disabled={isBlocked || isUpdating}
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
