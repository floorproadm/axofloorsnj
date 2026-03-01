import { useState } from "react";
import { AutomationDrip } from "@/hooks/useAutomationFlows";
import { SequenceDetail } from "./SequenceDetail";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Plus, Zap, Mail, Phone, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface StageInfo {
  key: string;
  label: string;
  sequences: { id: string; pipeline_type: string; stage_key: string; name: string; is_active: boolean; display_order: number; created_at: string; updated_at: string }[];
  sequenceCount: number;
  dripCount: number;
}

interface StageFlowListProps {
  stages: StageInfo[];
  drips: AutomationDrip[];
  onCreateSequence: (input: { stage_key: string; name: string }) => void;
  onUpdateSequence: (updates: { id: string; name?: string; is_active?: boolean }) => void;
  onDeleteSequence: (id: string) => void;
  onCreateDrip: (input: { sequence_id: string; message_template: string }) => void;
  onUpdateDrip: (updates: Partial<AutomationDrip> & { id: string }) => void;
  onDeleteDrip: (id: string) => void;
}

// Stage index colors for visual differentiation
const STAGE_COLORS = [
  "from-blue-500/15 to-blue-500/5 border-blue-500/20",
  "from-cyan-500/15 to-cyan-500/5 border-cyan-500/20",
  "from-violet-500/15 to-violet-500/5 border-violet-500/20",
  "from-amber-500/15 to-amber-500/5 border-amber-500/20",
  "from-emerald-500/15 to-emerald-500/5 border-emerald-500/20",
  "from-rose-500/15 to-rose-500/5 border-rose-500/20",
  "from-indigo-500/15 to-indigo-500/5 border-indigo-500/20",
];

const STAGE_ICON_COLORS = [
  "text-blue-500",
  "text-cyan-500",
  "text-violet-500",
  "text-amber-500",
  "text-emerald-500",
  "text-rose-500",
  "text-indigo-500",
];

export function StageFlowList({
  stages,
  drips,
  onCreateSequence,
  onUpdateSequence,
  onDeleteSequence,
  onCreateDrip,
  onUpdateDrip,
  onDeleteDrip,
}: StageFlowListProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  // Count channels across all drips for a stage
  const getStageChannels = (stage: StageInfo) => {
    const seqIds = stage.sequences.map((s) => s.id);
    const stageDrips = drips.filter((d) => seqIds.includes(d.sequence_id));
    const channels = new Set(stageDrips.map((d) => d.channel));
    return channels;
  };

  return (
    <div className="space-y-2">
      {stages.map((stage, idx) => {
        const isExpanded = expandedStage === stage.key;
        const colorClass = STAGE_COLORS[idx % STAGE_COLORS.length];
        const iconColor = STAGE_ICON_COLORS[idx % STAGE_ICON_COLORS.length];
        const channels = getStageChannels(stage);
        const isEmpty = stage.sequenceCount === 0;

        return (
          <div
            key={stage.key}
            className={cn(
              "rounded-xl overflow-hidden transition-all duration-200",
              isExpanded
                ? "border border-primary/30 shadow-md shadow-primary/5 bg-card"
                : "border border-border/40 bg-card hover:border-border/70 hover:shadow-sm"
            )}
          >
            <button
              className="w-full flex items-center justify-between p-3.5 md:p-4 transition-colors"
              onClick={() => setExpandedStage(isExpanded ? null : stage.key)}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center border", colorClass)}>
                  <Zap className={cn("w-4 h-4", iconColor)} />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{stage.label}</p>
                    {isEmpty && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/50 text-muted-foreground">
                        Empty
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[11px] text-muted-foreground">
                      {stage.sequenceCount} seq · {stage.dripCount} drip{stage.dripCount !== 1 ? "s" : ""}
                    </p>
                    {/* Channel indicators */}
                    {channels.size > 0 && (
                      <div className="flex items-center gap-1">
                        {channels.has("email") && <Mail className="w-3 h-3 text-blue-400/70" />}
                        {channels.has("sms") && <Phone className="w-3 h-3 text-emerald-400/70" />}
                        {channels.has("whatsapp") && <MessageSquare className="w-3 h-3 text-green-400/70" />}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEmpty && (
                  <span className="text-[10px] text-muted-foreground hidden md:inline">
                    {isExpanded ? "Collapse" : "Expand"}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )}
                />
              </div>
            </button>

            {isExpanded && (
              <div className="px-3.5 md:px-4 pb-4 space-y-3 border-t border-border/30 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                {stage.sequences.map((seq) => (
                  <SequenceDetail
                    key={seq.id}
                    sequence={seq}
                    drips={drips}
                    onUpdateSequence={onUpdateSequence}
                    onDeleteSequence={onDeleteSequence}
                    onCreateDrip={onCreateDrip}
                    onUpdateDrip={onUpdateDrip}
                    onDeleteDrip={onDeleteDrip}
                  />
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-1.5 border-dashed w-full hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors"
                  onClick={() =>
                    onCreateSequence({
                      stage_key: stage.key,
                      name: `Sequence ${stage.sequenceCount + 1}`,
                    })
                  }
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Sequence
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
