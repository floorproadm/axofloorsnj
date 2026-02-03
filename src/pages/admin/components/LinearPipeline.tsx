import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  PIPELINE_STAGES, 
  STAGE_LABELS, 
  STAGE_CONFIG,
  normalizeStatus,
  useLeadPipeline,
  type PipelineStage 
} from "@/hooks/useLeadPipeline";
import { LeadControlModal } from "@/components/admin/LeadControlModal";
import { LeadSignalBadge } from "@/components/admin/LeadSignalBadge";
import { 
  Phone, MapPin, DollarSign, 
  ChevronRight, Clock, CheckCircle, XCircle,
  CalendarCheck, FileText, Hammer, AlertTriangle, Ban
} from "lucide-react";
import { format, differenceInHours } from "date-fns";
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

// Ícones por etapa
const stageIcons: Record<PipelineStage, React.ReactNode> = {
  new_lead: <Clock className="w-5 h-5" />,
  appt_scheduled: <CalendarCheck className="w-5 h-5" />,
  proposal: <FileText className="w-5 h-5" />,
  in_production: <Hammer className="w-5 h-5" />,
  completed: <CheckCircle className="w-5 h-5" />,
  lost: <XCircle className="w-5 h-5" />
};

// Labels de fonte
const sourceLabels: Record<string, string> = {
  quiz: "Quiz",
  contact_form: "Formulário",
  contact_page: "Contato",
  builders_page: "Builders",
  realtors_page: "Realtors",
  lead_magnet: "E-book",
  website: "Site"
};

// Microcopy por etapa - única ação correta
const stageActionLabel: Record<PipelineStage, string> = {
  new_lead: 'Agendar Visita',
  appt_scheduled: 'Enviar Orçamento',
  proposal: 'Iniciar Job',
  in_production: 'Fechar Job',
  completed: '',
  lost: ''
};

