import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { LeadPipelineStatus } from "@/components/admin/LeadPipelineStatus";
import { LeadFollowUpAlert } from "@/components/admin/LeadFollowUpAlert";
import { JobProofUploader } from "@/components/admin/JobProofUploader";
import { PIPELINE_STAGES, STAGE_LABELS, type PipelineStage } from "@/hooks/useLeadPipeline";
import { 
  Users, Phone, Mail, MapPin, Calendar, DollarSign, 
  MessageSquare, Tag, Home, Bell, Camera, Clock,
  ArrowRight, CheckCircle, XCircle
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

interface LeadsPipelineProps {
  leads: Lead[];
  onRefresh: () => void;
}

const stageConfig: Record<PipelineStage, { 
  color: string; 
  bgColor: string; 
  borderColor: string;
  icon: React.ReactNode;
}> = {
  new: { 
    color: "text-blue-700", 
    bgColor: "bg-blue-50", 
    borderColor: "border-blue-200",
    icon: <Clock className="w-4 h-4" />
  },
  contacted: { 
    color: "text-amber-700", 
    bgColor: "bg-amber-50", 
    borderColor: "border-amber-200",
    icon: <Phone className="w-4 h-4" />
  },
  quoted: { 
    color: "text-purple-700", 
    bgColor: "bg-purple-50", 
    borderColor: "border-purple-200",
    icon: <DollarSign className="w-4 h-4" />
  },
  won: { 
    color: "text-green-700", 
    bgColor: "bg-green-50", 
    borderColor: "border-green-200",
    icon: <CheckCircle className="w-4 h-4" />
  },
  lost: { 
    color: "text-red-700", 
    bgColor: "bg-red-50", 
    borderColor: "border-red-200",
    icon: <XCircle className="w-4 h-4" />
  }
};

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-orange-100 text-orange-700",
  high: "bg-red-100 text-red-700"
};

const sourceLabels: Record<string, string> = {
  quiz: "Quiz",
  contact_form: "Formulário",
  contact_page: "Contato",
  builders_page: "Builders",
  realtors_page: "Realtors",
  lead_magnet: "Lead Magnet"
};

