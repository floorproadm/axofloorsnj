import { useState } from "react";
import { AutomationSequence, AutomationDrip } from "@/hooks/useAutomationFlows";
import { DripEditor } from "./DripEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface SequenceDetailProps {
  sequence: AutomationSequence;
  drips: AutomationDrip[];
  onUpdateSequence: (updates: { id: string; name?: string; is_active?: boolean }) => void;
  onDeleteSequence: (id: string) => void;
  onCreateDrip: (input: { sequence_id: string; message_template: string }) => void;
  onUpdateDrip: (updates: Partial<AutomationDrip> & { id: string }) => void;
  onDeleteDrip: (id: string) => void;
}

export function SequenceDetail({
  sequence,
  drips,
  onUpdateSequence,
  onDeleteSequence,
  onCreateDrip,
  onUpdateDrip,
  onDeleteDrip,
}: SequenceDetailProps) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(sequence.name);

  const sequenceDrips = drips
    .filter((d) => d.sequence_id === sequence.id)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="border border-border/50 rounded-xl p-4 space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground/50" />
          {editingName ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                onUpdateSequence({ id: sequence.id, name });
                setEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onUpdateSequence({ id: sequence.id, name });
                  setEditingName(false);
                }
              }}
              className="h-7 text-sm w-48"
              autoFocus
            />
          ) : (
            <button
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              onClick={() => setEditingName(true)}
            >
              {sequence.name}
            </button>
          )}
          <span className="text-[10px] text-muted-foreground">
            {sequenceDrips.length} drip{sequenceDrips.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={sequence.is_active}
            onCheckedChange={(checked) => onUpdateSequence({ id: sequence.id, is_active: checked })}
            className="scale-75"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => onDeleteSequence(sequence.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 pl-6">
        {sequenceDrips.map((drip) => (
          <DripEditor
            key={drip.id}
            drip={drip}
            onUpdate={onUpdateDrip}
            onDelete={onDeleteDrip}
          />
        ))}

        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
          onClick={() =>
            onCreateDrip({
              sequence_id: sequence.id,
              message_template: "",
            })
          }
        >
          <Plus className="w-3.5 h-3.5" />
          Add Drip
        </Button>
      </div>
    </div>
  );
}
