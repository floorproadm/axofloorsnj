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
import { 
  Phone, MapPin, 
  Clock, AlertTriangle,
  LayoutGrid, List,
  UserPlus, CalendarPlus, FileText, PlusCircle
} from "lucide-react";
import { differenceInHours, format } from "date-fns";
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

type ViewMode = 'board' | 'list';

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
  const [viewMode, setViewMode] = useState<ViewMode>('board');

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
        const timeA = new Date(a.updated_at).getTime();
        const timeB = new Date(b.updated_at).getTime();
        if (timeA !== timeB) return timeA - timeB;
        const valA = a.budget || 0;
        const valB = b.budget || 0;
        if (valA !== valB) return valB - valA;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    });
    return grouped;
  }, [salesLeads]);

  // Flat sorted list for list view
  const sortedLeads = useMemo(() => {
    return [...salesLeads].sort((a, b) => {
      const timeA = new Date(a.updated_at).getTime();
      const timeB = new Date(b.updated_at).getTime();
      if (timeA !== timeB) return timeA - timeB;
      const valA = a.budget || 0;
      const valB = b.budget || 0;
      if (valA !== valB) return valB - valA;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
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
      <div className="bg-card border rounded-xl px-3 sm:px-4 py-3 space-y-2">
        {/* Row 1: Stats + View Toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-4">
            <div>
              <span className="text-[10px] sm:text-xs text-muted-foreground block">Total Leads</span>
              <span className="text-lg sm:text-xl font-bold text-foreground">{pipelineHealth.active}</span>
            </div>
            <div className="h-6 sm:h-8 w-px bg-border" />
            <div>
              <span className="text-[10px] sm:text-xs text-muted-foreground block">Valor Total</span>
              <span className="text-lg sm:text-xl font-bold text-primary">
                ${pipelineHealth.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden flex-shrink-0">
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                "flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === 'board'
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors border-l",
                viewMode === 'list'
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Row 2: Action Buttons — scrollable on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 sm:h-8 flex-shrink-0"
            onClick={() => {/* TODO */}}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">New</span> Lead
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 sm:h-8 flex-shrink-0"
            onClick={() => {/* TODO */}}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">New</span> Appt.
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 sm:h-8 flex-shrink-0"
            onClick={() => {/* TODO */}}
          >
            <FileText className="w-3.5 h-3.5" />
            Proposal
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 sm:h-8 flex-shrink-0"
            onClick={() => {/* TODO */}}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Request
          </Button>
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
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
                  <div className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-t-xl border border-b-0",
                    config.bgColor
                  )}>
                    <span className={cn("font-semibold text-xs truncate", config.textColor)}>
                      {STAGE_LABELS[stage]}
                    </span>
                  </div>

                  <div className={cn(
                    "flex items-center justify-between px-3 py-1.5 border-x text-xs",
                    config.bgColor, "border-b"
                  )}>
                    <span className="text-muted-foreground font-medium">{stats.count}</span>
                    <span className="text-muted-foreground font-medium">
                      ${stats.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>

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
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="border rounded-xl bg-card overflow-hidden">
          {/* Table Header — hidden on mobile */}
          <div className="hidden md:grid grid-cols-[1fr_120px_120px_140px_100px_80px] gap-2 px-4 py-2.5 bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Lead</span>
            <span>Estágio</span>
            <span>Contato</span>
            <span>Serviços</span>
            <span className="text-right">Valor</span>
            <span className="text-right">Tempo</span>
          </div>
          {/* Table Body */}
          <ScrollArea className="h-[calc(100vh-320px)] min-h-[300px]">
            {sortedLeads.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground/60 text-xs">
                Nenhum lead
              </div>
            ) : (
              sortedLeads.map(lead => (
                <PipelineListRow
                  key={lead.id}
                  lead={lead}
                  nra={nraMap[lead.id]}
                  isStale={isStale(lead)}
                  isBlocked={isBlocked(lead)}
                  onClick={() => handleCardClick(lead)}
                />
              ))
            )}
          </ScrollArea>
        </div>
      )}

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

/* ─── Board Card ─── */
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
        isBlocked && "ring-2 ring-destructive/50 bg-destructive/5",
        isStale && !isBlocked && "ring-2 ring-[hsl(var(--state-risk))]/50 bg-[hsl(var(--state-risk))]/5"
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
          alert.type === 'critical' && "text-destructive",
          alert.type === 'warning' && "text-[hsl(var(--state-risk))]",
          alert.type === 'info' && "text-primary"
        )}>
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{alert.text}</span>
        </div>
      )}
    </div>
  );
}

