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
  STAGE_CONFIG,
  VALID_TRANSITIONS,
  normalizeStatus,
  type PipelineStage 
} from '@/hooks/useLeadPipeline';
import { ChevronDown, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadPipelineStatusProps {
  leadId: string;
  currentStatus: string;
  onStatusChange?: () => void;
}

export function LeadPipelineStatus({ 
  leadId, 
  currentStatus, 
  onStatusChange 
}: LeadPipelineStatusProps) {
  const { updateLeadStatus, isUpdating, getNextAllowedStatuses } = useLeadPipeline();
  const [isOpen, setIsOpen] = useState(false);

  const stage = normalizeStatus(currentStatus);
  const config = STAGE_CONFIG[stage];
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
        className={cn(config.bgColor, config.textColor, config.borderColor, 'flex items-center gap-1 border')}
      >
        {stage === 'completed' && <CheckCircle className="w-3 h-3" />}
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
            config.bgColor,
            config.textColor,
            config.borderColor,
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
          Próxima etapa:
        </div>
        {allowedNext.map((nextStatus) => {
          const nextConfig = STAGE_CONFIG[nextStatus];
          return (
            <DropdownMenuItem
              key={nextStatus}
              onClick={() => handleStatusChange(nextStatus)}
              className="cursor-pointer"
            >
              <Badge 
                variant="outline" 
                className={cn(nextConfig.bgColor, nextConfig.textColor, nextConfig.borderColor, 'mr-2 border')}
              >
                {STAGE_LABELS[nextStatus]}
              </Badge>
            </DropdownMenuItem>
          );
        })}
        
        {/* Show blocked stages */}
        <div className="border-t mt-1 pt-1">
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Bloqueadas:
          </div>
          {PIPELINE_STAGES.filter(s => 
            s !== stage && 
            !allowedNext.includes(s) &&
            s !== 'new_lead' // Can't go back to new_lead
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
