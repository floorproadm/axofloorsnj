import { TEXTURES, type FloorTexture } from "@/lib/visualizer/textures";
import { cn } from "@/lib/utils";

type Props = {
  selectedId: string;
  onSelect: (t: FloorTexture) => void;
};

export default function FloorSwatchCarousel({ selectedId, onSelect }: Props) {
  return (
    <div className="w-full overflow-x-auto -mx-4 px-4">
      <div className="flex gap-3 pb-2">
        {TEXTURES.map((t) => {
          const active = t.id === selectedId;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className={cn(
                "shrink-0 flex flex-col items-center gap-1.5 group",
                "focus:outline-none"
              )}
            >
              <div
                className={cn(
                  "h-16 w-16 rounded-lg border-2 transition-all shadow-sm",
                  active
                    ? "border-primary ring-2 ring-primary/30 scale-105"
                    : "border-border group-hover:border-primary/50"
                )}
                style={{
                  backgroundImage: t.swatch,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <span
                className={cn(
                  "text-[10px] leading-tight max-w-[72px] text-center truncate",
                  active ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                {t.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
