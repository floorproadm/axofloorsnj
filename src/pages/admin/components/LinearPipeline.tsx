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
  Ban, Filter
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

const SALES_STAGES: PipelineStage[] = ['new_lead', 'appt_scheduled', 'proposal'];

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

  const salesLeads = useMemo(() => 
    leads.filter(l => SALES_STAGES.includes(normalizeStatus(l.status) as PipelineStage)), 
    [leads]
  );

  const activeLeadIds = useMemo(() => 
    salesLeads
      .filter(l => !['completed', 'lost'].includes(normalizeStatus(l.status)))
      .map(l => l.id),
    [salesLeads]
  );
  const { nraMap } = useLeadNRABatch(activeLeadIds);

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

  const pipelineHealth = useMemo(() => {
    const active = SALES_STAGES.reduce((sum, s) => sum + (stageStats[s]?.count || 0), 0);
    const totalValue = SALES_STAGES.reduce((sum, s) => sum + (stageStats[s]?.value || 0), 0);
    return { active, totalValue };
  }, [stageStats]);

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
    <div className="space-y-3">
      {/* Top Summary Bar */}
      <div className="flex items-center justify-between bg-card border rounded-xl px-4 py-3">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs text-muted-foreground block">Total Deals</span>
            <span className="text-xl font-bold text-foreground">{pipelineHealth.active}</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <span className="text-xs text-muted-foreground block">Total Value</span>
            <span className="text-xl font-bold text-primary">
              ${pipelineHealth.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Kanban Board — horizontal scroll */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="flex gap-3 min-w-max lg:min-w-0 lg:grid lg:grid-cols-3">
          {SALES_STAGES.map(stage => {
            const config = STAGE_CONFIG[stage];
            const stageLeads = leadsByStage[stage];
            const stats = stageStats[stage];

            return (
              <div
                key={stage}
                className="w-[280px] sm:w-[300px] lg:w-auto flex-shrink-0 lg:flex-shrink flex flex-col"
              >
                {/* Column Header */}
                <div className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-t-xl border border-b-0",
                  config.bgColor
                )}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn("font-semibold text-sm truncate", config.textColor)}>
                      {STAGE_LABELS[stage]}
                    </span>
                    <Filter className={cn("w-3.5 h-3.5 flex-shrink-0", config.color)} />
                  </div>
                </div>

                {/* Column Sub-header: count + value */}
                <div className={cn(
                  "flex items-center justify-between px-3 py-1.5 border-x text-xs",
                  config.bgColor, "border-b"
                )}>
                  <span className="text-muted-foreground font-medium">{stats.count} Deals</span>
                  <span className="text-muted-foreground font-medium">
                    ${stats.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Cards Area */}
                <div className={cn(
                  "flex-1 border border-t-0 rounded-b-xl bg-muted/20"
                )}>
                  <ScrollArea className="h-[calc(100vh-320px)] min-h-[300px]">
                    <div className="p-2 space-y-2">
                      {stageLeads.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground/60 text-sm">
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
                                "p-3 rounded-lg border bg-card cursor-pointer transition-all shadow-sm",
                                "hover:shadow-md hover:border-primary/40",
                                blocked && "ring-2 ring-state-blocked/50 bg-state-blocked/5",
                                stale && !blocked && "ring-2 ring-state-risk/50 bg-state-risk/5"
                              )}
                            >
                              {/* Budget + actions row */}
                              <div className="flex items-start justify-between mb-2">
                                <LeadSignalBadge lead={lead} nra={leadNra} compact />
                                {lead.budget && (
                                  <span className="font-bold text-sm text-foreground">
                                    ${lead.budget.toLocaleString()}
                                  </span>
                                )}
                              </div>

                              {/* Name + phone */}
                              <div className="mb-1.5">
                                <h4 className="font-semibold text-sm text-primary truncate">{lead.name}</h4>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                  <Phone className="w-3 h-3 flex-shrink-0" />
                                  <span>{lead.phone}</span>
                                </div>
                              </div>

                              {/* Meta row */}
                              <div className="flex items-center gap-2 text-xs flex-wrap">
                                {lead.city && (
                                  <span className="flex items-center gap-0.5 text-muted-foreground">
                                    <MapPin className="w-3 h-3" />
                                    {lead.city}
                                  </span>
                                )}
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {sourceLabels[lead.lead_source] || lead.lead_source}
                                </Badge>
                              </div>

                              {/* NRA CTA */}
                              {leadNra && leadNra.action !== 'none' && (
                                <div className="mt-2.5 pt-2 border-t">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={cn(
                                      "w-full h-7 text-xs font-medium",
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
                                    {blocked ? <Ban className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                                    {leadNra.label}
                                  </Button>
                                </div>
                              )}

                              {/* Footer: date */}
                              <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                                <span>{format(new Date(lead.updated_at), "dd/MM HH:mm")}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            );
          })}
        </div>
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
