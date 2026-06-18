import { useRef, useState } from "react";

type Props = { before: string; after: string };

export default function BeforeAfterSlider({ before, after }: Props) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateFromClientX = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, x)));
  };

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black select-none touch-none"
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        updateFromClientX(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && updateFromClientX(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <img src={after} alt="After" className="block w-full h-auto" draggable={false} />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <img
          src={before}
          alt="Before"
          className="block h-full w-auto max-w-none"
          style={{ width: `${(100 / pos) * 100}%` }}
          draggable={false}
        />
      </div>

      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] pointer-events-none"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black">
            <path d="M9 18l-6-6 6-6M15 6l6 6-6 6" />
          </svg>
        </div>
      </div>

      <span className="absolute top-2 left-2 text-[10px] font-medium tracking-widest uppercase text-white bg-black/60 px-2 py-1 rounded">
        Before
      </span>
      <span className="absolute top-2 right-2 text-[10px] font-medium tracking-widest uppercase text-white bg-black/60 px-2 py-1 rounded">
        After
      </span>
    </div>
  );
}