export function LeadsPipeline({ leads, onRefresh }: LeadsPipelineProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Group leads by status
  const leadsByStage = useMemo(() => {
    const grouped: Record<PipelineStage, Lead[]> = {
      new: [],
      contacted: [],
      quoted: [],
      won: [],
      lost: []
    };

    leads.forEach(lead => {
      const stage = lead.status as PipelineStage;
      if (grouped[stage]) {
        grouped[stage].push(lead);
      }
    });

    return grouped;
  }, [leads]);

  // Calculate stage totals and values
  const stageTotals = useMemo(() => {
    const totals: Record<PipelineStage, { count: number; value: number }> = {
      new: { count: 0, value: 0 },
      contacted: { count: 0, value: 0 },
      quoted: { count: 0, value: 0 },
      won: { count: 0, value: 0 },
      lost: { count: 0, value: 0 }
    };

    Object.entries(leadsByStage).forEach(([stage, stageLeads]) => {
      totals[stage as PipelineStage] = {
        count: stageLeads.length,
        value: stageLeads.reduce((sum, lead) => sum + (lead.budget || 0), 0)
      };
    });

    return totals;
  }, [leadsByStage]);

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

  const isStale = (lead: Lead) => {
    const hours = differenceInHours(new Date(), new Date(lead.updated_at));
    return hours > 48;
  };

  const needsFollowUp = (lead: Lead) => {
    return lead.status === 'quoted' && (!lead.follow_up_actions || lead.follow_up_actions.length === 0);
  };

  return (
    <div className="space-y-4">
      {/* Pipeline Header Stats */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {PIPELINE_STAGES.map(stage => {
          const config = stageConfig[stage];
          const { count, value } = stageTotals[stage];
          return (
            <div 
              key={stage}
              className={cn(
                "p-3 rounded-lg border-2",
                config.bgColor,
                config.borderColor
              )}
            >
              <div className={cn("flex items-center gap-2 font-semibold text-sm", config.color)}>
                {config.icon}
                {STAGE_LABELS[stage]}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={cn("text-2xl font-bold", config.color)}>{count}</span>
                {value > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ${(value / 1000).toFixed(0)}k
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Columns */}
      <div className="grid grid-cols-5 gap-3 min-h-[500px]">
        {PIPELINE_STAGES.map(stage => {
          const config = stageConfig[stage];
          const stageLeads = leadsByStage[stage];
          
          return (
            <div 
              key={stage}
              className={cn(
                "rounded-lg border-2 p-2",
                config.bgColor,
                config.borderColor
              )}
            >
              {/* Column Header */}
              <div className={cn(
                "flex items-center justify-between px-2 py-1 mb-2 rounded",
                config.color
              )}>
                <span className="font-semibold text-sm flex items-center gap-1">
                  {config.icon}
                  {STAGE_LABELS[stage]}
                </span>
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {stageLeads.length}
                </Badge>
              </div>

              {/* Lead Cards */}
              <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
                {stageLeads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    Nenhum lead
                  </div>
                ) : (
                  stageLeads.map(lead => {
                    const stale = isStale(lead);
                    const needsFollow = needsFollowUp(lead);
                    
                    return (
                      <Card 
                        key={lead.id}
                        onClick={() => handleCardClick(lead)}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5",
                          "border bg-card",
                          stale && "ring-2 ring-orange-400",
                          needsFollow && "ring-2 ring-amber-400"
                        )}
                      >
                        <CardContent className="p-3 space-y-2">
                          {/* Alerts */}
                          {(stale || needsFollow) && (
                            <div className="flex gap-1 flex-wrap">
                              {stale && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  +48h
                                </Badge>
                              )}
                              {needsFollow && (
                                <Badge className="bg-amber-500 text-[10px] px-1.5 py-0">
                                  Follow-up
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Name & Priority */}
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-medium text-sm leading-tight line-clamp-2">
                              {lead.name}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px] px-1 py-0 shrink-0",
                                priorityColors[lead.priority as keyof typeof priorityColors]
                              )}
                            >
                              {lead.priority}
                            </Badge>
                          </div>

                          {/* Contact */}
                          <div className="space-y-0.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1 truncate">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span className="truncate">{lead.phone}</span>
                            </div>
                            {lead.city && (
                              <div className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{lead.city}</span>
                              </div>
                            )}
                          </div>

                          {/* Budget & Source */}
                          <div className="flex items-center justify-between text-xs">
                            {lead.budget ? (
                              <span className="font-semibold text-green-700">
                                ${lead.budget.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {sourceLabels[lead.lead_source] || lead.lead_source}
                            </Badge>
                          </div>

                          {/* Date */}
                          <div className="text-[10px] text-muted-foreground">
                            {format(new Date(lead.created_at), "dd/MM HH:mm")}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Detalhes do Lead</DialogTitle>
            <DialogDescription>
              Informações completas e ações disponíveis
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6 py-4">
              {/* Pipeline Status Control */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Status:</span>
                <LeadPipelineStatus 
                  leadId={selectedLead.id}
                  currentStatus={selectedLead.status}
                  onStatusChange={() => {
                    onRefresh();
                    setIsDetailModalOpen(false);
                  }}
                />
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Informações de Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{selectedLead.name}</p>
                  </div>
                  
                  {selectedLead.email && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Email
                      </p>
                      <a 
                        href={`mailto:${selectedLead.email}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {selectedLead.email}
                      </a>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Telefone
                    </p>
                    <a 
                      href={`tel:${selectedLead.phone}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {selectedLead.phone}
                    </a>
                  </div>

                  {selectedLead.city && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Cidade
                      </p>
                      <p className="font-medium">{selectedLead.city}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Details */}
              {(selectedLead.services.length > 0 || selectedLead.budget) && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Home className="w-5 h-5 text-primary" />
                      Detalhes do Projeto
                    </h3>
                    <div className="space-y-4">
                      {selectedLead.services.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Tag className="w-3 h-3" /> Serviços
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedLead.services.map((service, idx) => (
                              <Badge key={idx} variant="secondary">{service}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedLead.budget && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> Orçamento
                          </p>
                          <p className="font-medium text-lg text-green-700">
                            ${selectedLead.budget.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              {selectedLead.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      Observações
                    </h3>
                    <p className="text-sm bg-muted p-3 rounded-lg">{selectedLead.notes}</p>
                  </div>
                </>
              )}

              {/* Follow-Up Section */}
              {selectedLead.status === 'quoted' && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-primary" />
                      Follow-Up Obrigatório
                    </h3>
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

              {/* Job Proof Section */}
              {selectedLead.converted_to_project_id && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-primary" />
                      Prova de Trabalho
                    </h3>
                    <JobProofUploader projectId={selectedLead.converted_to_project_id} />
                  </div>
                </>
              )}

              {/* Timestamps */}
              <Separator />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  Criado: {format(new Date(selectedLead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
                <span>
                  Atualizado: {format(new Date(selectedLead.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
