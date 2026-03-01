import { useState } from "react";
import { AutomationSequence, AutomationDrip } from "@/hooks/useAutomationFlows";
import { DripEditor } from "./DripEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronDown, Pencil, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [collapsed, setCollapsed] = useState(false);

  const sequenceDrips = drips
    .filter((d) => d.sequence_id === sequence.id)
    .sort((a, b) => a.display_order - b.display_order);

  const activeDrips = sequenceDrips.filter((d) => d.is_active).length;

  return (
    <div className={cn(
      "rounded-xl border transition-all duration-200",
      sequence.is_active
        ? "border-border/50 bg-muted/20"
        : "border-border/30 bg-muted/10 opacity-60"
    )}>
      {/* Sequence Header */}
      <div className="flex items-center justify-between p-3 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-0.5 hover:bg-muted rounded transition-colors"
          >
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", collapsed && "-rotate-90")} />
          </button>

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
              className="h-7 text-sm w-48 bg-card"
              autoFocus
            />
          ) : (
            <button
              className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate text-left"
              onClick={() => setEditingName(true)}
              title="Click to rename"
            >
              {sequence.name}
            </button>
          )}

          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/50 text-muted-foreground shrink-0">
            <ListOrdered className="w-2.5 h-2.5 mr-0.5" />
            {activeDrips}/{sequenceDrips.length}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Switch
            checked={sequence.is_active}
            onCheckedChange={(checked) => onUpdateSequence({ id: sequence.id, is_active: checked })}
            className="scale-[0.7]"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => setEditingName(true)}
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => onDeleteSequence(sequence.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Drips List */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-1.5">
          {/* Timeline connector */}
          <div className="relative pl-5">
            {sequenceDrips.map((drip, i) => (
              <div key={drip.id} className="relative">
                {/* Vertical connector line */}
                {i < sequenceDrips.length - 1 && (
                  <div className="absolute left-[7px] top-8 bottom-0 w-px bg-border/50" />
                )}
                {/* Dot */}
                <div className={cn(
                  "absolute left-0 top-3 w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center",
                  drip.is_active
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/50 bg-muted"
                )}>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    drip.is_active ? "bg-primary" : "bg-muted-foreground/30"
                  )} />
                </div>
                <div className="ml-6 mb-1.5">
                  <DripEditor
                    drip={drip}
                    onUpdate={onUpdateDrip}
                    onDelete={onDeleteDrip}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-primary ml-5"
            onClick={() =>
              onCreateDrip({
                sequence_id: sequence.id,
                message_template: "",
              })
            }
          >
            <Plus className="w-3 h-3" />
            Add Drip
          </Button>
        </div>
      )}
    </div>
  );
}