/* ─── List Row ─── */
function PipelineListRow({ lead, nra, isStale, isBlocked, onClick }: {
  lead: Lead;
  nra: any;
  isStale: boolean;
  isBlocked: boolean;
  onClick: () => void;
}) {
  const timeBadge = getTimeBadge(lead.updated_at);
  const alert = getOperationalAlert(lead, nra);
  const services = Array.isArray(lead.services) ? lead.services : [];
  const stage = normalizeStatus(lead.status);
  const config = STAGE_CONFIG[stage];

  return (
    <>
      {/* Desktop row */}
      <div
        onClick={onClick}
        className={cn(
          "hidden md:grid grid-cols-[1fr_120px_120px_140px_100px_80px] gap-2 px-4 py-2.5 border-b cursor-pointer transition-colors",
          "hover:bg-muted/40",
          isBlocked && "bg-destructive/5",
          isStale && !isBlocked && "bg-[hsl(var(--state-risk))]/5"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-xs text-foreground truncate">{lead.name}</span>
          {alert && (
            <AlertTriangle className={cn(
              "w-3 h-3 flex-shrink-0",
              alert.type === 'critical' && "text-destructive",
              alert.type === 'warning' && "text-[hsl(var(--state-risk))]",
              alert.type === 'info' && "text-primary"
            )} />
          )}
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 flex-shrink-0">
            {sourceLabels[lead.lead_source] || lead.lead_source}
          </Badge>
        </div>
        <div className="flex items-center">
          <Badge className={cn("text-[9px] px-1.5 py-0 h-4", config.bgColor, config.textColor, "border-0")}>
            {STAGE_LABELS[stage]}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground min-w-0">
          <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-0.5 hover:text-primary transition-colors truncate">
            <Phone className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </a>
        </div>
        <div className="flex items-center gap-1 min-w-0">
          {services.slice(0, 2).map(s => (
            <Badge key={s} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 flex-shrink-0">
              {serviceLabels[s] || s}
            </Badge>
          ))}
          {services.length > 2 && <span className="text-[9px] text-muted-foreground">+{services.length - 2}</span>}
        </div>
        <div className="flex items-center justify-end">
          <span className="font-bold text-xs text-foreground">{lead.budget ? `$${lead.budget.toLocaleString()}` : '—'}</span>
        </div>
        <div className="flex items-center justify-end">
          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium", timeBadge.className)}>{timeBadge.text}</span>
        </div>
      </div>

      {/* Mobile card row */}
      <div
        onClick={onClick}
        className={cn(
          "md:hidden flex flex-col gap-1.5 px-3 py-2.5 border-b cursor-pointer transition-colors",
          "hover:bg-muted/40 active:bg-muted/60",
          isBlocked && "bg-destructive/5",
          isStale && !isBlocked && "bg-[hsl(var(--state-risk))]/5"
        )}
      >
        {/* Row 1: Time + Name + Value */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0", timeBadge.className)}>
              {timeBadge.text}
            </span>
            <span className="font-semibold text-xs text-foreground truncate">{lead.name}</span>
          </div>
          <span className="font-bold text-xs text-foreground whitespace-nowrap flex-shrink-0">
            {lead.budget ? `$${lead.budget.toLocaleString()}` : '—'}
          </span>
        </div>
        {/* Row 2: Stage + Contact */}
        <div className="flex items-center gap-2 text-[10px]">
          <Badge className={cn("text-[9px] px-1.5 py-0 h-4 flex-shrink-0", config.bgColor, config.textColor, "border-0")}>
            {STAGE_LABELS[stage]}
          </Badge>
          <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors">
            <Phone className="w-2.5 h-2.5" />
            <span>{lead.phone}</span>
          </a>
          {lead.city && (
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <MapPin className="w-2.5 h-2.5" />
              {lead.city}
            </span>
          )}
        </div>
        {/* Row 3: Alert (if any) */}
        {alert && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-medium",
            alert.type === 'critical' && "text-destructive",
            alert.type === 'warning' && "text-[hsl(var(--state-risk))]",
            alert.type === 'info' && "text-primary"
          )}>
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{alert.text}</span>
          </div>
        )}
      </div>
    </>
  );
}
