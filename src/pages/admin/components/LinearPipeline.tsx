import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  PIPELINE_STAGES, 
  STAGE_LABELS, 
  STAGE_CONFIG,
  normalizeStatus,
  useLeadPipeline,
  type PipelineStage 
} from "@/hooks/useLeadPipeline";
import { LeadFollowUpAlert } from "@/components/admin/LeadFollowUpAlert";
import { JobProofUploader } from "@/components/admin/JobProofUploader";
import { 
  Phone, Mail, MapPin, DollarSign, 
  MessageSquare, Tag, Bell, Camera, 
  ChevronRight, Clock, CheckCircle, XCircle,
  CalendarCheck, FileText, Hammer, AlertTriangle
} from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  follow_up_actions?: { date: string; action: string; notes?: string }[];
  converted_to_project_id?: string;
};

interface LinearPipelineProps {
  leads: Lead[];
  onRefresh: () => void;
}

// Ícones por etapa - linguagem visual clara
const stageIcons: Record<PipelineStage, React.ReactNode> = {
  new_lead: <Clock className="w-5 h-5" />,
  appt_scheduled: <CalendarCheck className="w-5 h-5" />,
  proposal: <FileText className="w-5 h-5" />,
  in_production: <Hammer className="w-5 h-5" />,
  completed: <CheckCircle className="w-5 h-5" />,
  lost: <XCircle className="w-5 h-5" />
};

// Config de prioridade - sistema de sinais visuais
const priorityConfig = {
  low: { color: "text-slate-600", bg: "bg-slate-100", label: "Baixa" },
  medium: { color: "text-amber-600", bg: "bg-amber-100", label: "Média" },
  high: { color: "text-red-600", bg: "bg-red-100", label: "Alta" }
};

// Labels de fonte - linguagem de operador
const sourceLabels: Record<string, string> = {
  quiz: "Quiz",
  contact_form: "Formulário",
  contact_page: "Contato",
  builders_page: "Builders",
  realtors_page: "Realtors",
  lead_magnet: "E-book",
  website: "Site"
};

// Botões de ação por etapa - microcopy operacional
const actionLabels: Record<PipelineStage, string> = {
  new_lead: 'Agendar Visita',
  appt_scheduled: 'Enviar Orçamento',
  proposal: 'Iniciar Job',
  in_production: 'Fechar Job',
  completed: '',
  lost: ''
};

