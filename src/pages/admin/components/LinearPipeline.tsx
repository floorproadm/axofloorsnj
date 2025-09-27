import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Phone, 
  Mail, 
  ArrowRight, 
  Calendar, 
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  MapPin,
  ChevronRight,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  lead_source: string;
  status: string;
  priority: string;
  services: string[];
  budget?: number;
  room_size?: string;
  city?: string;
  location?: string;
  address?: string;
  message?: string;
  notes?: string;
  created_at: string;
  follow_up_date?: string;
  last_contacted_at?: string;
}

interface LinearPipelineProps {
  leads: Lead[];
  onLeadUpdate: (lead: Lead) => void;
  isLoading: boolean;
}

const PIPELINE_STAGES = [
  {
    key: 'new',
    title: 'Novos Leads',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: AlertCircle,
    nextActions: ['Ligar', 'Email', 'WhatsApp'],
    nextStatuses: ['contacted']
  },
  {
    key: 'contacted',
    title: 'Contatados',
    color: 'bg-yellow-50 border-yellow-200',
    headerColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    icon: Phone,
    nextActions: ['Agendar Visita', 'Enviar Orçamento', 'Follow-up'],
    nextStatuses: ['qualified', 'lost']
  },
  {
    key: 'qualified',
    title: 'Qualificados',
    color: 'bg-orange-50 border-orange-200',
    headerColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    icon: CheckCircle,
    nextActions: ['Apresentar Proposta', 'Negociar', 'Fechar'],
    nextStatuses: ['proposal', 'converted', 'lost']
  },
  {
    key: 'proposal',
    title: 'Proposta Enviada',
    color: 'bg-purple-50 border-purple-200',
    headerColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    icon: TrendingUp,
    nextActions: ['Follow-up Proposta', 'Negociar Preço', 'Fechar'],
    nextStatuses: ['converted', 'lost']
  },
  {
    key: 'converted',
    title: 'Convertidos',
    color: 'bg-green-50 border-green-200',
    headerColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: CheckCircle,
    nextActions: ['Criar Projeto', 'Agendar Início'],
    nextStatuses: []
  }
];

export function LinearPipeline({ leads, onLeadUpdate, isLoading }: LinearPipelineProps) {
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const updateLeadStatus = async (leadId: string, newStatus: string, notes?: string) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus === 'contacted' && !selectedLead?.last_contacted_at) {
        updateData.last_contacted_at = new Date().toISOString();
      }

      if (notes) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Lead movido para ${PIPELINE_STAGES.find(s => s.key === newStatus)?.title || newStatus}`
      });

      onLeadUpdate({ ...selectedLead!, status: newStatus, notes: notes || selectedLead?.notes });
      setIsActionDialogOpen(false);
      setSelectedLead(null);
      setNotes("");
      
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const LeadCard = ({ lead }: { lead: Lead }) => (
    <div className="p-3 border rounded-lg bg-white hover:shadow-sm transition-all duration-200 cursor-pointer"
         onClick={() => {setSelectedLead(lead); setIsActionDialogOpen(true);}}>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{lead.name}</h4>
            <div className="flex items-center gap-1 mt-1">
              <Phone className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-mono">{lead.phone}</span>
            </div>
          </div>
          {lead.priority === 'high' && (
            <Badge className={`text-xs px-1.5 py-0.5 ${getPriorityColor(lead.priority)}`}>
              Alta
            </Badge>
          )}
        </div>

        {/* Details */}
        <div className="space-y-1">
          {lead.email && (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">{lead.email}</span>
            </div>
          )}
          
          {(lead.city || lead.address) && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">
                {lead.city || lead.address}
              </span>
            </div>
          )}

          {lead.budget && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-green-600" />
              <span className="text-xs font-medium text-green-600">
                {formatCurrency(lead.budget)}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(lead.created_at)}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {lead.lead_source.replace('_', ' ')}
          </Badge>
        </div>
      </div>
    </div>
  );

  const ActionDialog = () => {
    if (!selectedLead) return null;

    const currentStage = PIPELINE_STAGES.find(stage => stage.key === selectedLead.status);
    
    return (
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedLead.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Lead Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <div className="text-xs text-muted-foreground">Telefone</div>
                <div className="font-mono text-sm">{selectedLead.phone}</div>
              </div>
              {selectedLead.email && (
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm">{selectedLead.email}</div>
                </div>
              )}
              {selectedLead.budget && (
                <div>
                  <div className="text-xs text-muted-foreground">Orçamento</div>
                  <div className="text-sm font-medium text-green-600">
                    {formatCurrency(selectedLead.budget)}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground">Origem</div>
                <Badge variant="outline" className="text-xs">
                  {selectedLead.lead_source.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            {/* Message */}
            {selectedLead.message && (
              <div>
                <Label className="text-sm font-medium">Mensagem</Label>
                <div className="mt-1 p-3 bg-muted/30 rounded-lg text-sm">
                  {selectedLead.message}
                </div>
              </div>
            )}

            {/* Current Notes */}
            {selectedLead.notes && (
              <div>
                <Label className="text-sm font-medium">Notas Atuais</Label>
                <div className="mt-1 p-3 bg-muted/30 rounded-lg text-sm">
                  {selectedLead.notes}
                </div>
              </div>
            )}

            {/* Add Notes */}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Adicionar Notas
              </Label>
              <Textarea
                id="notes"
                placeholder="Adicione observações sobre o contato..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Actions */}
            {currentStage && currentStage.nextStatuses.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Próximas Ações
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {currentStage.nextStatuses.map((nextStatus) => {
                    const nextStage = PIPELINE_STAGES.find(s => s.key === nextStatus);
                    if (!nextStage) return null;

                    return (
                      <Button
                        key={nextStatus}
                        variant="outline"
                        className="justify-between"
                        onClick={() => updateLeadStatus(selectedLead.id, nextStatus, notes)}
                      >
                        <div className="flex items-center gap-2">
                          <nextStage.icon className="w-4 h-4" />
                          Mover para: {nextStage.title}
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" className="flex-1" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                Ligar
              </Button>
              <Button variant="outline" className="flex-1" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" className="flex-1" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {PIPELINE_STAGES.map((stage) => (
          <Card key={stage.key} className={`${stage.color} border-2`}>
            <CardHeader className={`${stage.headerColor} rounded-t-lg`}>
              <div className="h-6 bg-white/50 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-white/50 rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {PIPELINE_STAGES.map((stage, index) => {
        const stageLeads = getLeadsByStatus(stage.key);
        const Icon = stage.icon;

        return (
          <Card key={stage.key} className={`${stage.color} border-2 relative`}>
            <CardHeader className={`${stage.headerColor} rounded-t-lg`}>
              <CardTitle className={`${stage.textColor} text-lg flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {stage.title}
                  <Badge className="bg-white/50 text-current">
                    {stageLeads.length}
                  </Badge>
                </div>
                {index < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-4">
              {stageLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum lead neste estágio</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {stageLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      
      <ActionDialog />
    </div>
  );
}