export function LinearPipeline({ leads, onRefresh }: LinearPipelineProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { getNextAllowedStatuses } = useLeadPipeline();

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

  // Calculate stage stats with blocking info
  const stageStats = useMemo(() => {
    const stats: Record<PipelineStage, { 
      count: number; 
      value: number; 
      stale: number;
      blocked: number;
    }> = {
      new_lead: { count: 0, value: 0, stale: 0, blocked: 0 },
      appt_scheduled: { count: 0, value: 0, stale: 0, blocked: 0 },
      proposal: { count: 0, value: 0, stale: 0, blocked: 0 },
      in_production: { count: 0, value: 0, stale: 0, blocked: 0 },
      completed: { count: 0, value: 0, stale: 0, blocked: 0 },
      lost: { count: 0, value: 0, stale: 0, blocked: 0 }
    };

    Object.entries(leadsByStage).forEach(([stage, stageLeads]) => {
      const s = stage as PipelineStage;
      stats[s].count = stageLeads.length;
      stats[s].value = stageLeads.reduce((sum, l) => sum + (l.budget || 0), 0);
      stats[s].stale = stageLeads.filter(l => 
        differenceInHours(new Date(), new Date(l.updated_at)) > 48
      ).length;
      
      // Count blocked leads in proposal stage (no follow-up)
      if (s === 'proposal') {
        stats[s].blocked = stageLeads.filter(l => {
          const actions = Array.isArray(l.follow_up_actions) ? l.follow_up_actions : [];
          return actions.length === 0;
        }).length;
      }
    });

    return stats;
  }, [leadsByStage]);

  // Calculate total pipeline health
  const pipelineHealth = useMemo(() => {
    const activeLeads = leads.filter(l => {
      const stage = normalizeStatus(l.status);
      return stage !== 'completed' && stage !== 'lost';
    });
    
    const totalValue = activeLeads.reduce((sum, l) => sum + (l.budget || 0), 0);
    const blockedCount = stageStats.proposal.blocked;
    const staleCount = Object.values(stageStats).reduce((sum, s) => sum + s.stale, 0);
    
    return { activeLeads: activeLeads.length, totalValue, blockedCount, staleCount };
  }, [leads, stageStats]);

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const isStale = (lead: Lead) => {
    return differenceInHours(new Date(), new Date(lead.updated_at)) > 48;
  };

  const isBlocked = (lead: Lead) => {
    const stage = normalizeStatus(lead.status);
    if (stage === 'proposal') {
      const actions = Array.isArray(lead.follow_up_actions) ? lead.follow_up_actions : [];
      return actions.length === 0;
    }
    return false;
  };

  // Active stages (exclude terminal)
  const activeStages = PIPELINE_STAGES.filter(s => s !== 'completed' && s !== 'lost');

  // Empty state
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
        <Clock className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground">Nenhum lead no pipeline</h3>
        <p className="text-sm text-muted-foreground/70 mt-2">
          Quando novos leads chegarem, eles aparecerão aqui
        </p>
      </div>
    );
  }

  // All blocked state
  const allBlocked = pipelineHealth.blockedCount === pipelineHealth.activeLeads && pipelineHealth.activeLeads > 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Alert: All blocked */}
      {allBlocked && (
        <div className="p-4 rounded-lg bg-state-blocked/10 border-2 border-state-blocked flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-state-blocked/20 flex items-center justify-center flex-shrink-0">
            <Ban className="w-5 h-5 text-state-blocked" />
          </div>
          <div>
            <h3 className="font-bold text-state-blocked">
              🔴 Dinheiro Parado — Todos os leads estão bloqueados
            </h3>
            <p className="text-sm text-state-blocked/80">
              Clique em cada lead para ver o que está faltando
            </p>
          </div>
        </div>
      )}

      {/* Pipeline Summary Bar */}
      <div className="flex items-center gap-1 p-2 bg-muted/50 rounded-lg overflow-x-auto scrollbar-hide w-full max-w-full">
        {PIPELINE_STAGES.map((stage, idx) => {
          const config = STAGE_CONFIG[stage];
          const stats = stageStats[stage];
          const isLast = idx === PIPELINE_STAGES.length - 1;
          const hasBlockedLeads = stats.blocked > 0;
          
          return (
            <div key={stage} className="flex items-center flex-shrink-0">
              <div className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg min-w-fit",
                config.bgColor,
                config.borderColor,
                "border",
                hasBlockedLeads && "ring-2 ring-state-blocked/50"
              )}>
                <span className={cn("font-medium text-xs sm:text-sm whitespace-nowrap", config.textColor)}>
                  {STAGE_LABELS[stage]}
                </span>
                <Badge variant="secondary" className="h-5 sm:h-6 px-1.5 sm:px-2 text-xs sm:text-sm font-bold bg-white/80">
                  {stats.count}
                </Badge>
                {hasBlockedLeads && (
                  <Badge className="h-4 sm:h-5 px-1.5 text-[10px] sm:text-xs bg-state-blocked text-white flex items-center gap-1">
                    <Ban className="w-3 h-3" />
                    {stats.blocked}
                  </Badge>
                )}
                {stats.stale > 0 && !hasBlockedLeads && stage !== 'completed' && stage !== 'lost' && (
                  <Badge className="h-4 sm:h-5 px-1.5 text-[10px] sm:text-xs bg-state-risk text-white hidden sm:flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {stats.stale}
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

      {/* Main Pipeline Grid */}
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
                config.borderColor,
                stats.blocked > 0 && "ring-2 ring-state-blocked/30"
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

              {/* Leads List */}
              <ScrollArea className="h-[280px] sm:h-[350px] lg:h-[400px]">
                <div className="p-2 space-y-2">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      Nenhum lead
                    </div>
                  ) : (
                    stageLeads.map(lead => {
                      const stale = isStale(lead);
                      const blocked = isBlocked(lead);
                      const nextStatuses = getNextAllowedStatuses(lead.status);
                      const primaryNext = nextStatuses.find(s => s !== 'lost');
                      
                      return (
                        <div 
                          key={lead.id}
                          onClick={() => handleCardClick(lead)}
                          className={cn(
                            "p-3 rounded-lg border bg-card cursor-pointer transition-all",
                            "hover:shadow-md hover:border-primary/50",
                            blocked && "ring-2 ring-state-blocked/50 bg-state-blocked/5",
                            stale && !blocked && "ring-2 ring-state-risk/50 bg-state-risk/5"
                          )}
                        >
                          {/* Signal Badge - Highest Priority */}
                          <div className="mb-2">
                            <LeadSignalBadge lead={lead} compact />
                          </div>

                          {/* Lead Info */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm truncate">{lead.name}</h4>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <Phone className="w-3 h-3" />
                                <span>{lead.phone}</span>
                              </div>
                            </div>
                            {lead.budget && (
                              <span className="font-semibold text-sm text-state-success">
                                ${lead.budget.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Meta Row */}
                          <div className="flex items-center gap-2 text-xs">
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

                          {/* Single CTA - Only shows the one correct action */}
                          {primaryNext && !blocked && (
                            <div className="mt-3 pt-2 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                className={cn(
                                  "w-full h-8 text-xs font-medium",
                                  STAGE_CONFIG[primaryNext].bgColor,
                                  STAGE_CONFIG[primaryNext].textColor,
                                  "hover:opacity-90 border-2",
                                  STAGE_CONFIG[primaryNext].borderColor
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCardClick(lead);
                                }}
                              >
                                <ChevronRight className="w-3.5 h-3.5 mr-1" />
                                {stageActionLabel[primaryNext]}
                              </Button>
                            </div>
                          )}

                          {/* Blocked CTA */}
                          {blocked && (
                            <div className="mt-3 pt-2 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-8 text-xs font-medium bg-state-blocked/10 text-state-blocked border-state-blocked hover:bg-state-blocked/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCardClick(lead);
                                }}
                              >
                                <Ban className="w-3.5 h-3.5 mr-1" />
                                Desbloquear Lead
                              </Button>
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

      {/* Terminal States (Completed & Lost) */}
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

      {/* Lead Control Modal */}
      <LeadControlModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }}
        onRefresh={onRefresh}
      />
    </div>
  );
}
