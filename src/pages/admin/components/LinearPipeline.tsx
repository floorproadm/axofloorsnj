import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  STAGE_LABELS, 
  STAGE_CONFIG,
  normalizeStatus,
  type PipelineStage 
} from "@/hooks/useLeadPipeline";
import { useLeadNRABatch } from "@/hooks/useLeadNRA";
import { LeadControlModal } from "@/components/admin/LeadControlModal";
import { 
  Phone, MapPin, 
  Clock, AlertTriangle
} from "lucide-react";
import { differenceInHours } from "date-fns";
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

const serviceLabels: Record<string, string> = {
  'new-installation': 'Installation',
  'sanding': 'Sanding',
  'refinishing': 'Refinishing',
  'staining': 'Staining',
  'repair': 'Repair',
  'vinyl': 'Vinyl',
  'baseboards': 'Baseboards',
  'staircase': 'Staircase',
};

function getTimeBadge(updatedAt: string) {
  const hours = differenceInHours(new Date(), new Date(updatedAt));
  if (hours < 24) return { text: `${hours}h`, className: 'bg-muted text-muted-foreground' };
  if (hours < 48) return { text: `${Math.round(hours)}h`, className: 'bg-amber-100 text-amber-700' };
  const days = Math.floor(hours / 24);
  return { text: `${days}d+`, className: 'bg-red-100 text-red-700 font-semibold' };
}

function getOperationalAlert(lead: Lead, nra: any) {
  if (nra?.severity === 'critical' || nra?.severity === 'blocked')
    return { text: nra.label, type: 'critical' as const };
  if (lead.follow_up_required)
    return { text: 'Follow-up obrigatório', type: 'warning' as const };
  if (nra?.action && nra.action !== 'none')
    return { text: nra.label, type: 'info' as const };
  return null;
}

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
      grouped[stage as PipelineStage].sort((a, b) => {
        // 1. Oldest first (most urgent)
        const timeA = new Date(a.updated_at).getTime();
        const timeB = new Date(b.updated_at).getTime();
        if (timeA !== timeB) return timeA - timeB;
        // 2. Higher value first
        const valA = a.budget || 0;
        const valB = b.budget || 0;
        if (valA !== valB) return valB - valA;
        // 3. Oldest created first
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
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
            <span className="text-xs text-muted-foreground block">Total Leads</span>
            <span className="text-xl font-bold text-foreground">{pipelineHealth.active}</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <span className="text-xs text-muted-foreground block">Valor Total</span>
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

function PipelineCard({ lead, nra, isStale, isBlocked, onClick }: {
  lead: Lead;
  nra: any;
  isStale: boolean;
  isBlocked: boolean;
  onClick: () => void;
}) {
  const timeBadge = getTimeBadge(lead.updated_at);
  const alert = getOperationalAlert(lead, nra);
  const services = Array.isArray(lead.services) ? lead.services : [];
  const visibleServices = services.slice(0, 2);
  const overflowCount = services.length - 2;

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border bg-card cursor-pointer transition-all",
        "hover:shadow-md hover:border-primary/40",
        isBlocked && "ring-2 ring-red-500/50 bg-red-50/5",
        isStale && !isBlocked && "ring-2 ring-amber-500/50 bg-amber-50/5"
      )}
    >
      {/* Row 1: TimeBadge + Name + Value */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0",
            timeBadge.className
          )}>
            {timeBadge.text}
          </span>
          <span className="font-semibold text-xs text-foreground truncate">
            {lead.name.toUpperCase()}
          </span>
        </div>
        <span className="font-bold text-xs text-foreground whitespace-nowrap flex-shrink-0">
          {lead.budget ? `$${lead.budget.toLocaleString()}` : '—'}
        </span>
      </div>

      {/* Row 2: Contact */}
      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
        <a
          href={`tel:${lead.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-0.5 hover:text-primary transition-colors"
        >
          <Phone className="w-2.5 h-2.5 flex-shrink-0" />
          <span>{lead.phone}</span>
        </a>
        {lead.city && (
          <span className="flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            {lead.city}
          </span>
        )}
        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
          {sourceLabels[lead.lead_source] || lead.lead_source}
        </Badge>
      </div>

      {/* Row 3: Services */}
      {services.length > 0 && (
        <div className="flex items-center gap-1 mt-1.5">
          {visibleServices.map(s => (
            <Badge key={s} variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
              {serviceLabels[s] || s}
            </Badge>
          ))}
          {overflowCount > 0 && (
            <span className="text-[9px] text-muted-foreground font-medium">+{overflowCount}</span>
          )}
        </div>
      )}

      {/* Operational Alert (conditional) */}
      {alert && (
        <div className={cn(
          "flex items-center gap-1 mt-1.5 pt-1.5 border-t text-[10px] font-medium",
          alert.type === 'critical' && "text-red-600",
          alert.type === 'warning' && "text-amber-600",
          alert.type === 'info' && "text-blue-600"
        )}>
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{alert.text}</span>
        </div>
      )}
    </div>
  );
}
