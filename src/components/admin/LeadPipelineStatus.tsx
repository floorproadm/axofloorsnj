import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  useLeadPipeline, 
  PIPELINE_STAGES, 
  STAGE_LABELS, 
  VALID_TRANSITIONS,
  type PipelineStage 
} from '@/hooks/useLeadPipeline';
import { ChevronDown, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadPipelineStatusProps {
  leadId: string;
  currentStatus: string;
  onStatusChange?: () => void;
}

const statusColors: Record<PipelineStage, string> = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  contacted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  quoted: 'bg-purple-100 text-purple-800 border-purple-200',
  won: 'bg-green-100 text-green-800 border-green-200',
  lost: 'bg-red-100 text-red-800 border-red-200'
};

export function LeadPipelineStatus({ 
  leadId, 
  currentStatus, 
  onStatusChange 
}: LeadPipelineStatusProps) {
  const { updateLeadStatus, isUpdating, getNextAllowedStatuses } = useLeadPipeline();
  const [isOpen, setIsOpen] = useState(false);

  const stage = currentStatus as PipelineStage;
  const allowedNext = getNextAllowedStatuses(currentStatus);
  const isTerminal = allowedNext.length === 0;

  const handleStatusChange = async (newStatus: PipelineStage) => {
    setIsOpen(false);
    const success = await updateLeadStatus(leadId, newStatus);
    if (success && onStatusChange) {
      onStatusChange();
    }
  };

  // Terminal states - no dropdown
  if (isTerminal) {
    return (
      <Badge 
        variant="outline" 
        className={cn(statusColors[stage], 'flex items-center gap-1')}
      >
        {stage === 'won' && <CheckCircle className="w-3 h-3" />}
        {stage === 'lost' && <XCircle className="w-3 h-3" />}
        {STAGE_LABELS[stage]}
        <Lock className="w-3 h-3 ml-1 opacity-50" />
      </Badge>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={cn(
            statusColors[stage],
            'h-7 px-2 text-xs font-medium border',
            isUpdating && 'opacity-50 cursor-not-allowed'
          )}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : null}
          {STAGE_LABELS[stage]}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
          Próxima etapa permitida:
        </div>
        {allowedNext.map((nextStatus) => (
          <DropdownMenuItem
            key={nextStatus}
            onClick={() => handleStatusChange(nextStatus)}
            className="cursor-pointer"
          >
            <Badge 
              variant="outline" 
              className={cn(statusColors[nextStatus], 'mr-2')}
            >
              {STAGE_LABELS[nextStatus]}
            </Badge>
          </DropdownMenuItem>
        ))}
        
        {/* Show blocked stages */}
        <div className="border-t mt-1 pt-1">
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Bloqueadas (requer etapa anterior):
          </div>
          {PIPELINE_STAGES.filter(s => 
            s !== currentStatus && 
            !allowedNext.includes(s) &&
            s !== 'new' // Can't go back to new
          ).map((blockedStatus) => (
            <DropdownMenuItem
              key={blockedStatus}
              disabled
              className="opacity-50 cursor-not-allowed"
            >
              <Lock className="w-3 h-3 mr-2 text-muted-foreground" />
              <Badge 
                variant="outline" 
                className="mr-2 bg-gray-100 text-gray-500 border-gray-200"
              >
                {STAGE_LABELS[blockedStatus]}
              </Badge>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
