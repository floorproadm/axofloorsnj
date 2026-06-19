import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Photo {
  id: string;
  title: string;
  image_url: string;
  category: string | null;
  location: string | null;
  service_category: string | null;
  tag: string | null;
  paired_before_id: string | null;
}

interface Props {
  photoIds: string[];
  primaryColor?: string;
}

/** Before/After comparative slider */
function BeforeAfterSlider({ before, after }: { before: Photo; after: Photo }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);

  const move = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    setPos((x / rect.width) * 100);
  };

  return (
    <div
      ref={ref}
      className="relative w-full aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 select-none cursor-ew-resize"
      onMouseMove={(e) => e.buttons === 1 && move(e.clientX)}
      onMouseDown={(e) => move(e.clientX)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
    >
      <img src={after.image_url} alt={after.title} className="absolute inset-0 w-full h-full object-cover" />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <img
          src={before.image_url}
          alt={before.title}
          className="absolute inset-0 h-full object-cover"
          style={{ width: `${100 / (pos / 100)}%`, maxWidth: "none" }}
        />
      </div>
      {/* Divider */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md pointer-events-none"
        style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600">
          ⇆
        </div>
      </div>
      <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
        Before
      </span>
      <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
        After
      </span>
    </div>
  );
}

export function PublicPortfolioGrid({ photoIds, primaryColor = "#d97706" }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!photoIds || photoIds.length === 0) {
      setLoading(false);
      return;
    }
    (async () => {
      // Fetch selected + any "before" partners
      const { data: selected } = await supabase
        .from("gallery_projects")
        .select("id, title, image_url, category, location, service_category, tag, paired_before_id")
        .in("id", photoIds);
      const sel = ((selected as any) || []) as Photo[];

      const beforeIds = sel
        .map((p) => p.paired_before_id)
        .filter((id): id is string => !!id && !photoIds.includes(id));

      let beforePhotos: Photo[] = [];
      if (beforeIds.length > 0) {
        const { data: bd } = await supabase
          .from("gallery_projects")
          .select("id, title, image_url, category, location, service_category, tag, paired_before_id")
          .in("id", beforeIds);
        beforePhotos = ((bd as any) || []) as Photo[];
      }

      // Preserve original order from photoIds
      const byId = new Map<string, Photo>();
      [...sel, ...beforePhotos].forEach((p) => byId.set(p.id, p));
      const ordered = photoIds.map((id) => byId.get(id)).filter(Boolean) as Photo[];
      // Attach hidden "before" lookup
      (ordered as any).__beforeMap = byId;
      setPhotos(ordered);
      setLoading(false);
    })();
  }, [photoIds]);

  const items = useMemo(() => {
    const byId: Map<string, Photo> | undefined = (photos as any).__beforeMap;
    return photos.map((p) => {
      // If photo is an "After" with paired before, render slider
      if (p.tag === "After" && p.paired_before_id && byId?.get(p.paired_before_id)) {
        return { kind: "compare" as const, after: p, before: byId.get(p.paired_before_id)! };
      }
      return { kind: "single" as const, photo: p };
    });
  }, [photos]);

  if (loading || photoIds.length === 0) return null;
  if (photos.length === 0) return null;

  return (
    <section className="space-y-3 pt-2">
      <h3
        className="text-[10px] font-semibold uppercase tracking-[2px]"
        style={{ color: primaryColor }}
      >
        Veja nossos trabalhos anteriores
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((it, idx) =>
          it.kind === "compare" ? (
            <div key={`c-${idx}`} className="sm:col-span-2">
              <BeforeAfterSlider before={it.before} after={it.after} />
              <p className="mt-1.5 text-[11px] text-slate-600">
                {[it.after.service_category || it.after.category, it.after.location]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          ) : (
            <figure key={it.photo.id} className="space-y-1.5">
              <div className="aspect-[4/3] overflow-hidden rounded-lg border border-slate-200">
                <img
                  src={it.photo.image_url}
                  alt={it.photo.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <figcaption className="text-[11px] text-slate-600">
                {[
                  it.photo.service_category || it.photo.category,
                  it.photo.location,
                ]
                  .filter(Boolean)
                  .join(" · ") || it.photo.title}
              </figcaption>
            </figure>
          )
        )}
      </div>
    </section>
  );
}
