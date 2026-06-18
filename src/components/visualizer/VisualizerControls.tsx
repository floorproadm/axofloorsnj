import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

type Props = {
  scale: number;
  rotation: number;
  opacity: number;
  onScale: (v: number) => void;
  onRotation: (v: number) => void;
  onOpacity: (v: number) => void;
  onReset: () => void;
};

export default function VisualizerControls({
  scale,
  rotation,
  opacity,
  onScale,
  onRotation,
  onOpacity,
  onReset,
}: Props) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Adjust the look</h3>
        <Button size="sm" variant="ghost" onClick={onReset} className="h-8">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset
        </Button>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Plank size</span>
          <span className="font-mono tabular-nums">{scale}%</span>
        </div>
        <Slider value={[scale]} min={50} max={300} step={5} onValueChange={(v) => onScale(v[0])} />
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Rotation</span>
          <span className="font-mono tabular-nums">{rotation}°</span>
        </div>
        <Slider value={[rotation]} min={-45} max={45} step={1} onValueChange={(v) => onRotation(v[0])} />
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Blend</span>
          <span className="font-mono tabular-nums">{opacity}%</span>
        </div>
        <Slider value={[opacity]} min={50} max={100} step={1} onValueChange={(v) => onOpacity(v[0])} />
      </div>
    </div>
  );
}
