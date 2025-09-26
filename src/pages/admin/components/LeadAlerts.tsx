import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  Clock, 
  Phone, 
  Mail,
  ExternalLink,
  Users,
  MapPin,
  DollarSign,
  MessageSquare,
  User,
  Calendar
} from "lucide-react";
import { useAdminData } from "@/hooks/admin/useAdminData";
import { Link } from "react-router-dom";

interface AlertLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  created_at: string;
  hoursAgo: number;
  priority: string;
  lead_source: string;
  address?: string;
  city?: string;
  zip_code?: string;
  budget?: number;
  services?: string[];
  message?: string;
  notes?: string;
  status: string;
}

export function LeadAlerts() {
  const { leads, isLoading } = useAdminData();

  const getUnansweredLeads = (): AlertLead[] => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    return leads
      .filter(lead => {
        // Lead is new and created more than 24h ago
        const createdAt = new Date(lead.created_at);
        return (
          lead.status === 'new' && 
          createdAt < twentyFourHoursAgo &&
          !lead.last_contacted_at
        );
      })
      .map(lead => {
        const createdAt = new Date(lead.created_at);
        const hoursAgo = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
        
        return {
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          created_at: lead.created_at,
          hoursAgo,
          priority: lead.priority,
          lead_source: lead.lead_source,
          address: lead.address,
          city: lead.city,
          zip_code: lead.zip_code,
          budget: lead.budget,
          services: lead.services,
          message: lead.message,
          notes: lead.notes,
          status: lead.status
        };
      })
      .sort((a, b) => b.hoursAgo - a.hoursAgo)
      .slice(0, 5); // Top 5 most urgent
  };

  const alertLeads = getUnansweredLeads();
  const totalUnanswered = alertLeads.length;
  const criticalCount = alertLeads.filter(lead => lead.hoursAgo > 48).length;

  const getUrgencyColor = (hoursAgo: number) => {
    if (hoursAgo > 72) return "text-red-600 bg-red-50 border-red-200";
    if (hoursAgo > 48) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-yellow-600 bg-yellow-50 border-yellow-200";
  };

  const formatTimeAgo = (hoursAgo: number) => {
    if (hoursAgo < 24) return `${hoursAgo}h atrás`;
    const daysAgo = Math.floor(hoursAgo / 24);
    return `${daysAgo}d atrás`;
  };

  const getSourceBadgeColor = (source: string) => {
    const colors = {
      'quiz': 'bg-blue-50 text-blue-600',
      'contact_form': 'bg-green-50 text-green-600',
      'contact_page': 'bg-purple-50 text-purple-600',
      'builders_page': 'bg-orange-50 text-orange-600',
      'realtors_page': 'bg-pink-50 text-pink-600'
    };
    return colors[source as keyof typeof colors] || 'bg-gray-50 text-gray-600';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const LeadPreviewModal = ({ lead }: { lead: AlertLead }) => {
    return (
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {lead.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-3">Informações de Contato</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-sm">{lead.phone}</span>
              </div>
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{lead.email}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Address Info */}
          {(lead.address || lead.city || lead.zip_code) && (
            <>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">Localização</h3>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    {lead.address && <div>{lead.address}</div>}
                    <div>
                      {lead.city && lead.zip_code ? `${lead.city}, ${lead.zip_code}` : 
                       lead.city || lead.zip_code}
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Lead Details */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-3">Detalhes do Lead</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Origem</div>
                <Badge className={`text-xs mt-1 ${getSourceBadgeColor(lead.lead_source)}`}>
                  {lead.lead_source.replace('_', ' ')}
                </Badge>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground">Prioridade</div>
                <Badge 
                  variant={lead.priority === 'high' ? 'destructive' : 'secondary'}
                  className="text-xs mt-1"
                >
                  {lead.priority === 'high' ? 'Alta' : 
                   lead.priority === 'medium' ? 'Média' : 'Baixa'}
                </Badge>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <Badge 
                  variant={lead.status === 'new' ? 'destructive' : 'secondary'}
                  className="text-xs mt-1"
                >
                  {lead.status === 'new' ? 'Novo' : 
                   lead.status === 'contacted' ? 'Contatado' : 
                   lead.status === 'qualified' ? 'Qualificado' :
                   lead.status === 'converted' ? 'Convertido' : lead.status}
                </Badge>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Recebido</div>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">{formatTimeAgo(lead.hoursAgo)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Budget */}
          {lead.budget && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">Orçamento</h3>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-600">
                    {formatCurrency(lead.budget)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Services */}
          {lead.services && lead.services.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">Serviços Solicitados</h3>
                <div className="flex flex-wrap gap-2">
                  {lead.services.map((service, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {service.replace(/([A-Z])/g, ' $1').trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Message */}
          {lead.message && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">Mensagem</h3>
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm bg-muted/30 p-3 rounded-lg">{lead.message}</p>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {lead.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">Notas</h3>
                <p className="text-sm bg-muted/30 p-3 rounded-lg">{lead.notes}</p>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex gap-2 pt-2">
            <Button asChild className="flex-1">
              <Link to="/admin/leads">
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir no CRM
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Alertas de Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalUnanswered === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-green-600" />
            Alertas de Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-medium text-foreground">Tudo em dia!</p>
            <p className="text-sm text-muted-foreground">
              Não há leads pendentes de resposta
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-base sm:text-lg">Alertas de Leads</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalCount} críticos
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {totalUnanswered} pendentes
            </Badge>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2">
          Leads não respondidos há mais de 24 horas
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3">
          {alertLeads.map((lead) => (
            <div 
              key={lead.id}
              className={`p-3 rounded-xl border ${getUrgencyColor(lead.hoursAgo)}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <p className="font-medium text-foreground text-sm truncate">
                      {lead.name}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs w-fit ${getSourceBadgeColor(lead.lead_source)}`}
                    >
                      {lead.lead_source.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span className="font-mono text-xs">{lead.phone}</span>
                    </div>
                    {lead.email && (
                      <div className="flex items-center gap-1 min-w-0">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="text-xs truncate">{lead.email}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs font-medium">
                        {formatTimeAgo(lead.hoursAgo)}
                      </span>
                    </div>
                    {lead.priority === 'high' && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0.5 w-fit">
                        Alta prioridade
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full sm:w-auto sm:ml-2 h-10"
                    >
                      <User className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                  </DialogTrigger>
                  <LeadPreviewModal lead={lead} />
                </Dialog>
              </div>
            </div>
          ))}
        </div>
        
        {totalUnanswered > 5 && (
          <div className="pt-4 border-t mt-4">
            <Button asChild variant="outline" className="w-full h-10">
              <Link to="/admin/leads">
                Ver todos os {totalUnanswered} leads pendentes
                <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}