import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  User,
  MapPin,
  DollarSign,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  location?: string;
  city?: string;
  created_at: string;
  follow_up_date?: string;
  last_contacted_at?: string;
  notes?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  color: string;
  leads: Lead[];
}

interface KanbanBoardProps {
  leads: Lead[];
  onLeadUpdate: (updatedLead: Lead) => void;
  isLoading?: boolean;
}

const KANBAN_COLUMNS: Omit<KanbanColumn, 'leads'>[] = [
  {
    id: 'new',
    title: 'Novos Leads',
    status: 'new',
    color: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'contacted',
    title: 'Contatados',
    status: 'contacted',
    color: 'bg-yellow-50 border-yellow-200'
  },
  {
    id: 'qualified',
    title: 'Qualificados',
    status: 'qualified',
    color: 'bg-purple-50 border-purple-200'
  },
  {
    id: 'proposal',
    title: 'Proposta Enviada',
    status: 'proposal',
    color: 'bg-orange-50 border-orange-200'
  },
  {
    id: 'converted',
    title: 'Convertidos',
    status: 'converted',
    color: 'bg-green-50 border-green-200'
  },
  {
    id: 'lost',
    title: 'Perdidos',
    status: 'lost',
    color: 'bg-red-50 border-red-200'
  }
];

