import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Bell, 
  Phone, 
  Mail, 
  MessageSquare,
  Plus,
  AlertTriangle,
  CheckCircle,
  User
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  status: string;
  priority: string;
  follow_up_date?: string;
  last_contacted_at?: string;
  created_at: string;
}

interface FollowUpTask {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_phone: string;
  task_type: 'call' | 'email' | 'meeting' | 'quote';
  scheduled_date: string;
  completed: boolean;
  notes?: string;
  created_at: string;
}

interface FollowUpSystemProps {
  leads: Lead[];
  onLeadUpdate: (updatedLead: Lead) => void;
}

export function FollowUpSystem({ leads, onLeadUpdate }: FollowUpSystemProps) {
  const { toast } = useToast();
  const [followUpTasks, setFollowUpTasks] = useState<FollowUpTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    lead_id: '',
    task_type: 'call' as const,
    scheduled_date: new Date(),
    notes: ''
  });

  // Get overdue and upcoming follow-ups
  const getFollowUpStatus = () => {
    const now = new Date();
    const overdue = leads.filter(lead => {
      if (!lead.follow_up_date) return false;
      return new Date(lead.follow_up_date) < now && lead.status !== 'converted' && lead.status !== 'lost';
    });

    const today = leads.filter(lead => {
      if (!lead.follow_up_date) return false;
      const followUpDate = new Date(lead.follow_up_date);
      return followUpDate.toDateString() === now.toDateString();
    });

    const upcoming = leads.filter(lead => {
      if (!lead.follow_up_date) return false;
      const followUpDate = new Date(lead.follow_up_date);
      const diffTime = followUpDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 7;
    });

    return { overdue, today, upcoming };
  };

  const { overdue, today, upcoming } = getFollowUpStatus();

  const scheduleFollowUp = async (leadId: string, date: Date, notes?: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          follow_up_date: date.toISOString(),
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      // Update local state
      const updatedLead = leads.find(lead => lead.id === leadId);
      if (updatedLead) {
        onLeadUpdate({ 
          ...updatedLead, 
          follow_up_date: date.toISOString()
        });
      }

      toast({
        title: "Follow-up agendado",
        description: `Follow-up marcado para ${format(date, "dd/MM/yyyy")}`
      });

    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      toast({
        title: "Erro ao agendar follow-up",
        description: "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const markAsContacted = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          last_contacted_at: new Date().toISOString(),
          status: 'contacted',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      const updatedLead = leads.find(lead => lead.id === leadId);
      if (updatedLead) {
        onLeadUpdate({ 
          ...updatedLead, 
          last_contacted_at: new Date().toISOString(),
          status: 'contacted'
        });
      }

      toast({
        title: "Lead marcado como contatado",
        description: "Status atualizado com sucesso."
      });

    } catch (error) {
      console.error('Error marking as contacted:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'meeting': return <User className="w-4 h-4" />;
      case 'quote': return <MessageSquare className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'call': return 'Ligação';
      case 'email': return 'Email';
      case 'meeting': return 'Reunião';
      case 'quote': return 'Orçamento';
      default: return 'Tarefa';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Atrasados</p>
                <p className="text-xl sm:text-2xl font-bold text-red-900">{overdue.length}</p>
              </div>
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Hoje</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900">{today.length}</p>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Próximos 7 dias</p>
                <p className="text-xl sm:text-2xl font-bold text-green-900">{upcoming.length}</p>
              </div>
              <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Follow-ups */}
      {overdue.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-red-800 flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              Follow-ups Atrasados ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3">
              {overdue.slice(0, 5).map((lead) => (
                <div 
                  key={lead.id}
                  className={cn(
                    "p-3 rounded-lg border-l-4",
                    getPriorityColor(lead.priority)
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h4 className="font-medium text-sm">{lead.name}</h4>
                        <Badge variant="outline" className="text-xs w-fit">
                          {lead.priority} prioridade
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span className="font-mono text-xs">{lead.phone}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          <span className="text-xs">
                            {lead.follow_up_date && format(new Date(lead.follow_up_date), "dd/MM/yyyy")}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsContacted(lead.id)}
                        className="h-9"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Contatado
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="h-9">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            Reagendar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Reagendar Follow-up</DialogTitle>
                          </DialogHeader>
                          <FollowUpScheduler
                            lead={lead}
                            onSchedule={(date, notes) => {
                              scheduleFollowUp(lead.id, date, notes);
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
              
              {overdue.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  E mais {overdue.length - 5} follow-ups atrasados...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Follow-ups */}
      {today.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-blue-800 flex items-center gap-2 text-base sm:text-lg">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              Follow-ups de Hoje ({today.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3">
              {today.map((lead) => (
                <div 
                  key={lead.id}
                  className={cn(
                    "p-3 rounded-lg border-l-4",
                    getPriorityColor(lead.priority)
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h4 className="font-medium text-sm">{lead.name}</h4>
                        <Badge variant="outline" className="text-xs w-fit">
                          {lead.priority} prioridade
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span className="font-mono text-xs">{lead.phone}</span>
                        </span>
                        {lead.email && (
                          <span className="flex items-center gap-1 min-w-0">
                            <Mail className="w-3 h-3" />
                            <span className="text-xs truncate">{lead.email}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsContacted(lead.id)}
                        className="w-full sm:w-auto h-9"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Concluído
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No follow-ups message */}
      {overdue.length === 0 && today.length === 0 && upcoming.length === 0 && (
        <Card>
          <CardContent className="text-center py-8 sm:py-10">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
              Tudo em dia!
            </h3>
            <p className="text-sm text-muted-foreground">
              Não há follow-ups pendentes no momento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Follow-up Scheduler Component
interface FollowUpSchedulerProps {
  lead: Lead;
  onSchedule: (date: Date, notes?: string) => void;
}

function FollowUpScheduler({ lead, onSchedule }: FollowUpSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');

  const handleSchedule = () => {
    onSchedule(selectedDate, notes);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Lead: {lead.name}</Label>
        <p className="text-sm text-muted-foreground">{lead.phone}</p>
      </div>

      <div className="space-y-2">
        <Label>Data do Follow-up</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Selecionar data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes"
          placeholder="Adicione observações sobre este follow-up..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <Button onClick={handleSchedule} className="w-full">
        Agendar Follow-up
      </Button>
    </div>
  );
}