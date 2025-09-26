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
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
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
                <CardContent className="p-2 sm:p-3">
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
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Phone className="w-4 h-4 mr-2" />
                          Ligar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Enviar email
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
    </div>
  );
}