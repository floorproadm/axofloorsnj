import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  useLeadFollowUp, 
  type LeadWithFollowUp,
  type FollowUpAction 
} from '@/hooks/useLeadFollowUp';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus,
  CalendarDays,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadFollowUpAlertProps {
  lead: LeadWithFollowUp;
  onUpdate?: () => void;
  compact?: boolean;
}

export function LeadFollowUpAlert({ lead, onUpdate, compact = false }: LeadFollowUpAlertProps) {
  const { addFollowUpAction, updateNextActionDate, getFollowUpStatus, isUpdating } = useLeadFollowUp();
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  const status = getFollowUpStatus(lead);

  // Only show for quoted status leads with follow_up_required
  if (!status.required && lead.status !== 'quoted') {
    return null;
  }

  const handleAddAction = async () => {
    if (!actionType.trim()) return;

    const action: FollowUpAction = {
      date: new Date().toISOString(),
      action: actionType.trim(),
      notes: actionNotes.trim() || undefined
    };

    const success = await addFollowUpAction(lead.id, action);
    if (success) {
      setActionType('');
      setActionNotes('');
      setIsActionDialogOpen(false);
      onUpdate?.();
    }
  };

  const handleDateChange = async (date: Date | undefined) => {
    if (!date) return;
    const success = await updateNextActionDate(lead.id, date);
    if (success) {
      setIsDatePopoverOpen(false);
      onUpdate?.();
    }
  };

  // Compact mode for table cells
  if (compact) {
    if (!status.required) return null;

    return (
      <div className="flex items-center gap-1">
        {status.isOverdue ? (
          <Badge variant="destructive" className="text-xs flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Atrasado
          </Badge>
        ) : status.hasActions ? (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {status.actionCount} ação
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Aguardando
          </Badge>
        )}
      </div>
    );
  }

  // Full mode for detail view
  return (
    <div className={cn(
      "rounded-lg border p-4",
      status.isOverdue 
        ? "bg-red-50 border-red-200" 
        : status.hasActions 
          ? "bg-green-50 border-green-200"
          : "bg-amber-50 border-amber-200"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {status.isOverdue ? (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            ) : status.hasActions ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <Clock className="w-5 h-5 text-amber-600" />
            )}
            <h4 className={cn(
              "font-semibold",
              status.isOverdue ? "text-red-800" : status.hasActions ? "text-green-800" : "text-amber-800"
            )}>
              Follow-Up {status.isOverdue ? 'ATRASADO' : status.hasActions ? 'em Andamento' : 'Obrigatório'}
            </h4>
          </div>

          <div className="space-y-1 text-sm">
            <p className={cn(
              status.isOverdue ? "text-red-700" : status.hasActions ? "text-green-700" : "text-amber-700"
            )}>
              {status.hasActions 
                ? `${status.actionCount} ação(ões) registrada(s)`
                : 'Nenhuma ação registrada ainda'}
            </p>
            
            {status.nextActionDate && (
              <p className={cn(
                "flex items-center gap-1",
                status.isOverdue ? "text-red-700 font-medium" : "text-muted-foreground"
              )}>
                <CalendarDays className="w-3 h-3" />
                Próxima ação: {format(status.nextActionDate, "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}

            {!status.canClose && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                ⚠️ Necessário pelo menos 1 ação para fechar como Won/Lost
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant={status.hasActions ? "outline" : "default"}
            onClick={() => setIsActionDialogOpen(true)}
            disabled={isUpdating}
          >
            <Plus className="w-4 h-4 mr-1" />
            Registrar Ação
          </Button>

          <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" disabled={isUpdating}>
                <CalendarDays className="w-4 h-4 mr-1" />
                Agendar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={status.nextActionDate || undefined}
                onSelect={handleDateChange}
                locale={ptBR}
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Ação de Follow-Up</DialogTitle>
            <DialogDescription>
              Registre uma ação realizada para este lead (chamada, email, visita, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Ação *</label>
              <Input
                placeholder="Ex: Ligação, Email enviado, Visita agendada..."
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea
                placeholder="Detalhes da ação..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddAction} 
              disabled={!actionType.trim() || isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
