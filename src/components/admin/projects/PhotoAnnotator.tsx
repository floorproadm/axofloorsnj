import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowUpRight, Circle, Square, Type, Eraser, X, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ProjectPhoto } from "@/hooks/useProjectPhotos";

type Tool = "pen" | "arrow" | "circle" | "rect" | "text" | "eraser";

interface Stroke {
  tool: Tool;
  color: string;
  width: number;
  points: { x: number; y: number }[];
  text?: string;
}

const COLORS = ["#ef4444", "#facc15", "#22c55e", "#ffffff", "#000000"];
const WIDTHS = [{ k: "thin", v: 2 }, { k: "med", v: 5 }, { k: "thick", v: 10 }];

interface Props {
  photo: ProjectPhoto;
  imageUrl: string;
  onClose: () => void;
}

export function PhotoAnnotator({ photo, imageUrl, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [editing, setEditing] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(5);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<Stroke | null>(null);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  // Render strokes whenever they change
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    [...strokes, ...(current ? [current] : [])].forEach((s) => drawStroke(ctx, s));
  }, [strokes, current]);

  function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const pts = s.points;
    if (pts.length === 0) return;

    if (s.tool === "pen" || s.tool === "eraser") {
      if (s.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = s.width * 3;
      }
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    } else if (s.tool === "rect" && pts.length >= 2) {
      const [a, b] = [pts[0], pts[pts.length - 1]];
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    } else if (s.tool === "circle" && pts.length >= 2) {
      const [a, b] = [pts[0], pts[pts.length - 1]];
      ctx.beginPath();
      ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (s.tool === "arrow" && pts.length >= 2) {
      const [a, b] = [pts[0], pts[pts.length - 1]];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const head = Math.max(15, s.width * 4);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - head * Math.cos(angle - Math.PI / 6), b.y - head * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(b.x - head * Math.cos(angle + Math.PI / 6), b.y - head * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    } else if (s.tool === "text" && s.text) {
      const size = Math.max(20, s.width * 6);
      ctx.font = `bold ${size}px system-ui, sans-serif`;
      ctx.fillText(s.text, pts[0].x, pts[0].y);
    }
  }

  function toCanvasCoords(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!editing) return;
    const p = toCanvasCoords(e);
    if (tool === "text") {
      const text = window.prompt("Texto:");
      if (text) setStrokes((s) => [...s, { tool, color, width, points: [p], text }]);
      return;
    }
    setCurrent({ tool, color, width, points: [p] });
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!current) return;
    const p = toCanvasCoords(e);
    setCurrent((c) => c && { ...c, points: [...c.points, p] });
  }

  function handlePointerUp() {
    if (!current) return;
    setStrokes((s) => [...s, current]);
    setCurrent(null);
  }

  async function handleSave() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    setSaving(true);
    try {
      // Composite image + canvas
      const out = document.createElement("canvas");
      out.width = img.naturalWidth;
      out.height = img.naturalHeight;
      const ctx = out.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      ctx.drawImage(canvas, 0, 0);

      const blob: Blob = await new Promise((res) =>
        out.toBlob((b) => res(b!), "image/jpeg", 0.9)
      );

      const path = `${photo.project_id}/${photo.id}-annotated-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("project-photos")
        .upload(path, blob, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("project-photos").getPublicUrl(path);

      const { error } = await supabase
        .from("project_photos" as any)
        .update({ annotated_url: pub.publicUrl } as any)
        .eq("id", photo.id);
      if (error) throw error;

      toast({ title: "Anotação salva" });
      qc.invalidateQueries({ queryKey: ["project_photos"] });
      onClose();
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-3 border-b bg-card">
        <div className="flex items-center gap-1.5 flex-wrap">
          {!editing ? (
            <Button size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Anotar
            </Button>
          ) : (
            <>
              <ToolBtn active={tool === "pen"} onClick={() => setTool("pen")} icon={<Pencil className="h-3.5 w-3.5" />} label="Caneta" />
              <ToolBtn active={tool === "arrow"} onClick={() => setTool("arrow")} icon={<ArrowUpRight className="h-3.5 w-3.5" />} label="Seta" />
              <ToolBtn active={tool === "circle"} onClick={() => setTool("circle")} icon={<Circle className="h-3.5 w-3.5" />} label="Círculo" />
              <ToolBtn active={tool === "rect"} onClick={() => setTool("rect")} icon={<Square className="h-3.5 w-3.5" />} label="Retângulo" />
              <ToolBtn active={tool === "text"} onClick={() => setTool("text")} icon={<Type className="h-3.5 w-3.5" />} label="Texto" />
              <ToolBtn active={tool === "eraser"} onClick={() => setTool("eraser")} icon={<Eraser className="h-3.5 w-3.5" />} label="Apagar" />

              <span className="mx-2 h-6 w-px bg-border" />
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-all",
                    color === c ? "border-primary scale-110" : "border-border"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <span className="mx-2 h-6 w-px bg-border" />
              {WIDTHS.map((w) => (
                <button
                  key={w.k}
                  onClick={() => setWidth(w.v)}
                  className={cn(
                    "h-7 px-2 rounded text-xs font-medium transition",
                    width === w.v ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
                  )}
                >
                  {w.k}
                </button>
              ))}
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {editing && (
            <>
              <Button size="sm" variant="ghost" onClick={() => { setStrokes([]); setEditing(false); }}>
                <X className="h-3.5 w-3.5 mr-1.5" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || strokes.length === 0}>
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                Salvar Anotação
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </div>

      {/* Stage */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <div className="relative max-h-full max-w-full">
          <img
            ref={imgRef}
            src={imageUrl}
            alt=""
            crossOrigin="anonymous"
            onLoad={() => setStrokes((s) => [...s])} // trigger sizing
            className="block max-h-[calc(100vh-120px)] max-w-full object-contain select-none pointer-events-none"
          />
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={cn(
              "absolute inset-0 w-full h-full",
              editing ? "cursor-crosshair touch-none" : "pointer-events-none"
            )}
          />
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "h-7 px-2 rounded flex items-center gap-1 text-xs transition",
        active ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"
      )}
    >
      {icon}
    </button>
  );
}
