import { useState } from "react";
import { AutomationDrip } from "@/hooks/useAutomationFlows";
import { SequenceDetail } from "./SequenceDetail";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus, Zap } from "lucide-react";
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

  return (
    <div className="space-y-2">
      {stages.map((stage) => {
        const isExpanded = expandedStage === stage.key;
        return (
          <div key={stage.key} className="border border-border/50 rounded-xl overflow-hidden bg-card">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedStage(isExpanded ? null : stage.key)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{stage.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {stage.sequenceCount} sequence{stage.sequenceCount !== 1 ? "s" : ""} · {stage.dripCount} drip{stage.dripCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
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
                  className="h-8 text-xs gap-1 border-dashed w-full"
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
