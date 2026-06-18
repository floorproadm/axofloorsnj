import { useMemo } from "react";
import type { Pt } from "@/lib/visualizer/homography";
import { homographyFromUnitSquare, homographyToMatrix3d } from "@/lib/visualizer/homography";
import type { FloorTexture } from "@/lib/visualizer/textures";

type Props = {
  width: number;
  height: number;
  corners: [Pt, Pt, Pt, Pt]; // normalized 0..1, TL, TR, BR, BL
  texture: FloorTexture;
  scalePct: number; // 50..300
  rotationDeg: number; // -45..45
  opacityPct: number; // 50..100
};

// We render a 1000x1000 div, apply matrix3d that maps unit square -> destination quad (px).
const SRC = 1000;

export default function FloorOverlay({
  width,
  height,
  corners,
  texture,
  scalePct,
  rotationDeg,
  opacityPct,
}: Props) {
  const transform = useMemo(() => {
    const dst: [Pt, Pt, Pt, Pt] = [
      { x: corners[0].x * width, y: corners[0].y * height },
      { x: corners[1].x * width, y: corners[1].y * height },
      { x: corners[2].x * width, y: corners[2].y * height },
      { x: corners[3].x * width, y: corners[3].y * height },
    ];
    // Map unit square -> dst in pixels, but our source div is SRC px wide.
    // So pre-scale by 1/SRC: matrix = H * diag(1/SRC, 1/SRC, 1)
    const H = homographyFromUnitSquare(dst);
    const s = 1 / SRC;
    const scaled = [
      H[0] * s, H[1] * s, H[2],
      H[3] * s, H[4] * s, H[5],
      H[6] * s, H[7] * s, H[8],
    ];
    return homographyToMatrix3d(scaled);
  }, [corners, width, height]);

  const tile = (texture.baseSize * scalePct) / 100;

  return (
    <div
      aria-hidden
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        width: SRC,
        height: SRC,
        transformOrigin: "0 0",
        transform,
        opacity: opacityPct / 100,
        backgroundImage: texture.url,
        backgroundRepeat: "repeat",
        backgroundSize: `${tile}px ${tile * 0.25}px`,
        // rotation applied via background; we cheat by rotating the whole pattern via outer div instead
        willChange: "transform",
      }}
    >
      {rotationDeg !== 0 && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: texture.url,
            backgroundRepeat: "repeat",
            backgroundSize: `${tile}px ${tile * 0.25}px`,
            transform: `rotate(${rotationDeg}deg)`,
            transformOrigin: "center center",
          }}
        />
      )}
    </div>
  );
}
