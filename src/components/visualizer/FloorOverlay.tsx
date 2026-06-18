import { useMemo } from "react";
import type { Pt } from "@/lib/visualizer/homography";
import { homographyFromUnitSquare, homographyToMatrix3d } from "@/lib/visualizer/homography";
import type { FloorTexture } from "@/lib/visualizer/textures";

type Props = {
  width: number;
  height: number;
  corners: [Pt, Pt, Pt, Pt]; // normalized 0..1, TL, TR, BR, BL
  texture: FloorTexture;
  scalePct: number;
  rotationDeg: number;
  opacityPct: number;
};

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
  // Pattern occupies the full SRCxSRC area; we over-size and rotate so it
  // still covers after rotation.
  const overscan = 1.6;
  const inner = SRC * overscan;
  const offset = -(SRC * (overscan - 1)) / 2;

  return (
    <div
      aria-hidden
      className="absolute top-0 left-0 pointer-events-none overflow-hidden"
      style={{
        width: SRC,
        height: SRC,
        transformOrigin: "0 0",
        transform,
        opacity: opacityPct / 100,
        willChange: "transform",
      }}
    >
      <div
        className="absolute"
        style={{
          left: offset,
          top: offset,
          width: inner,
          height: inner,
          backgroundImage: texture.url,
          backgroundRepeat: "repeat",
          backgroundSize: `${tile}px ${tile * 0.25}px`,
          transform: `rotate(${rotationDeg}deg)`,
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}
