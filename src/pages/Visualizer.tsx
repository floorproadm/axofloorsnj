import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { Link } from "react-router-dom";
import PhotoUploader from "@/components/visualizer/PhotoUploader";
import FloorCornerEditor from "@/components/visualizer/FloorCornerEditor";
import FloorOverlay from "@/components/visualizer/FloorOverlay";
import FloorSwatchCarousel from "@/components/visualizer/FloorSwatchCarousel";
import VisualizerControls from "@/components/visualizer/VisualizerControls";
import RequestEstimateCta from "@/components/visualizer/RequestEstimateCta";
import { TEXTURES, type FloorTexture } from "@/lib/visualizer/textures";
import type { Pt } from "@/lib/visualizer/homography";

const DEFAULT_CORNERS: [Pt, Pt, Pt, Pt] = [
  { x: 0.25, y: 0.55 }, // TL
  { x: 0.75, y: 0.55 }, // TR
  { x: 0.95, y: 0.92 }, // BR
  { x: 0.05, y: 0.92 }, // BL
];

export default function Visualizer() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const [corners, setCorners] = useState<[Pt, Pt, Pt, Pt]>(DEFAULT_CORNERS);
  const [texture, setTexture] = useState<FloorTexture>(TEXTURES[0]);
  const [scale, setScale] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(85);

  const stageRef = useRef<HTMLDivElement>(null);

  // Measure stage when photo loads / on resize
  useEffect(() => {
    if (!photo || !imgSize) return;
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const containerW = el.clientWidth;
      const aspect = imgSize.h / imgSize.w;
      const h = containerW * aspect;
      setStageSize({ w: containerW, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [photo, imgSize]);

  const handlePhoto = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      setImgSize({ w: img.width, h: img.height });
      setPhoto(dataUrl);
      setCorners(DEFAULT_CORNERS);
    };
    img.src = dataUrl;
  };

  const reset = () => {
    setCorners(DEFAULT_CORNERS);
    setScale(100);
    setRotation(0);
    setOpacity(85);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Link>
          <h1 className="text-sm font-semibold">Floor Visualizer</h1>
          {photo ? (
            <button
              onClick={() => {
                setPhoto(null);
                setImgSize(null);
              }}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ImagePlus className="h-4 w-4 mr-1.5" />
              New
            </button>
          ) : (
            <span className="w-12" />
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 pb-12">
        {!photo ? (
          <PhotoUploader onPhoto={handlePhoto} />
        ) : (
          <div className="space-y-4">
            <div
              ref={stageRef}
              className="relative w-full overflow-hidden rounded-xl border bg-muted shadow-sm"
              style={{ height: stageSize.h || undefined }}
            >
              <img
                src={photo}
                alt="Your room"
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                draggable={false}
              />
              {stageSize.w > 0 && (
                <>
                  <FloorOverlay
                    width={stageSize.w}
                    height={stageSize.h}
                    corners={corners}
                    texture={texture}
                    scalePct={scale}
                    rotationDeg={rotation}
                    opacityPct={opacity}
                  />
                  <FloorCornerEditor
                    width={stageSize.w}
                    height={stageSize.h}
                    corners={corners}
                    onChange={setCorners}
                  />
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Pick a floor</h2>
                <span className="text-xs text-muted-foreground">{TEXTURES.length} styles</span>
              </div>
              <FloorSwatchCarousel selectedId={texture.id} onSelect={setTexture} />
            </div>

            <VisualizerControls
              scale={scale}
              rotation={rotation}
              opacity={opacity}
              onScale={setScale}
              onRotation={setRotation}
              onOpacity={setOpacity}
              onReset={reset}
            />

            <RequestEstimateCta floorName={texture.name} />

            <p className="text-[11px] leading-relaxed text-muted-foreground text-center">
              Preview is an approximation. Final color and grain depend on lighting, sub-floor and finish.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