export function KanbanBoard({ leads, onLeadUpdate, isLoading }: KanbanBoardProps) {
  const { toast } = useToast();
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Handle lead details view
  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setNotes(lead.notes || "");
    setStatus(lead.status);
    setPriority(lead.priority);
    setIsDetailModalOpen(true);
  };

  // Handle lead updates (status, notes, etc.)
  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Lead atualizado",
        description: "As informações do lead foram atualizadas com sucesso."
      });

      onLeadUpdate({
        ...selectedLead,
        ...updates
      } as Lead);
      
      // Update local state
      setSelectedLead(prev => prev ? { ...prev, ...updates } : null);
      
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o lead. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle phone call
  const handlePhoneCall = (lead: Lead) => {
    window.open(`tel:${lead.phone}`, '_self');
    // Mark as contacted
    handleUpdateLead(lead.id, {
      last_contacted_at: new Date().toISOString(),
      status: lead.status === 'new' ? 'contacted' : lead.status
    });
  };

  // Handle email
  const handleEmail = (lead: Lead) => {
    const subject = `Axo Floors - Contato sobre ${lead.services?.join(', ') || 'serviços'}`;
    const body = `Olá ${lead.name},\n\nEntramos em contato sobre sua solicitação de orçamento.\n\nAtenciosamente,\nEquipe Axo Floors`;
    window.open(`mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d atrás`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}m atrás`;
  };

  // Organize leads into columns
  const columns: KanbanColumn[] = KANBAN_COLUMNS.map(col => ({
    ...col,
    leads: leads.filter(lead => lead.status === col.status)
  }));

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      // Find and update the lead
      const updatedLead = leads.find(lead => lead.id === leadId);
      if (updatedLead) {
        onLeadUpdate({ ...updatedLead, status: newStatus });
      }

      toast({
        title: "Status atualizado",
        description: `Lead movido para "${KANBAN_COLUMNS.find(col => col.status === newStatus)?.title}"`
      });

    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedLead && draggedLead.status !== columnStatus) {
      updateLeadStatus(draggedLead.id, columnStatus);
    }
    setDraggedLead(null);
  }, [draggedLead]);

  const getSourceBadgeColor = (source: string) => {
    const colors = {
      'quiz': 'bg-blue-100 text-blue-800',
      'contact_form': 'bg-green-100 text-green-800',
      'contact_page': 'bg-purple-100 text-purple-800',
      'builders_page': 'bg-orange-100 text-orange-800',
      'realtors_page': 'bg-pink-100 text-pink-800'
    };
    return colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-300 bg-white';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="h-64 sm:h-80">
            <CardHeader className="p-3 sm:p-6">
              <div className="h-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-16 sm:h-20 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 sm:gap-4">
      {columns.map((column) => (
        <Card 
          key={column.id}
          className={cn(
            "min-h-64 sm:min-h-80 transition-all duration-200",
            column.color,
            dragOverColumn === column.status && "ring-2 ring-primary ring-opacity-50"
          )}
          onDragOver={(e) => handleDragOver(e, column.status)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.status)}
        >
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="truncate">{column.title}</span>
              <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                {column.leads.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-2 sm:space-y-3 max-h-72 sm:max-h-96 overflow-y-auto p-3 sm:p-6 pt-0">
            {column.leads.map((lead) => (
              <Card
                key={lead.id}
                draggable
                onDragStart={(e) => handleDragStart(e, lead)}
                className={cn(
                  "cursor-move hover:shadow-md transition-all duration-200 border-l-4",
                  getPriorityColor(lead.priority),
                  draggedLead?.id === lead.id && "opacity-50 scale-95"
                )}
              >
                <CardContent 
                  className="p-2 sm:p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleViewDetails(lead)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs sm:text-sm truncate">
                        {lead.name}
                      </h4>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1 py-0.5 ${getSourceBadgeColor(lead.lead_source)}`}
                        >
                          {lead.lead_source.replace('_', ' ')}
                        </Badge>
                        {lead.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs px-1 py-0.5 w-fit">
                            Alta
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(lead)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePhoneCall(lead)}>
                          <Phone className="w-4 h-4 mr-2" />
                          Ligar
                        </DropdownMenuItem>
                        {lead.email && (
                          <DropdownMenuItem onClick={() => handleEmail(lead)}>
                            <Mail className="w-4 h-4 mr-2" />
                            Enviar email
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar lead
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span className="font-mono text-xs truncate">{lead.phone}</span>
                    </div>
                    {lead.email && (
                      <div className="flex items-center gap-1 min-w-0">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate text-xs">{lead.email}</span>
                      </div>
                    )}
                    {lead.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="text-xs">{lead.city}</span>
                      </div>
                    )}
                    {lead.budget && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 flex-shrink-0" />
                        <span className="text-xs">${lead.budget.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Services */}
                  {lead.services && lead.services.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {lead.services.slice(0, 2).map((service, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-1 py-0.5">
                            {service.replace(/([A-Z])/g, ' $1').trim()}
                          </Badge>
                        ))}
                        {lead.services.length > 2 && (
                          <Badge variant="outline" className="text-xs px-1 py-0.5">
                            +{lead.services.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{formatTimeAgo(lead.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {column.leads.length === 0 && (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <User className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">Nenhum lead</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {/* Lead Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedLead?.name}
            </DialogTitle>
            <DialogDescription>
              Informações completas e ações do lead
            </DialogDescription>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">Informações de Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{selectedLead.phone}</span>
                    <Button size="sm" variant="outline" onClick={() => handlePhoneCall(selectedLead)}>
                      Ligar
                    </Button>
                  </div>
                  {selectedLead.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{selectedLead.email}</span>
                      <Button size="sm" variant="outline" onClick={() => handleEmail(selectedLead)}>
                        Email
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Lead Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">Status & Prioridade</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={status} 
                        onValueChange={(value) => {
                          setStatus(value);
                          handleUpdateLead(selectedLead.id, { status: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Novo</SelectItem>
                          <SelectItem value="contacted">Contatado</SelectItem>
                          <SelectItem value="qualified">Qualificado</SelectItem>
                          <SelectItem value="proposal">Proposta</SelectItem>
                          <SelectItem value="converted">Convertido</SelectItem>
                          <SelectItem value="lost">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select 
                        value={priority} 
                        onValueChange={(value) => {
                          setPriority(value);
                          handleUpdateLead(selectedLead.id, { priority: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3">Informações do Lead</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fonte:</span>
                      <Badge variant="outline">
                        {selectedLead.lead_source.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {selectedLead.city && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cidade:</span>
                        <span>{selectedLead.city}</span>
                      </div>
                    )}
                    
                    {selectedLead.budget && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Orçamento:</span>
                        <span className="font-medium">${selectedLead.budget.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Criado:</span>
                      <span>{new Date(selectedLead.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    {selectedLead.last_contacted_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Último contato:</span>
                        <span>{new Date(selectedLead.last_contacted_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Services */}
              {selectedLead.services && selectedLead.services.length > 0 && (
                <>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-3">Serviços Solicitados</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.services.map((service, index) => (
                        <Badge key={index} variant="outline">
                          {service.replace(/([A-Z])/g, ' $1').trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notas & Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione notas sobre este lead..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleUpdateLead(selectedLead.id, { notes })}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Salvando..." : "Salvar Notas"}
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <Separator />
              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={() => handlePhoneCall(selectedLead)}>
                  <Phone className="w-4 h-4 mr-2" />
                  Ligar Agora
                </Button>
                {selectedLead.email && (
                  <Button variant="outline" onClick={() => handleEmail(selectedLead)}>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Email
                  </Button>
                )}
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar Follow-up
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const message = `Hi ${selectedLead.name}, this is Eduardo from Axo Floors. Thank you for your interest in our flooring services. I'd like to schedule a quick call to discuss your project details and provide you with a personalized quote. When would be a good time to connect?`;
                    window.open(`sms:${selectedLead.phone}?body=${encodeURIComponent(message)}`, '_self');
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send SMS
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}