export function LinearPipeline({ leads, onRefresh }: LinearPipelineProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { updateLeadStatus, isUpdating, getNextAllowedStatuses } = useLeadPipeline();

  // Group leads by normalized status
  const leadsByStage = useMemo(() => {
    const grouped: Record<PipelineStage, Lead[]> = {
      new_lead: [],
      appt_scheduled: [],
      proposal: [],
      in_production: [],
      completed: [],
      lost: []
    };

    leads.forEach(lead => {
      const stage = normalizeStatus(lead.status);
      grouped[stage].push(lead);
    });

    // Sort each group by updated_at (most recent first)
    Object.keys(grouped).forEach(stage => {
      grouped[stage as PipelineStage].sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });

    return grouped;
  }, [leads]);

  // Calculate stage stats
  const stageStats = useMemo(() => {
    const stats: Record<PipelineStage, { count: number; value: number; stale: number }> = {
      new_lead: { count: 0, value: 0, stale: 0 },
      appt_scheduled: { count: 0, value: 0, stale: 0 },
      proposal: { count: 0, value: 0, stale: 0 },
      in_production: { count: 0, value: 0, stale: 0 },
      completed: { count: 0, value: 0, stale: 0 },
      lost: { count: 0, value: 0, stale: 0 }
    };

    Object.entries(leadsByStage).forEach(([stage, stageLeads]) => {
      const s = stage as PipelineStage;
      stats[s].count = stageLeads.length;
      stats[s].value = stageLeads.reduce((sum, l) => sum + (l.budget || 0), 0);
      stats[s].stale = stageLeads.filter(l => 
        differenceInHours(new Date(), new Date(l.updated_at)) > 48
      ).length;
    });

    return stats;
  }, [leadsByStage]);

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleAdvanceStatus = async (lead: Lead, newStatus: PipelineStage) => {
    const success = await updateLeadStatus(lead.id, newStatus);
    if (success) {
      onRefresh();
    }
  };

  const isStale = (lead: Lead) => {
    return differenceInHours(new Date(), new Date(lead.updated_at)) > 48;
  };

  // Active stages (exclude terminal)
  const activeStages = PIPELINE_STAGES.filter(s => s !== 'completed' && s !== 'lost');

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Pipeline Summary Bar - Scrollable on mobile */}
      <div className="flex items-center gap-1 p-2 bg-muted/50 rounded-lg overflow-x-auto scrollbar-hide w-full max-w-full">
        {PIPELINE_STAGES.map((stage, idx) => {
          const config = STAGE_CONFIG[stage];
          const stats = stageStats[stage];
          const isLast = idx === PIPELINE_STAGES.length - 1;
          
          return (
            <div key={stage} className="flex items-center flex-shrink-0">
              <div className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg min-w-fit",
                config.bgColor,
                config.borderColor,
                "border"
              )}>
                <span className={cn("font-medium text-xs sm:text-sm whitespace-nowrap", config.textColor)}>
                  {STAGE_LABELS[stage]}
                </span>
                <Badge variant="secondary" className="h-5 sm:h-6 px-1.5 sm:px-2 text-xs sm:text-sm font-bold bg-white/80">
                  {stats.count}
                </Badge>
                {stats.stale > 0 && stage !== 'completed' && stage !== 'lost' && (
                  <Badge variant="destructive" className="h-4 sm:h-5 px-1.5 text-[10px] sm:text-xs hidden sm:flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {stats.stale} parados
                  </Badge>
                )}
              </div>
              {!isLast && (
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mx-0.5 sm:mx-1 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Main Pipeline Grid - Stack on mobile, 2 cols tablet, 4 cols desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {activeStages.map(stage => {
          const config = STAGE_CONFIG[stage];
          const stageLeads = leadsByStage[stage];
          const stats = stageStats[stage];
          
          return (
            <Card 
              key={stage} 
              className={cn(
                "border-2",
                config.borderColor
              )}
            >
              {/* Stage Header */}
              <div className={cn(
                "flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b",
                config.bgColor
              )}>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className={cn("w-4 h-4 sm:w-5 sm:h-5", config.color)}>{stageIcons[stage]}</span>
                  <span className={cn("font-semibold text-sm sm:text-base", config.textColor)}>
                    {STAGE_LABELS[stage]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {stats.value > 0 && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      ${(stats.value / 1000).toFixed(0)}k
                    </span>
                  )}
                  <Badge variant="outline" className={cn("font-bold text-xs", config.textColor)}>
                    {stats.count}
                  </Badge>
                </div>
              </div>

              {/* Leads List - Shorter on mobile */}
              <ScrollArea className="h-[280px] sm:h-[350px] lg:h-[400px]">
                <div className="p-2 space-y-2">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      Nenhum lead
                    </div>
                  ) : (
                    stageLeads.map(lead => {
                      const stale = isStale(lead);
                      const nextStatuses = getNextAllowedStatuses(lead.status);
                      const prioConfig = priorityConfig[lead.priority as keyof typeof priorityConfig] || priorityConfig.medium;
                      
                      return (
                        <div 
                          key={lead.id}
                          onClick={() => handleCardClick(lead)}
                          className={cn(
                            "p-3 rounded-lg border bg-card cursor-pointer transition-all",
                            "hover:shadow-md hover:border-primary/50",
                            stale && "ring-2 ring-orange-400/50 bg-orange-50/30"
                          )}
                        >
                          {/* Alerta de lead parado - destaque visual */}
                          {stale && (
                            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-100 text-xs mb-2 px-2 py-1 rounded-md border border-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span className="font-medium">+48h parado — Ligar agora</span>
                            </div>
                          )}

                          {/* Lead Info */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm truncate">{lead.name}</h4>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <Phone className="w-3 h-3" />
                                <span>{lead.phone}</span>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn("text-[10px] shrink-0 font-medium", prioConfig.color, prioConfig.bg)}
                            >
                              {prioConfig.label}
                            </Badge>
                          </div>

                          {/* Meta Row */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {lead.city && (
                                <span className="flex items-center gap-0.5 text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  {lead.city}
                                </span>
                              )}
                              <Badge variant="outline" className="text-[10px] px-1">
                                {sourceLabels[lead.lead_source] || lead.lead_source}
                              </Badge>
                            </div>
                            {lead.budget && (
                              <span className="font-semibold text-green-600">
                                ${lead.budget.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Botão de próxima ação - microcopy operacional */}
                          {nextStatuses.length > 0 && (
                            <div className="mt-3 pt-2 border-t flex gap-1.5">
                              {nextStatuses.map(next => {
                                const nextConfig = STAGE_CONFIG[next];
                                const isLost = next === 'lost';
                                return (
                                  <Button
                                    key={next}
                                    size="sm"
                                    variant={isLost ? "ghost" : "outline"}
                                    disabled={isUpdating}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAdvanceStatus(lead, next);
                                    }}
                                    className={cn(
                                      "flex-1 h-8 text-xs font-medium",
                                      isLost 
                                        ? "text-slate-500 hover:text-slate-700 hover:bg-slate-100" 
                                        : cn(nextConfig.bgColor, nextConfig.textColor, "hover:opacity-90 border-2", nextConfig.borderColor)
                                    )}
                                  >
                                    {isLost ? (
                                      <XCircle className="w-3.5 h-3.5 mr-1" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 mr-1" />
                                    )}
                                    {actionLabels[next] || STAGE_LABELS[next]}
                                  </Button>
                                );
                              })}
                            </div>
                          )}

                          {/* Date */}
                          <div className="text-[10px] text-muted-foreground mt-2">
                            {format(new Date(lead.updated_at), "dd/MM HH:mm")}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </Card>
          );
        })}
      </div>

      {/* Terminal States (Completed & Lost) - Collapsed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {(['completed', 'lost'] as PipelineStage[]).map(stage => {
          const config = STAGE_CONFIG[stage];
          const stats = stageStats[stage];
          
          return (
            <Card key={stage} className={cn("border", config.borderColor)}>
              <div className={cn(
                "flex items-center justify-between px-3 sm:px-4 py-2",
                config.bgColor
              )}>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className={cn("w-4 h-4 sm:w-5 sm:h-5", config.color)}>{stageIcons[stage]}</span>
                  <span className={cn("font-medium text-xs sm:text-sm", config.textColor)}>
                    {STAGE_LABELS[stage]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {stats.value > 0 && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      ${(stats.value / 1000).toFixed(0)}k
                    </span>
                  )}
                  <Badge variant="outline" className={cn("font-bold text-xs", config.textColor)}>
                    {stats.count}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Lead Detail Modal - Full screen on mobile */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="w-[calc(100vw-16px)] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl sm:text-2xl font-bold pr-6 text-navy">
              {selectedLead?.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Detalhes do lead e ações disponíveis
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4 py-4">
              {/* Status atual e ações - seção primária */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Etapa atual:</span>
                    <Badge 
                      className={cn(
                        "px-3 py-1.5 text-sm font-semibold",
                        STAGE_CONFIG[normalizeStatus(selectedLead.status)].bgColor,
                        STAGE_CONFIG[normalizeStatus(selectedLead.status)].textColor,
                        STAGE_CONFIG[normalizeStatus(selectedLead.status)].borderColor,
                        "border"
                      )}
                    >
                      {STAGE_LABELS[normalizeStatus(selectedLead.status)]}
                    </Badge>
                  </div>
                  
                  {/* Botões de ação */}
                  <div className="flex gap-2 flex-wrap">
                    {getNextAllowedStatuses(selectedLead.status).map(next => {
                      const isLost = next === 'lost';
                      return (
                        <Button
                          key={next}
                          size="sm"
                          variant={isLost ? "ghost" : "default"}
                          disabled={isUpdating}
                          onClick={() => {
                            handleAdvanceStatus(selectedLead, next);
                            setIsDetailModalOpen(false);
                          }}
                          className={cn(
                            "font-medium",
                            isLost 
                              ? "text-slate-500 hover:text-slate-700" 
                              : cn(STAGE_CONFIG[next].bgColor, STAGE_CONFIG[next].textColor, "hover:opacity-90")
                          )}
                        >
                          {isLost ? <XCircle className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                          {actionLabels[next] || STAGE_LABELS[next]}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Telefone
                  </p>
                  <a href={`tel:${selectedLead.phone}`} className="font-medium text-primary hover:underline">
                    {selectedLead.phone}
                  </a>
                </div>
                {selectedLead.email && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </p>
                    <a href={`mailto:${selectedLead.email}`} className="font-medium text-primary hover:underline">
                      {selectedLead.email}
                    </a>
                  </div>
                )}
                {selectedLead.city && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Cidade
                    </p>
                    <p className="font-medium">{selectedLead.city}</p>
                  </div>
                )}
                {selectedLead.budget && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Orçamento
                    </p>
                    <p className="font-medium text-green-600">${selectedLead.budget.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Services */}
              {selectedLead.services.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Serviços
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.services.map((s, i) => (
                        <Badge key={i} variant="secondary">{s}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              {selectedLead.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Notas
                    </p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{selectedLead.notes}</p>
                  </div>
                </>
              )}

              {/* Follow-up obrigatório para proposta - destaque visual */}
              {normalizeStatus(selectedLead.status) === 'proposal' && (
                <>
                  <Separator />
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-700">
                      <Bell className="w-4 h-4" /> 
                      📞 Follow-Up Obrigatório
                    </p>
                    <p className="text-xs text-amber-600 mb-3">
                      Registre pelo menos 1 contato para avançar este lead
                    </p>
                    <LeadFollowUpAlert 
                      lead={selectedLead} 
                      onUpdate={() => {
                        onRefresh();
                        setIsDetailModalOpen(false);
                      }} 
                    />
                  </div>
                </>
              )}

              {/* Job Proof - destaque visual para bloqueio */}
              {selectedLead.converted_to_project_id && (
                <>
                  <Separator />
                  <div className="p-4 rounded-lg bg-violet-50 border border-violet-200">
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2 text-violet-700">
                      <Camera className="w-4 h-4" /> 
                      📷 Prova de Trabalho (JobProof)
                    </p>
                    <p className="text-xs text-violet-600 mb-3">
                      Envie fotos ANTES e DEPOIS para poder fechar o job
                    </p>
                    <JobProofUploader projectId={selectedLead.converted_to_project_id} />
                  </div>
                </>
              )}

              {/* Timestamps */}
              <Separator />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Criado: {format(new Date(selectedLead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                <span>Atualizado: {format(new Date(selectedLead.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
