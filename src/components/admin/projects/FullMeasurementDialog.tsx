import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useCreateMeasurement, useUpsertArea } from "@/hooks/useMeasurements";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AREA_TYPES = [
  { value: "floor", label: "Floor (sqft)", primary: "sqft" },
  { value: "staircase", label: "Staircase (steps)", primary: "sqft" },
  { value: "baseboard", label: "Baseboard (linear ft)", primary: "linear_ft" },
  { value: "handrail", label: "Handrail (linear ft)", primary: "linear_ft" },
  { value: "other", label: "Other", primary: "sqft" },
] as const;

interface AreaDraft {
  room_name: string;
  area_type: "floor" | "staircase" | "baseboard" | "handrail" | "other";
  area_sqft: string;
  linear_ft: string;
  dimensions: string;
}

const emptyArea = (): AreaDraft => ({
  room_name: "",
  area_type: "floor",
  area_sqft: "",
  linear_ft: "",
  dimensions: "",
});

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  projectId: string;
}

export function FullMeasurementDialog({ open, onOpenChange, projectId }: Props) {
  const create = useCreateMeasurement();
  const upsertArea = useUpsertArea();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [measuredBy, setMeasuredBy] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [material, setMaterial] = useState("");
  const [finishType, setFinishType] = useState("");
  const [status, setStatus] = useState<"scheduled" | "active" | "completed">("scheduled");
  const [notes, setNotes] = useState("");
  const [areas, setAreas] = useState<AreaDraft[]>([emptyArea()]);
  const [saving, setSaving] = useState(false);

  function reset() {
    setDate(new Date().toISOString().split("T")[0]);
    setMeasuredBy("");
    setServiceType("");
    setMaterial("");
    setFinishType("");
    setStatus("scheduled");
    setNotes("");
    setAreas([emptyArea()]);
  }

  function updateArea(idx: number, patch: Partial<AreaDraft>) {
    setAreas((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const measurement = await create.mutateAsync({
        project_id: projectId,
        measurement_date: date ? new Date(date).toISOString() : undefined,
        measured_by: measuredBy || undefined,
        service_type: serviceType || undefined,
        material: material || undefined,
        finish_type: finishType || undefined,
        notes: notes || undefined,
        status,
      });

      const validAreas = areas.filter((a) => a.room_name.trim());
      let totalSqft = 0;
      let totalLinear = 0;

      for (let i = 0; i < validAreas.length; i++) {
        const a = validAreas[i];
        const sqft = Number(a.area_sqft) || 0;
        const linear = Number(a.linear_ft) || 0;
        totalSqft += sqft;
        totalLinear += linear;
        await upsertArea.mutateAsync({
          measurement_id: measurement.id,
          room_name: a.room_name,
          area_type: a.area_type,
          area_sqft: sqft,
          linear_ft: linear,
          dimensions: a.dimensions || undefined,
          display_order: i,
        });
      }

      // Update totals on parent record
      if (totalSqft > 0 || totalLinear > 0) {
        await supabase
          .from("project_measurements")
          .update({ total_sqft: totalSqft, total_linear_ft: totalLinear })
          .eq("id", measurement.id);
      }

      toast.success("Measurement created");
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to save", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Measurement</DialogTitle>
          <DialogDescription>Capture rooms, dimensions and technical specs in one shot.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Measured by</Label>
              <Input value={measuredBy} onChange={(e) => setMeasuredBy(e.target.value)} placeholder="Technician name" />
            </div>
          </div>

          {/* Tech specs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Service Type</Label>
              <Input value={serviceType} onChange={(e) => setServiceType(e.target.value)} placeholder="Sand & refinish" />
            </div>
            <div>
              <Label className="text-xs">Material</Label>
              <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Red oak" />
            </div>
            <div>
              <Label className="text-xs">Finish</Label>
              <Input value={finishType} onChange={(e) => setFinishType(e.target.value)} placeholder="Bona Traffic HD" />
            </div>
          </div>

          {/* Areas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider">Areas</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAreas((p) => [...p, emptyArea()])} className="h-7 gap-1">
                <Plus className="h-3 w-3" /> Add area
              </Button>
            </div>
            <div className="space-y-2">
              {areas.map((a, idx) => {
                const config = AREA_TYPES.find((t) => t.value === a.area_type)!;
                return (
                  <div key={idx} className="rounded-lg border bg-muted/30 p-2 space-y-2">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                      <Input
                        placeholder="Room name (e.g. Living)"
                        value={a.room_name}
                        onChange={(e) => updateArea(idx, { room_name: e.target.value })}
                        className="h-8 text-sm"
                      />
                      <Select value={a.area_type} onValueChange={(v: any) => updateArea(idx, { area_type: v })}>
                        <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {AREA_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {areas.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setAreas((p) => p.filter((_, i) => i !== idx))}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Dimensions (12×14)"
                        value={a.dimensions}
                        onChange={(e) => updateArea(idx, { dimensions: e.target.value })}
                        className="h-8 text-xs"
                      />
                      <Input
                        type="number"
                        placeholder={config.primary === "sqft" ? "sqft / qty" : "sqft"}
                        value={a.area_sqft}
                        onChange={(e) => updateArea(idx, { area_sqft: e.target.value })}
                        className="h-8 text-xs"
                      />
                      <Input
                        type="number"
                        placeholder="linear ft"
                        value={a.linear_ft}
                        onChange={(e) => updateArea(idx, { linear_ft: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Subfloor condition, transitions, etc." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Save measurement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
