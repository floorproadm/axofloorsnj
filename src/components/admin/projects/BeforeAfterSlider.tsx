import { useRef, useState, useCallback, useEffect } from "react";

interface Props {
  beforeUrl: string;
  afterUrl: string;
  className?: string;
}

/**
 * Draggable before/after comparison slider.
 * Zero dependencies — uses pointer events + clip-path.
 */
export function BeforeAfterSlider({ beforeUrl, afterUrl, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // %
  const draggingRef = useRef(false);

  const move = useCallback((clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, p)));
  }, []);

  useEffect(() => {
    const up = () => (draggingRef.current = false);
    const mv = (e: PointerEvent) => {
      if (draggingRef.current) move(e.clientX);
    };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointermove", mv);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointermove", mv);
    };
  }, [move]);

  return (
    <div
      ref={wrapRef}
      className={`relative w-full overflow-hidden rounded-lg bg-muted select-none touch-none ${className ?? ""}`}
      style={{ aspectRatio: "16 / 10" }}
      onPointerDown={(e) => {
        draggingRef.current = true;
        move(e.clientX);
      }}
    >
      {/* After (full) */}
      <img
        src={afterUrl}
        alt="After"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      {/* Before (clipped) */}
      <img
        src={beforeUrl}
        alt="Before"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        draggable={false}
      />

      {/* Labels */}
      <span className="absolute top-2 left-2 text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-background/85 text-foreground">
        Before
      </span>
      <span className="absolute top-2 right-2 text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded bg-background/85 text-foreground">
        After
      </span>

      {/* Divider */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,.3)]"
        style={{ left: `${pos}%` }}
      />
      <div
        className="absolute h-9 w-9 rounded-full bg-white shadow-lg border border-border flex items-center justify-center -translate-x-1/2 top-1/2 -translate-y-1/2 cursor-ew-resize"
        style={{ left: `${pos}%` }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-foreground">
          <path d="M8 5l-5 7 5 7M16 5l5 7-5 7" />
        </svg>
      </div>
    </div>
  );
}
