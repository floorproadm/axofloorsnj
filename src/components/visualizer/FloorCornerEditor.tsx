import { useCallback, useRef } from "react";
import type { Pt } from "@/lib/visualizer/homography";

type Props = {
  width: number;
  height: number;
  corners: [Pt, Pt, Pt, Pt];
  onChange: (next: [Pt, Pt, Pt, Pt]) => void;
};

const LABELS = ["TL", "TR", "BR", "BL"] as const;

export default function FloorCornerEditor({ width, height, corners, onChange }: Props) {
  const dragRef = useRef<number | null>(null);

  const startDrag = useCallback(
    (index: number) => (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      dragRef.current = index;
    },
    []
  );

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const i = dragRef.current;
      if (i == null) return;
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const clamped = { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
      const next = corners.slice() as [Pt, Pt, Pt, Pt];
      next[i] = clamped;
      onChange(next);
    },
    [corners, onChange]
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  }, []);

  // Build polygon points string
  const points = corners.map((c) => `${c.x * width},${c.y * height}`).join(" ");

  return (
    <div
      className="absolute inset-0"
      onPointerMove={onMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{ touchAction: "none" }}
    >
      <svg
        className="absolute inset-0 pointer-events-none"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <polygon
          points={points}
          fill="hsl(var(--primary) / 0.08)"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          strokeDasharray="6 5"
        />
      </svg>
      {corners.map((c, i) => (
        <div
          key={i}
          role="slider"
          aria-label={`Corner ${LABELS[i]}`}
          onPointerDown={startDrag(i)}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/25 flex items-center justify-center font-semibold select-none"
          style={{
            left: c.x * width,
            top: c.y * height,
            width: 36,
            height: 36,
            fontSize: 11,
            cursor: "grab",
            touchAction: "none",
          }}
        >
          {LABELS[i]}
        </div>
      ))}
    </div>
  );
}
