import { useMemo, useState } from "react";
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
  Ban
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

// 7 sales stages (excludes in_production, completed, lost — those are in Jobs)
const SALES_STAGES: PipelineStage[] = [
  'cold_lead', 'warm_lead', 'estimate_requested', 
  'estimate_scheduled', 'in_draft', 'proposal_sent', 'proposal_rejected'
];

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
      cold_lead: [], warm_lead: [], estimate_requested: [],
      estimate_scheduled: [], in_draft: [], proposal_sent: [],
      proposal_rejected: [],
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

      {/* Kanban Board — horizontal scroll for 7 columns */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="flex gap-3 min-w-max">
          {SALES_STAGES.map(stage => {
            const config = STAGE_CONFIG[stage];
            const stageLeads = leadsByStage[stage];
            const stats = stageStats[stage];

            return (
              <div
                key={stage}
                className="w-[240px] sm:w-[260px] flex-shrink-0 flex flex-col"
              >
                {/* Column Header */}
                <div className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-t-xl border border-b-0",
                  config.bgColor
                )}>
                  <span className={cn("font-semibold text-xs truncate", config.textColor)}>
                    {STAGE_LABELS[stage]}
                  </span>
                </div>

                {/* Column Sub-header: count + value */}
                <div className={cn(
                  "flex items-center justify-between px-3 py-1.5 border-x text-xs",
                  config.bgColor, "border-b"
                )}>
                  <span className="text-muted-foreground font-medium">{stats.count}</span>
                  <span className="text-muted-foreground font-medium">
                    ${stats.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>

                {/* Cards Area */}
                <div className="flex-1 border border-t-0 rounded-b-xl bg-muted/20">
                  <ScrollArea className="h-[calc(100vh-320px)] min-h-[300px]">
                    <div className="p-1.5 space-y-1.5">
                      {stageLeads.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground/60 text-xs">
                          Nenhum lead
                        </div>
                      ) : (
                        stageLeads.map(lead => (
                          <PipelineCard
                            key={lead.id}
                            lead={lead}
                            nra={nraMap[lead.id]}
                            isStale={isStale(lead)}
                            isBlocked={isBlocked(lead)}
                            onClick={() => handleCardClick(lead)}
                          />
                        ))
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

// Extracted card component for cleaner code
function PipelineCard({ lead, nra, isStale, isBlocked, onClick }: {
  lead: Lead;
  nra: any;
  isStale: boolean;
  isBlocked: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-2.5 rounded-lg border bg-card cursor-pointer transition-all shadow-sm",
        "hover:shadow-md hover:border-primary/40",
        isBlocked && "ring-2 ring-state-blocked/50 bg-state-blocked/5",
        isStale && !isBlocked && "ring-2 ring-state-risk/50 bg-state-risk/5"
      )}
    >
      {/* Budget + signal */}
      <div className="flex items-start justify-between mb-1.5">
        <LeadSignalBadge lead={lead} nra={nra} compact />
        {lead.budget && (
          <span className="font-bold text-xs text-foreground">
            ${lead.budget.toLocaleString()}
          </span>
        )}
      </div>

      {/* Name + phone */}
      <div className="mb-1">
        <h4 className="font-semibold text-xs text-primary truncate">{lead.name}</h4>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
          <Phone className="w-2.5 h-2.5 flex-shrink-0" />
          <span>{lead.phone}</span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-1.5 text-[10px] flex-wrap">
        {lead.city && (
          <span className="flex items-center gap-0.5 text-muted-foreground">
            <MapPin className="w-2.5 h-2.5" />
            {lead.city}
          </span>
        )}
        <Badge variant="outline" className="text-[9px] px-1 py-0">
          {sourceLabels[lead.lead_source] || lead.lead_source}
        </Badge>
      </div>

      {/* NRA CTA */}
      {nra && nra.action !== 'none' && (
        <div className="mt-2 pt-1.5 border-t">
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "w-full h-6 text-[10px] font-medium",
              isBlocked
                ? "bg-state-blocked/10 text-state-blocked border-state-blocked hover:bg-state-blocked/20"
                : nra.severity === 'normal'
                  ? "bg-state-success/10 text-state-success border-state-success hover:bg-state-success/20"
                  : "bg-state-risk/10 text-state-risk border-state-risk hover:bg-state-risk/20"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            {isBlocked ? <Ban className="w-2.5 h-2.5 mr-1" /> : <ChevronRight className="w-2.5 h-2.5 mr-1" />}
            {nra.label}
          </Button>
        </div>
      )}

      {/* Footer date */}
      <div className="flex items-center justify-end mt-1.5 text-[9px] text-muted-foreground">
        <span>{format(new Date(lead.updated_at), "dd/MM HH:mm")}</span>
      </div>
    </div>
  );
}
