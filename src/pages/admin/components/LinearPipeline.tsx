import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ChevronRight, Clock,
  CalendarCheck, FileText, Ban,
  TrendingUp, TrendingDown, Target
} from "lucide-react";
import { format, differenceInHours, subDays } from "date-fns";
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

// 3 estágios de vendas — produção e conclusão ficam em /admin/jobs
const SALES_STAGES: PipelineStage[] = ['new_lead', 'appt_scheduled', 'proposal'];

const stageIcons: Record<string, React.ReactNode> = {
  new_lead: <Clock className="w-5 h-5" />,
  appt_scheduled: <CalendarCheck className="w-5 h-5" />,
  proposal: <FileText className="w-5 h-5" />,
};

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

  // Sales leads = those in sales stages (new_lead, appt_scheduled, proposal)
  // NOT filtered by converted_to_project_id — proposal stage REQUIRES a project
  const salesLeads = useMemo(() => 
    leads.filter(l => SALES_STAGES.includes(normalizeStatus(l.status) as PipelineStage)), 
    [leads]
  );

  // Batch NRA for active sales leads
  const activeLeadIds = useMemo(() => 
    salesLeads
      .filter(l => !['completed', 'lost'].includes(normalizeStatus(l.status)))
      .map(l => l.id),
    [salesLeads]
  );
  const { nraMap } = useLeadNRABatch(activeLeadIds);

  // Group by stage
  const leadsByStage = useMemo(() => {
    const grouped: Record<PipelineStage, Lead[]> = {
      new_lead: [], appt_scheduled: [], proposal: [],
      in_production: [], completed: [], lost: []
    };
    salesLeads.forEach(lead => {
      const stage = normalizeStatus(lead.status);
      grouped[stage].push(lead);
    });
    Object.keys(grouped).forEach(stage => {
      grouped[stage as PipelineStage].sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
    return grouped;
  }, [salesLeads]);

  // Stats per stage
  const stageStats = useMemo(() => {
    const stats: Record<string, { count: number; value: number; stale: number; blocked: number }> = {};
    SALES_STAGES.forEach(stage => {
      const stageLeads = leadsByStage[stage];
      stats[stage] = {
        count: stageLeads.length,
        value: stageLeads.reduce((sum, l) => sum + (l.budget || 0), 0),
        stale: stageLeads.filter(l => differenceInHours(new Date(), new Date(l.updated_at)) > 48).length,
        blocked: stageLeads.filter(l => {
          const nra = nraMap[l.id];
          return nra && (nra.severity === 'critical' || nra.severity === 'blocked');
        }).length,
      };
    });
    return stats;
  }, [leadsByStage, nraMap]);

  // Pipeline totals
  const pipelineHealth = useMemo(() => {
    const active = SALES_STAGES.reduce((sum, s) => sum + (stageStats[s]?.count || 0), 0);
    const totalValue = SALES_STAGES.reduce((sum, s) => sum + (stageStats[s]?.value || 0), 0);
    const blockedCount = SALES_STAGES.reduce((sum, s) => sum + (stageStats[s]?.blocked || 0), 0);
    const staleCount = SALES_STAGES.reduce((sum, s) => sum + (stageStats[s]?.stale || 0), 0);
    return { active, totalValue, blockedCount, staleCount };
  }, [stageStats]);

  // Conversion metrics (last 30 days)
  const conversionMetrics = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recent = leads.filter(l => new Date(l.created_at) >= thirtyDaysAgo);
    const total = recent.length;
    const converted = recent.filter(l => l.converted_to_project_id).length;
    const lost = recent.filter(l => normalizeStatus(l.status) === 'lost').length;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;
    const lossRate = total > 0 ? (lost / total) * 100 : 0;
    return { total, converted, lost, conversionRate, lossRate };
  }, [leads]);

  // Sync selected lead with refreshed data
  const syncedSelectedLead = useMemo(() => {
    if (!selectedLead) return null;
    return leads.find(l => l.id === selectedLead.id) || selectedLead;
  }, [leads, selectedLead]);

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const isStale = (lead: Lead) => differenceInHours(new Date(), new Date(lead.updated_at)) > 48;
  const isBlocked = (lead: Lead) => {
    const nra = nraMap[lead.id];
    return nra && (nra.severity === 'critical' || nra.severity === 'blocked');
  };

  // Empty state
  if (salesLeads.length === 0) {
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

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Financial Summary */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Pipeline de Vendas</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-state-success/10 border border-state-success/30">
            <span className="text-xs text-muted-foreground">Pipeline</span>
            <span className="text-sm font-bold text-state-success">
              ${(pipelineHealth.totalValue / 1000).toFixed(pipelineHealth.totalValue >= 1000 ? 0 : 1)}k
            </span>
          </div>
          {pipelineHealth.blockedCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-state-blocked/10 border border-state-blocked/30">
              <Ban className="w-3.5 h-3.5 text-state-blocked" />
              <span className="text-sm font-bold text-state-blocked">{pipelineHealth.blockedCount}</span>
            </div>
          )}
          {pipelineHealth.staleCount > 0 && pipelineHealth.blockedCount === 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-state-risk/10 border border-state-risk/30">
              <Clock className="w-3.5 h-3.5 text-state-risk" />
              <span className="text-sm font-bold text-state-risk">{pipelineHealth.staleCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center gap-1 p-2 bg-muted/50 rounded-lg overflow-x-auto scrollbar-hide w-full max-w-full">
        {SALES_STAGES.map((stage, idx) => {
          const config = STAGE_CONFIG[stage];
          const stats = stageStats[stage];
          const isLast = idx === SALES_STAGES.length - 1;
          const hasBlockedLeads = stats.blocked > 0;
          
          return (
            <div key={stage} className="flex items-center flex-shrink-0">
              <div className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg min-w-fit",
                config.bgColor, config.borderColor, "border",
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

      {/* 3-Column Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {SALES_STAGES.map(stage => {
          const config = STAGE_CONFIG[stage];
          const stageLeads = leadsByStage[stage];
          const stats = stageStats[stage];
          
          return (
            <Card 
              key={stage} 
              className={cn(
                "border-2", config.borderColor,
                stats.blocked > 0 && "ring-2 ring-state-blocked/30"
              )}
            >
              {/* Stage Header */}
               <div className={cn(
                "flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b",
                config.bgColor
              )}>
                <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                  <span className={cn("w-4 h-4 md:w-5 md:h-5 flex-shrink-0", config.color)}>{stageIcons[stage]}</span>
                  <span className={cn("font-semibold text-sm md:text-base truncate", config.textColor)}>
                    {STAGE_LABELS[stage]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                  {stats.value > 0 && (
                    <span className="text-[10px] md:text-xs text-muted-foreground">
                      ${(stats.value / 1000).toFixed(0)}k
                    </span>
                  )}
                  <Badge variant="outline" className={cn("font-bold text-xs", config.textColor)}>
                    {stats.count}
                  </Badge>
                </div>
              </div>

              {/* Lead Cards */}
              <ScrollArea className="h-[280px] md:h-[350px] lg:h-[400px]">
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
                          {/* Signal Badge */}
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

                          {/* Meta */}
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

                          {/* NRA CTA */}
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

      {/* 30-Day Conversion Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 md:p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Leads 30d</span>
          </div>
          <span className="text-xl md:text-2xl font-bold text-foreground">{conversionMetrics.total}</span>
        </Card>
        <Card className="p-3 md:p-4 border border-state-success/30 bg-state-success/5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-state-success" />
            <span className="text-xs text-muted-foreground">Convertidos</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold text-state-success">{conversionMetrics.converted}</span>
            <span className="text-xs font-medium text-state-success">{conversionMetrics.conversionRate.toFixed(0)}%</span>
          </div>
        </Card>
        <Card className="p-3 md:p-4 border border-state-blocked/30 bg-state-blocked/5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-state-blocked" />
            <span className="text-xs text-muted-foreground">Perdidos</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold text-state-blocked">{conversionMetrics.lost}</span>
            <span className="text-xs font-medium text-state-blocked">{conversionMetrics.lossRate.toFixed(0)}%</span>
          </div>
        </Card>
        <Card className="p-3 md:p-4 border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 mb-1">
            <ChevronRight className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Taxa Conversão</span>
          </div>
          <span className={cn(
            "text-xl md:text-2xl font-bold",
            conversionMetrics.conversionRate >= 30 ? "text-state-success" :
            conversionMetrics.conversionRate >= 15 ? "text-state-risk" :
            "text-state-blocked"
          )}>
            {conversionMetrics.conversionRate.toFixed(1)}%
          </span>
        </Card>
      </div>
      <LeadControlModal
        lead={syncedSelectedLead}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }}
        onRefresh={() => onRefresh()}
      />
    </div>
  );
}
