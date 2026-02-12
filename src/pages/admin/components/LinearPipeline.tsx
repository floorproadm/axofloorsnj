import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  STAGE_LABELS, 
  STAGE_CONFIG,
  normalizeStatus,
  type PipelineStage 
} from "@/hooks/useLeadPipeline";
import { useLeadNRABatch } from "@/hooks/useLeadNRA";
import { LeadControlModal } from "@/components/admin/LeadControlModal";
import { LeadSignalBadge } from "@/components/admin/LeadSignalBadge";
import { 
  Phone, MapPin, 
  ChevronRight, Clock, CheckCircle, XCircle,
  CalendarCheck, FileText, Hammer, Ban, Users, Briefcase
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

export function LinearPipeline({ leads, onRefresh }: LinearPipelineProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'leads' | 'jobs'>('leads');
  

  // Batch NRA for all active leads
  const activeLeadIds = useMemo(() => 
    leads
      .filter(l => !['completed', 'lost'].includes(normalizeStatus(l.status)))
      .map(l => l.id),
    [leads]
  );
  const { nraMap } = useLeadNRABatch(activeLeadIds);

  // Separate leads vs jobs (leads with project = jobs)
  const { pureLeads, jobLeads } = useMemo(() => {
    const pure = leads.filter(l => !l.converted_to_project_id);
    const jobs = leads.filter(l => l.converted_to_project_id);
    return { pureLeads: pure, jobLeads: jobs };
  }, [leads]);

  // Current working set based on active tab
  const workingLeads = activeTab === 'leads' ? pureLeads : jobLeads;

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

    workingLeads.forEach(lead => {
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
  }, [workingLeads]);

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
      
      // Count blocked leads using NRA
      stats[s].blocked = stageLeads.filter(l => {
        const leadNra = nraMap[l.id];
        return leadNra && (leadNra.severity === 'critical' || leadNra.severity === 'blocked');
      }).length;
    });

    return stats;
  }, [leadsByStage, nraMap]);

  // Calculate total pipeline health
  const pipelineHealth = useMemo(() => {
    const activeLeads = workingLeads.filter(l => {
      const stage = normalizeStatus(l.status);
      return stage !== 'completed' && stage !== 'lost';
    });
    
    const totalValue = activeLeads.reduce((sum, l) => sum + (l.budget || 0), 0);
    const blockedCount = stageStats.proposal.blocked;
    const staleCount = Object.values(stageStats).reduce((sum, s) => sum + s.stale, 0);
    
    return { activeLeads: activeLeads.length, totalValue, blockedCount, staleCount };
  }, [workingLeads, stageStats]);

  // Global counts for tab badges
  const globalCounts = useMemo(() => {
    const pureActiveCount = pureLeads.filter(l => {
      const stage = normalizeStatus(l.status);
      return stage !== 'completed' && stage !== 'lost';
    }).length;
    
    const jobsActiveCount = jobLeads.filter(l => {
      const stage = normalizeStatus(l.status);
      return stage !== 'completed' && stage !== 'lost';
    }).length;
    
    return { leads: pureActiveCount, jobs: jobsActiveCount };
  }, [pureLeads, jobLeads]);

  // Sync selectedLead when leads data refreshes (e.g. after conversion)
  const syncedSelectedLead = useMemo(() => {
    if (!selectedLead) return null;
    return leads.find(l => l.id === selectedLead.id) || selectedLead;
  }, [leads, selectedLead]);

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleModalRefresh = () => {
    onRefresh();
    // Don't close modal — let it stay open and re-sync via syncedSelectedLead
  };

  const isStale = (lead: Lead) => {
    return differenceInHours(new Date(), new Date(lead.updated_at)) > 48;
  };

  const isBlocked = (lead: Lead) => {
    const leadNra = nraMap[lead.id];
    return leadNra && (leadNra.severity === 'critical' || leadNra.severity === 'blocked');
  };

  // All 4 active stages shown in both tabs — data filtering already separates leads vs jobs
  const activeStages: PipelineStage[] = ['new_lead', 'appt_scheduled', 'proposal', 'in_production'];

  // Empty state for entire dataset
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
      {/* Leads vs Jobs Tab Switcher */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'leads' | 'jobs')}>
          <TabsList className="h-11">
            <TabsTrigger 
              value="leads" 
              className="gap-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="w-4 h-4" />
              <span className="font-medium">Leads</span>
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {globalCounts.leads}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="jobs" 
              className="gap-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Briefcase className="w-4 h-4" />
              <span className="font-medium">Jobs</span>
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {globalCounts.jobs}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Context hint */}
        <p className="text-xs text-muted-foreground hidden sm:block">
          {activeTab === 'leads' 
            ? 'Contatos que ainda não viraram projeto' 
            : 'Leads com projeto vinculado em produção'}
        </p>
      </div>

      {/* Alert: All blocked (only in jobs tab) */}
      {allBlocked && activeTab === 'jobs' && (
        <div className="p-4 rounded-lg bg-state-blocked/10 border-2 border-state-blocked flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-state-blocked/20 flex items-center justify-center flex-shrink-0">
            <Ban className="w-5 h-5 text-state-blocked" />
          </div>
          <div>
            <h3 className="font-bold text-state-blocked">
              🔴 Dinheiro Parado — Todos os jobs estão bloqueados
            </h3>
            <p className="text-sm text-state-blocked/80">
              Clique em cada job para ver o que está faltando
            </p>
          </div>
        </div>
      )}

      {/* Empty state for current tab */}
      {workingLeads.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
          {activeTab === 'leads' ? (
            <>
              <Users className="w-10 h-10 text-muted-foreground/50 mb-3" />
              <h3 className="font-semibold text-muted-foreground">Nenhum lead novo</h3>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Todos os leads já foram convertidos em jobs
              </p>
            </>
          ) : (
            <>
              <Briefcase className="w-10 h-10 text-muted-foreground/50 mb-3" />
              <h3 className="font-semibold text-muted-foreground">Nenhum job ativo</h3>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Converta leads em projetos para vê-los aqui
              </p>
            </>
          )}
        </div>
      )}

      {/* Pipeline Summary Bar */}
      {workingLeads.length > 0 && (
      <div className="flex items-center gap-1 p-2 bg-muted/50 rounded-lg overflow-x-auto scrollbar-hide w-full max-w-full">
        {activeStages.map((stage, idx) => {
          const config = STAGE_CONFIG[stage];
          const stats = stageStats[stage];
          const isLast = idx === activeStages.length - 1;
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
                {stats.stale > 0 && !hasBlockedLeads && (
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
      )}

      {/* Main Pipeline Grid */}
      {workingLeads.length > 0 && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                      const leadNra = nraMap[lead.id];
                      
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
                            <LeadSignalBadge lead={lead} nra={leadNra} compact />
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

                          {/* NRA-driven CTA */}
                          {leadNra && leadNra.action !== 'none' && (
                            <div className="mt-3 pt-2 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                className={cn(
                                  "w-full h-8 text-xs font-medium",
                                  blocked
                                    ? "bg-state-blocked/10 text-state-blocked border-state-blocked hover:bg-state-blocked/20"
                                    : leadNra.severity === 'normal'
                                      ? "bg-state-success/10 text-state-success border-state-success hover:bg-state-success/20"
                                      : "bg-state-risk/10 text-state-risk border-state-risk hover:bg-state-risk/20"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCardClick(lead);
                                }}
                              >
                                {blocked ? (
                                  <Ban className="w-3.5 h-3.5 mr-1" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 mr-1" />
                                )}
                                {leadNra.label}
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
      )}

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
        lead={syncedSelectedLead}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }}
        onRefresh={handleModalRefresh}
      />
    </div>
  );
}
